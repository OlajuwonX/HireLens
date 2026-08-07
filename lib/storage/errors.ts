export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export class StorageProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageProviderError";
  }
}
