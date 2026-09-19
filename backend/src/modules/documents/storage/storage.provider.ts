export interface StorageUploadResult {
  storageKey: string;
  size: number;
  checksumAlgorithm: string;
  checksum: string;
}

export interface StorageProvider {
  /**
   * Store binary buffer into storage provider and calculate cryptographic integrity
   */
  upload(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult>;

  /**
   * Retrieve file buffer from storage
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Check if file exists in storage
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate temporary expiring signed URL
   */
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;

  /**
   * Verify signature and expiration of a temporary signed URL
   */
  verifySignedUrl(key: string, expires: number, signature: string): boolean;
}
