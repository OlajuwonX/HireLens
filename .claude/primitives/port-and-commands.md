# Port And Command Primitives

Development server rule:

- HireLens must run on port `5000` or above.
- Default local dev port is `5000`.
- If port `5000` is busy, use `5001`, `5002`, or another higher port.

Current React Router MVP command:

```bash
npm run dev
```

The `dev` script is configured to run:

```bash
react-router dev --port 5000
```

Future Next.js command should use pnpm and stay at port 5000:

```bash
pnpm dev --port 5000
```

Do not use ports below 5000 for local development unless the project owner explicitly overrides this rule.
