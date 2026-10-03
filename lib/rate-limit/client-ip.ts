type HeaderSource = Pick<Headers, "get">;

export function clientIp(headers: HeaderSource) {
  const real = headers.get("x-real-ip")?.trim();

  if (real) {
    return real;
  }

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return forwarded || "unknown";
}
