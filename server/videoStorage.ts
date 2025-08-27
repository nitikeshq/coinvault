import AWS from 'aws-sdk';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';

interface StorageConfig {
  storageType: 'local' | 's3';
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3BucketName?: string;
  s3Region?: string;
  s3BaseUrl?: string;
  localBasePath?: string;
  maxFileSize?: number;
  allowedFormats?: string;
}

class VideoStorageService {
  private s3: AWS.S3 | null = null;
  private currentConfig: StorageConfig | null = null;

  async initializeStorage(): Promise<void> {
    const config = await storage.getActiveStorageSettings();
    this.currentConfig = config as StorageConfig;
    
    if (config?.storageType === 's3' && config.s3AccessKey) {
      this.s3 = new AWS.S3({
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey,
        region: config.s3Region || 'us-east-1',
      });
    }
  }

  async uploadVideo(file: Express.Multer.File, userId: string): Promise<string> {
    await this.initializeStorage();
    
    if (this.currentConfig?.storageType === 's3' && this.s3) {
      return this.uploadToS3(file, userId);
    } else {
      return this.uploadToLocal(file, userId);
    }
  }

  private async uploadToS3(file: Express.Multer.File, userId: string): Promise<string> {
    if (!this.s3 || !this.currentConfig) {
      throw new Error('S3 not configured');
    }

    const fileName = `videos/${userId}/${Date.now()}_${file.originalname}`;
    
    const params = {
      Bucket: this.currentConfig.s3BucketName!,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await this.s3.upload(params).promise();
    return this.currentConfig.s3BaseUrl 
      ? `${this.currentConfig.s3BaseUrl}/${fileName}`
      : result.Location;
  }

  private async uploadToLocal(file: Express.Multer.File, userId: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', 'videos', userId);
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure directory exists
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(filePath, file.buffer);
    
    return `/uploads/videos/${userId}/${fileName}`;
  }

  async deleteVideo(videoUrl: string): Promise<void> {
    await this.initializeStorage();
    
    if (this.currentConfig?.storageType === 's3' && this.s3) {
      // Extract key from S3 URL and delete
      const urlParts = videoUrl.split('/');
      const key = urlParts.slice(-3).join('/'); // videos/userId/filename
      await this.s3.deleteObject({
        Bucket: this.currentConfig.s3BucketName!,
        Key: key,
      }).promise();
    } else {
      // Delete from local storage
      const localPath = path.join(process.cwd(), videoUrl);
      await fs.promises.unlink(localPath).catch(() => {
        // Ignore errors if file doesn't exist
      });
    }
  }

  // Generate thumbnail from video (placeholder - would need ffmpeg for real implementation)
  async generateThumbnail(videoUrl: string, userId: string): Promise<string> {
    // For now, return a default thumbnail URL
    // In production, you'd use ffmpeg to extract a frame from the video
    return `/uploads/thumbnails/${userId}/default-thumbnail.jpg`;
  }

  // Get video duration (placeholder - would need ffmpeg for real implementation)
  async getVideoDuration(videoUrl: string): Promise<number> {
    // For now, return a default duration
    // In production, you'd use ffmpeg to get actual video duration
    return 30; // 30 seconds default
  }

  // Configure multer for video uploads
  getMulterConfig(): multer.Options {
    return {
      storage: multer.memoryStorage(), // Store in memory for processing
      limits: { 
        fileSize: (this.currentConfig?.maxFileSize || 100) * 1024 * 1024 // MB to bytes
      },
      fileFilter: (req, file, cb) => {
        const allowedFormats = this.currentConfig?.allowedFormats?.split(',') || ['mp4', 'webm', 'mov'];
        const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
        
        if (allowedFormats.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(new Error(`Only ${allowedFormats.join(', ')} files are allowed`));
        }
      }
    };
  }
}

export const videoStorageService = new VideoStorageService();
export default videoStorageService;
