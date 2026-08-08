import { StorageProviderError } from "./errors";
import { validateResumePdf } from "./pdf-validation";
import { createResumeStorageKey } from "./storage-keys";
import type {
  StorageProvider,
  StorageReadUrl,
  StoredFile,
  UploadResumeInput,
} from "./types";

const PUTER_READ_URL_TTL_SECONDS = 300;

export type PuterFsClient = {
  write(
    path: string,
    data: string | File | Blob,
  ): Promise<{ path?: string } | undefined>;
  read(path: string): Promise<Blob>;
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

    const blob = await this.fs.read(storageKey);
    const url = URL.createObjectURL(blob);

    return {
      url,
      expiresAt: new Date(Date.now() + PUTER_READ_URL_TTL_SECONDS * 1000),
    };
  }

  async readFile(storageKey: string): Promise<Uint8Array> {
    const blob = await this.fs.read(storageKey);

    return new Uint8Array(await blob.arrayBuffer());
  }

  async deleteFile(storageKey: string): Promise<void> {
    await this.fs.delete(storageKey);
  }
}
