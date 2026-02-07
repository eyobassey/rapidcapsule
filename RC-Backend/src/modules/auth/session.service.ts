import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Session, SessionDocument } from './entities/session.entity';

interface DeviceInfo {
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
}

interface LocationInfo {
  city: string;
  country: string;
  location: string;
}

interface RequestLike {
  headers?: Record<string, string | string[]>;
  ip?: string;
  connection?: { remoteAddress?: string };
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectModel(Session.name)
    private sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Extract the real client IP from request headers (handles proxies like nginx)
   */
  getClientIP(req: RequestLike): string {
    // Check X-Forwarded-For header (standard for proxies)
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2, ...
      // The first one is the original client IP
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      const clientIP = ips?.trim();
      if (clientIP && clientIP !== '127.0.0.1' && clientIP !== '::1') {
        return clientIP;
      }
    }

    // Check X-Real-IP header (nginx specific)
    const realIP = req.headers?.['x-real-ip'];
    if (realIP) {
      const ip = Array.isArray(realIP) ? realIP[0] : realIP;
      if (ip && ip !== '127.0.0.1' && ip !== '::1') {
        return ip;
      }
    }

    // Check CF-Connecting-IP header (Cloudflare)
    const cfIP = req.headers?.['cf-connecting-ip'];
    if (cfIP) {
      const ip = Array.isArray(cfIP) ? cfIP[0] : cfIP;
      if (ip && ip !== '127.0.0.1' && ip !== '::1') {
        return ip;
      }
    }

    // Fallback to req.ip or connection.remoteAddress
    let ip = req.ip || req.connection?.remoteAddress || '';

