export function connectionProblem(status: number, baseUrl: string) {
  if (status >= 200 && status < 300) {
    return null;
  }

  if (status === 0) {
    return `Could not reach ${baseUrl}. Check HIRELENS_URL in .env and your internet connection.`;
  }

  if (status === 401) {
    return "HireLens rejected the worker token. Create a new one in Settings > Local worker and paste it into .env.";
  }

  if (status === 404) {
    return `${baseUrl} is not a HireLens app with the worker API. Set HIRELENS_URL in .env to the address you open HireLens at, and make sure the latest code is deployed there.`;
  }

  return `HireLens answered with an error (${status}). Try again in a minute.`;
}
