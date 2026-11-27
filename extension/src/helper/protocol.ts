export const MAX_MESSAGE_BYTES = 1024 * 1024;

export function encodeMessage(message: unknown) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  const header = Buffer.alloc(4);

  header.writeUInt32LE(body.length, 0);

  return Buffer.concat([header, body]);
}

export function createMessageReader(onMessage: (message: unknown) => void) {
  let pending = Buffer.alloc(0);

  return (chunk: Buffer) => {
    pending = Buffer.concat([pending, chunk]);

    while (pending.length >= 4) {
      const length = pending.readUInt32LE(0);

      if (length > MAX_MESSAGE_BYTES) {
        throw new Error("The message from the browser is too large.");
      }

      if (pending.length < 4 + length) return;

      const body = pending.subarray(4, 4 + length).toString("utf8");

      pending = pending.subarray(4 + length);
      onMessage(JSON.parse(body));
    }
  };
}
