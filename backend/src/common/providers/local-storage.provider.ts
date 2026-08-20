import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from './storage.provider';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly storagePath: string;

  constructor() {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    this.storagePath = path.resolve(
      process.env.STORAGE_LOCAL_PATH || (isServerless ? '/tmp/storage' : './storage'),
    );
    try {
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }
      this.logger.log(`Local storage initialized — path: ${this.storagePath}`);
    } catch (e: any) {
      this.logger.warn(`Could not initialize storage directory ${this.storagePath}: ${e?.message}`);
    }
  }

  async upload(
    filePath: string,
    buffer: Buffer,
    _contentType: string,
  ): Promise<{ url: string }> {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(this.storagePath, cleanPath);
    const dir = path.dirname(fullPath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, buffer);
      this.logger.log(`Stored locally: ${cleanPath}`);
    } catch (e: any) {
      this.logger.error(`Error saving local file ${fullPath}: ${e?.message}`);
    }
    const url = `/api/media/file/${cleanPath}`;
    return { url };
  }

  publicUrl(pathStr: string): string {
    if (!pathStr) return '';
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) return pathStr;
    const cleanPath = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr;
    return `/api/media/file/${cleanPath}`;
  }

  async getObject(
    filePath: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(this.storagePath, cleanPath);
    if (!fs.existsSync(fullPath)) return null;
    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(cleanPath).toLowerCase();
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
        ? 'image/webp'
        : ext === '.svg'
        ? 'image/svg+xml'
        : ext === '.gif'
        ? 'image/gif'
        : 'image/jpeg';
    return { buffer, contentType };
  }

  getStoragePath(): string {
    return this.storagePath;
  }
}
