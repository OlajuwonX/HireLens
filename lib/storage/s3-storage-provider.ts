import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProviderError } from "./errors";
import { validateResumePdf } from "./pdf-validation";
import { createResumeStorageKey } from "./storage-keys";
import type {
  StorageProvider,
  StorageReadUrl,
  StoredFile,
  UploadResumeInput,
} from "./types";

export const DEFAULT_READ_URL_TTL_SECONDS = 300;

export type S3StorageProviderConfig = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  providerName?: StoredFile["provider"];
  forcePathStyle?: boolean;
  readUrlTtlSeconds?: number;
};

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly readUrlTtlSeconds: number;

  constructor(private readonly config: S3StorageProviderConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.readUrlTtlSeconds =
      config.readUrlTtlSeconds ?? DEFAULT_READ_URL_TTL_SECONDS;
  }

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

    const body = new Uint8Array(await input.file.arrayBuffer());

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: storageKey,
          Body: body,
          ContentType: input.contentType,
          ContentLength: body.byteLength,
        }),
      );
    } catch (error) {
      throw new StorageProviderError(
        `Could not store the resume file in Backblaze. ${describeStorageError(error)}`,
      );
    }

    return {
      provider: this.config.providerName ?? "backblaze",
      storageKey,
      originalFilename: input.originalFilename,
      mimeType: input.contentType,
      sizeBytes: body.byteLength,
    };
  }

  async createReadUrl(storageKey: string): Promise<StorageReadUrl> {
    try {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.config.bucket, Key: storageKey }),
        { expiresIn: this.readUrlTtlSeconds },
      );

      return {
        url,
        expiresAt: new Date(Date.now() + this.readUrlTtlSeconds * 1000),
      };
    } catch (error) {
      throw new StorageProviderError(
        `Could not create a read URL for the file. ${describeStorageError(error)}`,
      );
    }
  }

  async readFile(storageKey: string): Promise<Uint8Array> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.config.bucket, Key: storageKey }),
      );

      if (!result.Body) {
        throw new StorageProviderError("Stored file has no content");
      }

      return new Uint8Array(await result.Body.transformToByteArray());
    } catch (error) {
      if (error instanceof StorageProviderError) {
        throw error;
      }

      throw new StorageProviderError(
        `Could not read the stored file. ${describeStorageError(error)}`,
      );
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: storageKey,
        }),
      );
    } catch (error) {
      throw new StorageProviderError(
        `Could not delete the stored file. ${describeStorageError(error)}`,
      );
    }
  }
}

function describeStorageError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "Check your storage settings and try again.";
  }

  const record = error as {
    name?: unknown;
    Code?: unknown;
    code?: unknown;
    message?: unknown;
  };
  const code = String(record.Code ?? record.code ?? record.name ?? "");
  const message = typeof record.message === "string" ? record.message : "";
  const debug =
    process.env.NODE_ENV === "development" && (code || message)
      ? ` Backblaze returned ${[code, message].filter(Boolean).join(": ")}.`
      : "";

  if (code.includes("InvalidAccessKeyId") || code.includes("Signature")) {
    return `Check STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_REGION, and STORAGE_ENDPOINT.${debug}`;
  }

  if (code.includes("NoSuchBucket") || message.includes("bucket")) {
    return `Check that STORAGE_BUCKET exactly matches your Backblaze bucket name.${debug}`;
  }

  if (message.includes("Invalid URL") || message.includes("ENOTFOUND")) {
    return `Check STORAGE_ENDPOINT. It should look like https://s3.<region>.backblazeb2.com.${debug}`;
  }

  return `Check your Backblaze bucket, endpoint, region, and key permissions.${debug}`;
}
