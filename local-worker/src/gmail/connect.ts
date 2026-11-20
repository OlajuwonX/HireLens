import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readConfig } from "../config";
import { buildAuthUrl, createPkce, exchangeCode, saveRefreshToken } from "./oauth";

try {
  process.loadEnvFile();
} catch {
  console.log("No .env file found; using environment variables.");
}

const config = readConfig();

if (!config.GMAIL_CLIENT_ID) {
  console.error("Set GMAIL_CLIENT_ID in .env first. See the README section on Gmail.");
  process.exit(1);
}

const { verifier, challenge } = createPkce();
const state = randomBytes(16).toString("hex");

let redirectUri = "";

const code = await new Promise<string>((resolve, reject) => {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", redirectUri);
    const received = url.searchParams.get("code");
    const ok = Boolean(received) && url.searchParams.get("state") === state;

    response.writeHead(ok ? 200 : 400, { "Content-Type": "text/plain" });
    response.end(ok ? "Gmail connected. You can close this tab." : "Connection failed. Run the command again.");
    server.close();

    if (ok && received) {
      resolve(received);
    } else {
      reject(new Error(url.searchParams.get("error") ?? "Google did not return a code."));
    }
  });

  server.listen(0, "127.0.0.1", () => {
    redirectUri = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const url = buildAuthUrl({ clientId: config.GMAIL_CLIENT_ID!, redirectUri, challenge, state });

    console.log(`Open this link to allow read-only Gmail access:

${url}
`);
  });
});

const tokens = await exchangeCode({
  clientId: config.GMAIL_CLIENT_ID,
  clientSecret: config.GMAIL_CLIENT_SECRET,
  code,
  verifier,
  redirectUri,
});

if (!tokens.refresh_token) {
  console.error("Google did not return a refresh token. Remove HireLens from your Google account permissions and try again.");
  process.exit(1);
}

await saveRefreshToken(tokens.refresh_token);
console.log("Gmail connected. Start the worker with pnpm start.");
