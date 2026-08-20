import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from './storage.provider';

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET!;
    const accountId = process.env.R2_ACCOUNT_ID!;

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!,
      },
    });

    this.publicBaseUrl = process.env.R2_PUBLIC_URL || '';
    this.logger.log(`R2 storage initialized — bucket: ${this.bucket}`);
  }

  async upload(
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ url: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const url = this.publicUrl(path);
    this.logger.log(`Uploaded to R2: ${path} → ${url}`);
    return { url };
  }

  publicUrl(path: string): string {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return path;
    if (
      this.publicBaseUrl &&
      !this.publicBaseUrl.includes('pub-xxxxxx') &&
      !this.publicBaseUrl.includes('.r2.dev')
    ) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${path}`;
    }
    return `/api/media/file/${path}`;
  }

  async getObject(
    path: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      const buffer = Buffer.from(bytes);
      const contentType = res.ContentType || 'image/jpeg';
      return { buffer, contentType };
    } catch (e: any) {
      this.logger.error(`Error fetching R2 object ${path}: ${e.message}`);
      return null;
    }
  }
}
