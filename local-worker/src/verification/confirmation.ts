const CONFIRMATION_TEXT =
  /(thank(s| you) for (applying|your application|your interest)|application (has been |was )?(submitted|received)|we('ve| have) received your application|your application is (complete|on its way))/i;
const CONFIRMATION_URL = /(confirmation|thank[-_]?you|application[-_]?submitted|\/success\b)/i;
const CAPTCHA = /(recaptcha|hcaptcha|turnstile|captcha)/i;

export function detectConfirmation(input: { url: string; text: string }) {
  const match = input.text.match(CONFIRMATION_TEXT);

  if (match) {
    return { finalUrl: input.url, confirmationText: match[0] };
  }

  return CONFIRMATION_URL.test(new URL(input.url).pathname) ? { finalUrl: input.url } : null;
}

export function detectCaptcha(input: { html: string }) {
  return CAPTCHA.test(input.html);
}