    // Remove IPv6 prefix if present (::ffff:192.168.1.1 -> 192.168.1.1)
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }

    return ip || 'Unknown';
  }

  /**
   * Get location information from IP address using ip-api.com
   */
  async getLocationFromIP(ipAddress: string): Promise<LocationInfo> {
    const defaultLocation: LocationInfo = {
      city: '',
      country: '',
      location: '',
    };

    // Skip for localhost/private IPs
    if (
      !ipAddress ||
      ipAddress === 'Unknown' ||
      ipAddress === '127.0.0.1' ||
      ipAddress === '::1' ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')
    ) {
      return defaultLocation;
    }

    try {
      // Using ip-api.com (free, no API key needed, 45 requests/minute limit)
      const response = await axios.get(
        `http://ip-api.com/json/${ipAddress}?fields=status,city,country`,
        { timeout: 3000 },
      );

      if (response.data && response.data.status === 'success') {
        const city = response.data.city || '';
        const country = response.data.country || '';
        const location = [city, country].filter(Boolean).join(', ');

        return { city, country, location };
      }
    } catch (error) {
      this.logger.warn(`Failed to get location for IP ${ipAddress}: ${error.message}`);
    }

    return defaultLocation;
  }

  /**
   * Parse user agent string to extract device information
   */
  parseUserAgent(userAgent: string): DeviceInfo {
    const ua = userAgent || '';

    // Detect device type and name
    let deviceType = 'desktop';
    let deviceName = 'Unknown Device';
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Detect OS
    if (/iPhone/i.test(ua)) {
      os = 'iOS';
      deviceType = 'mobile';
      deviceName = 'iPhone';
      const match = ua.match(/iPhone OS (\d+[_\d]*)/);
      if (match) os = `iOS ${match[1].replace(/_/g, '.')}`;
    } else if (/iPad/i.test(ua)) {
      os = 'iPadOS';
      deviceType = 'tablet';
      deviceName = 'iPad';
    } else if (/Android/i.test(ua)) {
      os = 'Android';
      deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet';
      deviceName = deviceType === 'mobile' ? 'Android Phone' : 'Android Tablet';
      const match = ua.match(/Android (\d+[.\d]*)/);
      if (match) os = `Android ${match[1]}`;
    } else if (/Windows/i.test(ua)) {
      os = 'Windows';
      deviceType = 'desktop';
      if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
      else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
      else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
    } else if (/Macintosh/i.test(ua)) {
      os = 'macOS';
      deviceType = 'desktop';
      deviceName = 'Mac';
      const match = ua.match(/Mac OS X (\d+[_\d]*)/);
      if (match) os = `macOS ${match[1].replace(/_/g, '.')}`;
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
      deviceType = 'desktop';
    }

    // Detect browser
    if (/Edg\//i.test(ua)) {
      browser = 'Microsoft Edge';
      const match = ua.match(/Edg\/(\d+)/);
      if (match) browser = `Edge ${match[1]}`;
    } else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      if (match) browser = `Chrome ${match[1]}`;
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+[.\d]*)/);
      if (match) browser = `Safari ${match[1]}`;
    } else if (/Firefox/i.test(ua)) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      if (match) browser = `Firefox ${match[1]}`;
    }

    // Build device name
    if (deviceType === 'desktop') {
      deviceName = `${browser} on ${os}`;
    }

    return { deviceName, deviceType, browser, os };
  }

  /**
   * Create a new session when user logs in
   */
  async createSession(
    userId: Types.ObjectId,
    userAgent: string,
    ipAddress?: string,
  ): Promise<{ session: SessionDocument; tokenId: string }> {
    const tokenId = uuidv4();
    const deviceInfo = this.parseUserAgent(userAgent);

    // Get location from IP (non-blocking, with fallback)
    const locationInfo = await this.getLocationFromIP(ipAddress || '');

    const session = await this.sessionModel.create({
      userId,
      tokenId,
      ...deviceInfo,
      ipAddress: ipAddress || 'Unknown',
      ...locationInfo,
      lastActiveAt: new Date(),
    });

    return { session, tokenId };
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(
    userId: Types.ObjectId | string,
    currentTokenId?: string,
  ): Promise<SessionDocument[]> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const sessions = await this.sessionModel
      .find({
        $or: [{ userId: userObjectId }, { userId: userObjectId.toString() }],
        isRevoked: false,
      })
      .sort({ lastActiveAt: -1 })
      .lean();

    // Mark current session
    return sessions.map((session) => ({
      ...session,
      isCurrent: session.tokenId === currentTokenId,
    })) as SessionDocument[];
  }

  /**
   * Update last active time for a session
   */
  async updateLastActive(tokenId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { tokenId, isRevoked: false },
      { lastActiveAt: new Date() },
    );
  }

  /**
   * Validate if a session is still active
   */
  async isSessionValid(tokenId: string): Promise<boolean> {
    const session = await this.sessionModel.findOne({
      tokenId,
      isRevoked: false,
    });
    return !!session;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(
    userId: Types.ObjectId | string,
    sessionId: string,
  ): Promise<boolean> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const result = await this.sessionModel.updateOne(
      {
        _id: new Types.ObjectId(sessionId),
        $or: [{ userId: userObjectId }, { userId: userObjectId.toString() }],
        isRevoked: false,
      },
      { isRevoked: true, revokedAt: new Date() },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeAllOtherSessions(
    userId: Types.ObjectId | string,
    currentTokenId: string,
  ): Promise<number> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const result = await this.sessionModel.updateMany(
      {
        $or: [{ userId: userObjectId }, { userId: userObjectId.toString() }],
        tokenId: { $ne: currentTokenId },
        isRevoked: false,
      },
      { isRevoked: true, revokedAt: new Date() },
    );
    return result.modifiedCount;
  }

  /**
   * Revoke all sessions for a user (for password change, etc.)
   */
  async revokeAllSessions(userId: Types.ObjectId | string): Promise<number> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const result = await this.sessionModel.updateMany(
      {
        $or: [{ userId: userObjectId }, { userId: userObjectId.toString() }],
        isRevoked: false,
      },
      { isRevoked: true, revokedAt: new Date() },
    );
    return result.modifiedCount;
  }

  /**
   * Get session by token ID
   */
  async getSessionByTokenId(tokenId: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ tokenId, isRevoked: false });
  }

  /**
   * Count active sessions for a user
   */
  async countActiveSessions(userId: Types.ObjectId | string): Promise<number> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return this.sessionModel.countDocuments({
      $or: [{ userId: userObjectId }, { userId: userObjectId.toString() }],
      isRevoked: false,
    });
  }
}
