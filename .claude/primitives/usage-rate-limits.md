# Usage And Rate Limit Primitives

AI usage must be protected server-side.

Initial burst limits:

- Maximum 3 AI requests per minute per user.
- Maximum 1 active AI request per user.

Initial daily quotas:

- General resume analyses: 5 per day.
- Job-fit analyses: 10 per day.
- Cover letters: 5 per day.
- Follow-up/application messages: 15 per day.

Create an AI usage service:

```ts
export interface AIUsageService {
  checkAllowance(input: CheckAllowanceInput): Promise<AllowanceResult>;
  reserveUsage(input: ReserveUsageInput): Promise<UsageReservation>;
  completeUsage(input: CompleteUsageInput): Promise<void>;
  failUsage(input: FailUsageInput): Promise<void>;
}
```

Requests that reach the AI provider should count even if schema validation fails later.

Show usage clearly in the UI:

```text
Resume analyses: 3 of 5 used
Job-fit analyses: 4 of 10 used
Cover letters: 2 of 5 used
Resets tomorrow
```
