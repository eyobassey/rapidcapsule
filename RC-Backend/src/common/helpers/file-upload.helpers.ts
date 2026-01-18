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
  async uploadToS3(fileBuffer: Buffer, filename: string) {
    try {
      const location = await this.S3.upload({
        Bucket: <string>process.env.AWS_BUCKET_NAME,
        Body: fileBuffer,
        Key: `${Date.now()}-${filename}`,
      }).promise();
      return location.Location;
    } catch (e) {
      throw new InternalServerErrorException('Error uploading to S3', e);
    }
  }

  async readAndDownloadFile() {
    try {
      // Set the parameters for the download
      const params = {
        Bucket: <string>process.env.AWS_BUCKET_NAME,
        Key: `AuthKey_${process.env.APPLE_KEY_ID}.p8`,
      };

      // Download the file from S3
      const data = await this.S3.getObject(params).promise();
      return data.Body?.toString('utf-8');
    } catch (e) {
      throw new InternalServerErrorException(e);
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
      // Remove any existing query parameters (e.g., old signing params)
      const baseUrl = fileUrl.split('?')[0];

      // Extract key from URL
      const urlParts = baseUrl.split('/');
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
    // Remove any existing query parameters
    const baseUrl = fileUrl.split('?')[0];
    const urlParts = baseUrl.split('/');
    return decodeURIComponent(urlParts.slice(3).join('/'));
  }
}
