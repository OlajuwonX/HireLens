export type PingResult = { status: number; vercelProtected: boolean };

export function toPingResult(response: Response | null): PingResult {
  const marker = `${response?.headers.get("set-cookie") ?? ""} ${response?.headers.get("location") ?? ""}`;

  return { status: response?.status ?? 0, vercelProtected: /_vercel_sso|vercel\.com\/sso/.test(marker) };
}

export function connectionProblem(ping: PingResult, baseUrl: string) {
  if (ping.vercelProtected) {
    return [
      `${baseUrl} is protected by Vercel Authentication, so the worker cannot reach HireLens.`,
      "Fix it once, for free: Vercel > your project > Settings > Deployment Protection > Protection Bypass for Automation > Add a secret,",
      "then put it in .env as VERCEL_PROTECTION_BYPASS=<secret>. Or use your production address instead of a preview link.",
    ].join("\n");
  }

  if (ping.status >= 200 && ping.status < 300) {
    return null;
  }

  if (ping.status === 0) {
    return `Could not reach ${baseUrl}. Check HIRELENS_URL in .env and your internet connection.`;
  }

  if (ping.status === 401) {
    return "HireLens rejected the worker token. Create a new one in Settings > Local worker on this same site and paste it into .env.";
  }

  if (ping.status === 404) {
    return `${baseUrl} is not a HireLens app with the worker API. Set HIRELENS_URL in .env to the address you open HireLens at, and make sure the latest code is deployed there.`;
  }

  return `HireLens answered with an error (${ping.status}). Try again in a minute.`;
}
