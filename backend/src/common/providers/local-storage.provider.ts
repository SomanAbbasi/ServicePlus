import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from './storage.provider';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly storagePath: string;

  constructor() {
    this.storagePath = path.resolve(
      process.env.STORAGE_LOCAL_PATH || './storage',
    );
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
    this.logger.log(`Local storage initialized — path: ${this.storagePath}`);
  }

  async upload(
    filePath: string,
    buffer: Buffer,
    _contentType: string,
  ): Promise<{ url: string }> {
    const fullPath = path.join(this.storagePath, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);
    const url = `/api/media/file/${filePath}`;
    this.logger.log(`Stored: ${filePath}`);
    return { url };
  }

  publicUrl(pathStr: string): string {
    if (pathStr.startsWith('http')) return pathStr;
    if (pathStr.startsWith('/')) return pathStr;
    return `/api/media/file/${pathStr}`;
  }

  async getObject(
    filePath: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    const fullPath = path.join(this.storagePath, filePath);
    if (!fs.existsSync(fullPath)) return null;
    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
        ? 'image/webp'
        : 'image/jpeg';
    return { buffer, contentType };
  }

  getStoragePath(): string {
    return this.storagePath;
  }
}
