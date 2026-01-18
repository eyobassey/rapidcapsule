import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as process from 'process';

@Injectable()
export class FileUploadHelper {
  private S3: AWS.S3;
  constructor() {
    this.S3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region: 'us-east-2', // Set the correct region for your bucket
      signatureVersion: 'v4', // Use AWS Signature Version 4
    });
  }

  async uploadToS3(fileBuffer: Buffer, filename: string, folder?: string) {
    try {
      const key = folder
        ? `${folder}/${Date.now()}-${filename}`
        : `${Date.now()}-${filename}`;

      const location = await this.S3.upload({
        Bucket: <string>process.env.AWS_BUCKET_NAME,
        Body: fileBuffer,
        Key: key,
      }).promise();

      return location.Location;
    } catch (e) {
      console.error('S3 Upload Error:', e);
      throw new InternalServerErrorException('Error uploading to S3', e);
    }
  }

  async uploadMultipleToS3(files: Array<{ buffer: Buffer; filename: string }>, folder?: string) {
    try {
      const uploadPromises = files.map(file =>
        this.uploadToS3(file.buffer, file.filename, folder)
      );

      return await Promise.all(uploadPromises);
    } catch (e) {
      console.error('Multiple S3 Upload Error:', e);
      throw new InternalServerErrorException('Error uploading multiple files to S3', e);
    }
  }

  async deleteFromS3(fileUrl: string) {
    try {
      // Extract key from URL
      const urlParts = fileUrl.split('/');
      const key = urlParts.slice(3).join('/'); // Remove domain parts

      await this.S3.deleteObject({
        Bucket: <string>process.env.AWS_BUCKET_NAME,
        Key: key,
      }).promise();

      return true;
    } catch (e) {
      console.error('S3 Delete Error:', e);
      throw new InternalServerErrorException('Error deleting from S3', e);
    }
  }

  /**
   * Generate a presigned URL for temporary access to an S3 file
   * @param fileUrl The S3 file URL
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   * @returns Presigned URL
   */
  async getPresignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Extract key from URL
      const urlParts = fileUrl.split('/');
      const key = decodeURIComponent(urlParts.slice(3).join('/')); // Remove domain parts and decode

      const params = {
        Bucket: <string>process.env.AWS_BUCKET_NAME,
        Key: key,
        Expires: expiresIn,
      };

      return this.S3.getSignedUrl('getObject', params);
    } catch (e) {
      console.error('Presigned URL Error:', e);
      throw new InternalServerErrorException('Error generating presigned URL', e);
    }
  }

  /**
   * Get S3 key from file URL
   */
  getKeyFromUrl(fileUrl: string): string {
    const urlParts = fileUrl.split('/');
    return decodeURIComponent(urlParts.slice(3).join('/'));
  }
}
