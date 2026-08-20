export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export interface StorageProvider {
  upload(
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ url: string }>;
  publicUrl(path: string): string;
  getObject(
    path: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null>;
}
