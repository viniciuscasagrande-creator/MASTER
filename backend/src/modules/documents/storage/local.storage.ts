import crypto from 'crypto';
import { StorageProvider, StorageUploadResult } from './storage.provider';
import { env } from '../../../config/env';

export class LocalStorageProvider implements StorageProvider {
  private static instance: LocalStorageProvider;
  private storageMap = new Map<string, { buffer: Buffer; mimeType: string; createdAt: Date }>();
  private secretKey: string;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || env.JWT_SECRET || 'disk-interno-storage-secret-key-2026';
  }

  public static getInstance(): LocalStorageProvider {
    if (!LocalStorageProvider.instance) {
      LocalStorageProvider.instance = new LocalStorageProvider();
    }
    return LocalStorageProvider.instance;
  }

  public async upload(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    this.storageMap.set(key, {
      buffer,
      mimeType,
      createdAt: new Date()
    });

    return {
      storageKey: key,
      size: buffer.length,
      checksumAlgorithm: 'SHA-256',
      checksum
    };
  }

  public async download(key: string): Promise<Buffer> {
    const entry = this.storageMap.get(key);
    if (!entry) {
      throw new Error(`Arquivo não encontrado no storage: ${key}`);
    }
    return entry.buffer;
  }

  public async delete(key: string): Promise<void> {
    this.storageMap.delete(key);
  }

  public async exists(key: string): Promise<boolean> {
    return this.storageMap.has(key);
  }

  public async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${key}:${expires}`;
    const sig = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');

    return `/api/v1/documents/download/signed?key=${encodeURIComponent(key)}&expires=${expires}&sig=${sig}`;
  }

  public verifySignedUrl(key: string, expires: number, signature: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (now > expires) {
      return false; // Expired
    }

    const payload = `${key}:${expires}`;
    const expectedSig = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'));
    } catch {
      return false;
    }
  }

  public clear(): void {
    this.storageMap.clear();
  }
}

export const defaultStorageProvider = LocalStorageProvider.getInstance();
