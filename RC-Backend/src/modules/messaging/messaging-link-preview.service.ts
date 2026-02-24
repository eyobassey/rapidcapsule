import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Message, MessageDocument } from './entities/message.entity';

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  site_name?: string;
  type?: string;
  video_embed_url?: string;
}

/** Regex to extract URLs from message text */
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

/** Timeout for fetching a page (ms) */
const FETCH_TIMEOUT = 5000;

/** Max URLs to preview per message */
const MAX_PREVIEWS = 3;

@Injectable()
export class MessagingLinkPreviewService {
  private readonly logger = new Logger(MessagingLinkPreviewService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  /**
   * Extract URLs from message content, fetch OG metadata, and update the message.
   * Called asynchronously after message send — does NOT block the send response.
   * Returns the link_previews array (or empty) so the caller can emit a WS update.
   */
  async processMessageLinks(messageId: string): Promise<LinkPreview[]> {
    try {
      const message = await this.messageModel.findById(messageId).lean();
      if (!message?.content) return [];

      const urls = this.extractUrls(message.content);
      if (urls.length === 0) return [];

      const previews: LinkPreview[] = [];

      for (const url of urls.slice(0, MAX_PREVIEWS)) {
        try {
          const preview = await this.fetchLinkPreview(url);
          if (preview) previews.push(preview);
        } catch (err) {
          this.logger.warn(`Failed to fetch preview for ${url}: ${err.message}`);
        }
      }

      if (previews.length === 0) return [];

      // Update message with link previews
      await this.messageModel.findByIdAndUpdate(messageId, {
        link_previews: previews,
      });

      return previews;
    } catch (err) {
      this.logger.error(`Link preview processing failed for message ${messageId}: ${err.message}`);
      return [];
    }
  }

  /**
   * Extract valid HTTP(S) URLs from text
   */
  private extractUrls(text: string): string[] {
    const matches = text.match(URL_REGEX);
    if (!matches) return [];

    // Deduplicate
    return [...new Set(matches)];
  }

  /**
   * Fetch a URL and extract Open Graph / meta tags
   */
  private async fetchLinkPreview(url: string): Promise<LinkPreview | null> {
    // Skip private/internal IPs
    if (this.isPrivateUrl(url)) return null;

    const parsed = new URL(url);
    const domain = parsed.hostname;

    // Check for YouTube/Vimeo embeds first
    const videoEmbed = this.extractVideoEmbed(url);

    let title: string | undefined;
    let description: string | undefined;
    let image: string | undefined;
    let siteName: string | undefined;
    let ogType: string | undefined;

    try {
      const response = await axios.get(url, {
        timeout: FETCH_TIMEOUT,
        maxRedirects: 3,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RapidCapsuleBot/1.0)',
          'Accept': 'text/html',
        },
        // Only read first 50KB to avoid downloading huge pages
        maxContentLength: 50 * 1024,
        responseType: 'text',
      });

      const html = typeof response.data === 'string' ? response.data : '';

      title = this.extractMeta(html, 'og:title') || this.extractTitle(html);
      description = this.extractMeta(html, 'og:description') || this.extractMeta(html, 'description');
      image = this.extractMeta(html, 'og:image');
      siteName = this.extractMeta(html, 'og:site_name');
      ogType = this.extractMeta(html, 'og:type');
    } catch {
      // If fetch fails but we have a video embed, still return it
      if (!videoEmbed) return null;
    }

    // For YouTube, use known thumbnail if OG image is missing
    if (videoEmbed && !image) {
      const ytId = this.extractYouTubeId(url);
      if (ytId) {
        image = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        title = title || 'YouTube Video';
        siteName = siteName || 'YouTube';
      }
    }

    // If we got nothing useful, skip
    if (!title && !description && !image && !videoEmbed) return null;

    // Truncate fields
    if (title && title.length > 200) title = title.substring(0, 200) + '...';
    if (description && description.length > 300) description = description.substring(0, 300) + '...';

    return {
      url,
      title,
      description,
      image,
      domain,
      site_name: siteName,
      type: ogType,
      video_embed_url: videoEmbed || undefined,
    };
  }

  /**
   * Extract Open Graph or regular meta tag content
   */
  private extractMeta(html: string, property: string): string | undefined {
    // Try og:property and name="property"
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
    ];

    for (const regex of patterns) {
      const match = html.match(regex);
      if (match?.[1]) return this.decodeHtmlEntities(match[1].trim());
    }

    return undefined;
  }

  /**
   * Extract <title> tag content
   */
  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match?.[1] ? this.decodeHtmlEntities(match[1].trim()) : undefined;
  }

  /**
   * Extract embeddable video URL for YouTube/Vimeo
   */
  private extractVideoEmbed(url: string): string | null {
    // YouTube
    const ytId = this.extractYouTubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null;
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const regex of patterns) {
      const match = url.match(regex);
      if (match?.[1]) return match[1];
    }

    return null;
  }

  /**
   * Block private/internal IPs to prevent SSRF
   */
  private isPrivateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;

      if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
      if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return true;
      if (hostname.startsWith('172.') && parseInt(hostname.split('.')[1]) >= 16 && parseInt(hostname.split('.')[1]) <= 31) return true;
      if (hostname === '0.0.0.0' || hostname === '::1') return true;

      return false;
    } catch {
      return true;
    }
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  }
}
