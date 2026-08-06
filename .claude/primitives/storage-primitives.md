# Storage Primitives

Keep Puter FS behind a storage interface.

Required interface shape:

```ts
export interface StorageProvider {
  uploadResume(input: UploadResumeInput): Promise<StoredFile>;
  createReadUrl(storageKey: string): Promise<string>;
  deleteFile(storageKey: string): Promise<void>;
}
```

Implementation:

- `PuterStorageProvider`

Rules:

- UI components must not call Puter FS directly.
- Store metadata in the database.
- Store actual PDF/image files in storage.
- Generate safe storage keys.
- Support file deletion.
- Keep provider migration possible.
- Do not expose permanent public file URLs.
