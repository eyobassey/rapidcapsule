import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  voice: ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/mpeg'],
};

const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.image,
  ...ALLOWED_MIME_TYPES.video,
  ...ALLOWED_MIME_TYPES.document,
  ...ALLOWED_MIME_TYPES.voice,
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_VOICE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class MessagingUploadService {
  private readonly logger = new Logger(MessagingUploadService.name);

  constructor(private readonly fileUploadHelper: FileUploadHelper) {}

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALL_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: images, videos, documents, and voice notes.`,
      );
    }

    // Check size limits based on type
    if (ALLOWED_MIME_TYPES.video.includes(file.mimetype)) {
      if (file.size > MAX_VIDEO_SIZE) {
        throw new BadRequestException('Video files must be under 100MB');
      }
    } else if (ALLOWED_MIME_TYPES.voice.includes(file.mimetype)) {
      if (file.size > MAX_VOICE_SIZE) {
        throw new BadRequestException('Voice notes must be under 10MB');
      }
    } else {
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException('Files must be under 25MB');
      }
    }
  }

  async uploadAttachment(
    conversationId: string,
    file: Express.Multer.File,
    thumbnail?: Express.Multer.File,
  ): Promise<{
    original_name: string;
    s3_key: string;
    url: string;
    mime_type: string;
    size_bytes: number;
    thumbnail_url?: string;
    thumbnail_s3_key?: string;
  }> {
    this.validateFile(file);

    const ext = file.originalname.split('.').pop() || '';
    const s3Key = `messaging/${conversationId}/${Date.now()}-${uuidv4()}.${ext}`;

    const url = await this.fileUploadHelper.uploadToS3(file.buffer, s3Key, file.mimetype);

    const result: any = {
      original_name: file.originalname,
      s3_key: s3Key,
      url,
      mime_type: file.mimetype,
      size_bytes: file.size,
    };

    // Upload thumbnail if provided
    if (thumbnail && thumbnail.buffer.length > 0) {
      try {
        const thumbKey = `messaging/${conversationId}/thumbs/${Date.now()}-${uuidv4()}.jpg`;
        const thumbUrl = await this.fileUploadHelper.uploadToS3(
          thumbnail.buffer,
          thumbKey,
          'image/jpeg',
        );
        result.thumbnail_url = thumbUrl;
        result.thumbnail_s3_key = thumbKey;
      } catch (err) {
        this.logger.warn(`Failed to upload thumbnail: ${err.message}`);
      }
    }

    return result;
  }

  async getDownloadUrl(fileUrl: string): Promise<string> {
    return this.fileUploadHelper.getPresignedUrl(fileUrl, 3600);
  }
}
