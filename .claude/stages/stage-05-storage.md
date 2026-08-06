# Stage 05: Puter Storage Abstraction

Goal: keep Puter FS but hide it behind a replaceable storage provider.

Implement:

- `StorageProvider` interface.
- `PuterStorageProvider`.
- Safe storage-key generation.
- File metadata persistence.
- Read URL creation.
- Delete workflow.
- PDF validation helpers.

Rules:

- No UI component may call Puter FS directly.
- Validate PDF extension, MIME type, size, and file signature where practical.

Validation:

- Upload, read URL, and delete can be tested through service functions.
- Typecheck passes.

Suggested commit message:

```text
feat: add resume storage provider
```
