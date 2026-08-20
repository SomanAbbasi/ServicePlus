import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { STORAGE_PROVIDER, StorageProvider } from '../common/providers/storage.provider';
import { v4 as uuid } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharpLib = require('sharp');

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 80;

@Injectable()
export class MediaService {
  constructor(
    @Inject(STORAGE_PROVIDER) private storageProvider: StorageProvider,
  ) {}

  async upload(filename: string, contentType: string, dataBase64: string) {
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const raw = Buffer.from(dataBase64, 'base64');

    if (raw.length > MAX_UPLOAD_BYTES) {
      const mb = (raw.length / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `Image is ${mb} MB. Maximum upload size is 8 MB.`,
      );
    }

    const compressed = await sharpLib(raw)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    const safe = filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filePath = `catalog/${uuid()}-${safe || 'image'}.jpg`;

    const { url } = await this.storageProvider.upload(
      filePath,
      compressed,
      'image/jpeg',
    );

    return { url };
  }

  async getFile(filePath: string) {
    return this.storageProvider.getObject(filePath);
  }
}
