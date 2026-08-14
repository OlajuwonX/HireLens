import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const index = line.indexOf("=");

  if (index < 1 || line.trim().startsWith("#")) {
    continue;
  }

  const key = line.slice(0, index).trim();
  const value = line
    .slice(index + 1)
    .trim()
    .replace(/^["']|["']$/g, "");

  if (value && !process.env[key]) {
    process.env[key] = value;
  }
}

const [email, flag] = process.argv.slice(2);
const role = flag === "--revoke" ? "USER" : "ADMIN";

if (!email) {
  console.error("usage: pnpm db:promote-admin <email> [--revoke]");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const [updated] = await sql`
  update users set role = ${role}, updated_at = now()
  where lower(email) = lower(${email})
  returning email, role`;

if (!updated) {
  console.error(`no account found for ${email}`);
  const rows = await sql`select email, role from users order by email`;
  console.error("known accounts:");
  for (const row of rows) {
    console.error(`  ${row.email} (${row.role})`);
  }
  process.exit(1);
}

console.log(`${updated.email} is now ${updated.role}`);
