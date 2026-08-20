import { Injectable, BadRequestException, Inject, Logger } from '@nestjs/common';
import { STORAGE_PROVIDER, StorageProvider } from '../common/providers/storage.provider';
import { v4 as uuid } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharpLib = require('sharp');

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 82;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @Inject(STORAGE_PROVIDER) private storageProvider: StorageProvider,
  ) {}

  async upload(filename: string, contentType: string, dataBase64: string) {
    if (contentType && !contentType.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Strip any data URL prefix (e.g. data:image/png;base64,)
    const cleanBase64 = (dataBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();
    if (!cleanBase64) {
      throw new BadRequestException('Image data is empty or invalid');
    }

    const raw = Buffer.from(cleanBase64, 'base64');
    if (raw.length === 0) {
      throw new BadRequestException('Could not parse image buffer');
    }

    if (raw.length > MAX_UPLOAD_BYTES) {
      const mb = (raw.length / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `Image is ${mb} MB. Maximum upload size is 10 MB.`,
      );
    }

    let finalBuffer = raw;
    let finalContentType = contentType || 'image/jpeg';
    let ext = 'jpg';

    if (contentType?.includes('webp')) ext = 'webp';
    else if (contentType?.includes('png')) ext = 'png';
    else if (contentType?.includes('svg')) ext = 'svg';
    else if (contentType?.includes('gif')) ext = 'gif';

    // Attempt optimization with sharp with fallback if sharp fails in serverless
    try {
      if (sharpLib && !contentType?.includes('svg') && !contentType?.includes('gif')) {
        finalBuffer = await sharpLib(raw)
          .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: JPEG_QUALITY })
          .toBuffer();
        finalContentType = 'image/webp';
        ext = 'webp';
      }
    } catch (sharpErr) {
      this.logger.warn(`Sharp processing skipped/failed: ${sharpErr}`);
      finalBuffer = raw;
      finalContentType = contentType || 'image/jpeg';
    }

    const cleanBase = (filename || 'image')
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filePath = `catalog/${uuid()}-${cleanBase || 'image'}.${ext}`;

    const { url } = await this.storageProvider.upload(
      filePath,
      finalBuffer,
      finalContentType,
    );

    return { url };
  }

  async getFile(filePath: string) {
    return this.storageProvider.getObject(filePath);
  }
}
