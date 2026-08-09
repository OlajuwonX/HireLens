import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { MemoryStorageProvider } from "./memory-storage-provider";
import { S3StorageProvider } from "./s3-storage-provider";
import type { StorageProvider } from "./types";

let provider: StorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  if (provider) {
    return provider;
  }

  const env = getServerEnv();

  if (
    env.STORAGE_BUCKET &&
    env.STORAGE_ACCESS_KEY_ID &&
    env.STORAGE_SECRET_ACCESS_KEY
  ) {
    provider = new S3StorageProvider({
      bucket: env.STORAGE_BUCKET,
      region: env.STORAGE_REGION,
      endpoint: env.STORAGE_ENDPOINT,
      accessKeyId: env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      providerName: "backblaze",
      forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
    });
  } else {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "Backblaze storage is not configured. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY.",
      );
    }

    provider = new MemoryStorageProvider();
  }

  return provider;
}

export function setStorageProviderForTests(next: StorageProvider | undefined) {
  provider = next;
}
