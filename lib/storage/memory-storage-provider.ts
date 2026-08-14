import { StorageProviderError } from "./errors";
import { validateResumePdf } from "./pdf-validation";
import { createResumeStorageKey } from "./storage-keys";
import type {
  StorageProvider,
  StorageReadUrl,
  StoredFile,
  UploadResumeInput,
} from "./types";

const MEMORY_READ_URL_TTL_SECONDS = 300;

export class MemoryStorageProvider implements StorageProvider {
  private readonly files = new Map<string, Uint8Array>();

  async uploadResume(input: UploadResumeInput): Promise<StoredFile> {
    await validateResumePdf({
      file: input.file,
      filename: input.originalFilename,
      mimeType: input.contentType,
    });

    const storageKey = createResumeStorageKey({
      userId: input.userId,
      filename: input.originalFilename,
    });
    const bytes = new Uint8Array(await input.file.arrayBuffer());

    this.files.set(storageKey, bytes);

    return {
      provider: "memory",
      storageKey,
      originalFilename: input.originalFilename,
      mimeType: input.contentType,
      sizeBytes: bytes.byteLength,
    };
  }

  async createReadUrl(storageKey: string): Promise<StorageReadUrl> {
    if (!this.files.has(storageKey)) {
      throw new StorageProviderError("Stored file was not found");
    }

    return {
      url: `memory://${storageKey}`,
      expiresAt: new Date(Date.now() + MEMORY_READ_URL_TTL_SECONDS * 1000),
    };
  }

  async readFile(storageKey: string): Promise<Uint8Array> {
    const bytes = this.files.get(storageKey);

    if (!bytes) {
      throw new StorageProviderError("Stored file was not found");
    }

    return bytes;
  }

  async deleteFile(storageKey: string): Promise<void> {
    this.files.delete(storageKey);
  }
}
