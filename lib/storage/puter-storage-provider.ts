import { StorageProviderError } from "./errors";
import { validateResumePdf } from "./pdf-validation";
import { createResumeStorageKey } from "./storage-keys";
import type {
  StorageProvider,
  StorageReadUrl,
  StoredFile,
  UploadResumeInput,
} from "./types";

export type PuterFsClient = {
  write(path: string, data: string | File | Blob): Promise<{ path?: string } | undefined>;
  delete(path: string): Promise<void>;
};

export class PuterStorageProvider implements StorageProvider {
  constructor(private readonly fs: PuterFsClient) {}

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

    const uploadedFile = await this.fs.write(storageKey, input.file);

    if (!uploadedFile) {
      throw new StorageProviderError("Puter did not return an uploaded file");
    }

    return {
      provider: "puter",
      storageKey: uploadedFile.path ?? storageKey,
      originalFilename: input.originalFilename,
      mimeType: input.contentType,
      sizeBytes: input.file.size,
    };
  }

  async createReadUrl(storageKey: string): Promise<StorageReadUrl> {
    return {
      url: storageKey,
      expiresAt: null,
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    await this.fs.delete(storageKey);
  }
}
