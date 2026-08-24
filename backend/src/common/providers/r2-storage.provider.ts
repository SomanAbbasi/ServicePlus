import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
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
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: cleanPath,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const url = this.publicUrl(cleanPath);
    this.logger.log(`Uploaded to R2: ${cleanPath} → ${url}`);
    return { url };
  }

  publicUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    if (
      this.publicBaseUrl &&
      !this.publicBaseUrl.includes('pub-xxxxxx') &&
      !this.publicBaseUrl.includes('your-bucket') &&
      !this.publicBaseUrl.includes('.r2.dev')
    ) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${cleanPath}`;
    }
    return `/api/media/file/${cleanPath}`;
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
      this.logger.error(`Error fetching R2 object ${path}: ${e?.message}`);
      return null;
    }
  }
  private extractKey(pathOrUrl: string): string {
    if (!pathOrUrl) return '';
    let clean = pathOrUrl.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        const parsed = new URL(clean);
        clean = parsed.pathname;
      } catch {}
    }
    clean = clean.replace(/^\/?api\/media\/file\/?/, '');
    clean = clean.replace(/^\/+/, '');
    return clean;
  }

  async deleteObject(pathOrUrl: string): Promise<boolean> {
    if (!pathOrUrl) return false;
    try {
      const key = this.extractKey(pathOrUrl);
      if (!key) return false;
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`Deleted from Cloudflare R2: ${key}`);
      return true;
    } catch (e: any) {
      this.logger.warn(`Failed to delete Cloudflare R2 object ${pathOrUrl}: ${e?.message}`);
      return false;
    }
  }
}
