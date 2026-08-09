export type StorageProviderName = "backblaze" | "memory";

export type UploadResumeInput = {
  userId: string;
  file: File | Blob;
  originalFilename: string;
  contentType: string;
};

export type StoredFile = {
  provider: StorageProviderName;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

export type StorageReadUrl = {
  url: string;
  expiresAt: Date | null;
};

export interface StorageProvider {
  uploadResume(input: UploadResumeInput): Promise<StoredFile>;
  createReadUrl(storageKey: string): Promise<StorageReadUrl>;

  readFile(storageKey: string): Promise<Uint8Array>;
  deleteFile(storageKey: string): Promise<void>;
}
