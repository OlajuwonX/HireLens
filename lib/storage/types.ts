export type StorageProviderName = "puter";

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
  deleteFile(storageKey: string): Promise<void>;
}
