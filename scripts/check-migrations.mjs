import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = process.argv[2] ?? "drizzle";
const ACK = /--\s*migration-check:\s*allow\s+([a-z-]+)\s*(.*)/gi;

const RULES = [
  {
    id: "add-not-null-without-default",
    test: (s) =>
      /\bALTER\s+TABLE\b/i.test(s) &&
      /\bADD\s+COLUMN\b/i.test(s) &&
      /\bNOT\s+NULL\b/i.test(s) &&
      !/\bDEFAULT\b/i.test(s) &&
      !/\bGENERATED\b/i.test(s),
    message:
      "adds a NOT NULL column with no DEFAULT; deployed code inserting rows without it will fail",
    remedy: "add it nullable, backfill, then set NOT NULL in a later migration",
  },
  {
    id: "set-not-null",
    test: (s) =>
      /\bALTER\s+TABLE\b/i.test(s) && /\bSET\s+NOT\s+NULL\b/i.test(s),
    message: "makes an existing column required",
    remedy:
      "only safe once every deployed writer sets it and existing rows are backfilled",
  },
  {
    id: "drop-column",
    test: (s) => /\bALTER\s+TABLE\b/i.test(s) && /\bDROP\s+COLUMN\b/i.test(s),
    message: "drops a column",
    remedy: "stop reading it in one deploy, drop it in a later one",
  },
  {
    id: "drop-table",
    test: (s) => /\bDROP\s+TABLE\b/i.test(s),
    message: "drops a table",
    remedy: "stop reading it in one deploy, drop it in a later one",
  },
  {
    id: "rename",
    test: (s) => /\bALTER\s+TABLE\b/i.test(s) && /\bRENAME\b/i.test(s),
    message: "renames a table or column, which deployed code still references",
    remedy: "add the new name, write both, move reads, then drop the old one",
  },
  {
    id: "change-type",
    test: (s) =>
      /\bALTER\s+TABLE\b/i.test(s) &&
      /\bALTER\s+COLUMN\b/i.test(s) &&
      /\b(SET\s+DATA\s+TYPE|TYPE)\b/i.test(s),
    message: "changes a column type",
    remedy:
      "add a new column, dual-write, migrate reads, then drop the old one",
  },
  {
    id: "drop-type",
    test: (s) => /\bDROP\s+TYPE\b/i.test(s),
    message: "drops an enum type that deployed code may still reference",
    remedy: "leave the type in place; stop using it instead",
  },
  {
    id: "drop-enum-value",
    test: (s) => /\bALTER\s+TYPE\b/i.test(s) && /\bDROP\s+VALUE\b/i.test(s),
    message: "removes an enum value that stored rows may still hold",
    remedy: "stop writing the value; never remove it",
  },
  {
    id: "delete-without-where",
    test: (s) =>
      /\bDELETE\s+FROM\b/i.test(s) && !/\bWHERE\b/i.test(s),
    message: "deletes every row in a table",
    remedy: "scope the delete with a WHERE clause",
  },
  {
    id: "truncate",
    test: (s) => /\bTRUNCATE\b/i.test(s),
    message: "truncates a table",
    remedy: "never truncate in a migration",
  },
  {
    id: "drop-database",
    test: (s) => /\bDROP\s+(DATABASE|SCHEMA)\b/i.test(s),
    message: "drops a database or schema",
    remedy: "never do this in a migration",
  },
];

function statementsOf(sql) {
  return sql
    .split(/-->\s*statement-breakpoint|;\s*$/gm)
    .map((s) => s.trim())
    .filter(Boolean);
}

function acknowledgementsOf(sql) {
  const found = new Map();

  for (const match of sql.matchAll(ACK)) {
    const rule = match[1].toLowerCase();
    const reasons = found.get(rule) ?? [];

    reasons.push((match[2] ?? "").trim());
    found.set(rule, reasons);
  }

  return found;
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const violations = [];
const waived = [];

for (const file of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  const acknowledgements = acknowledgementsOf(sql);

  for (const statement of statementsOf(sql)) {
    const withoutComments = statement.replace(/--.*$/gm, "");

    for (const rule of RULES) {
      if (!rule.test(withoutComments)) {
        continue;
      }

      const reasons = acknowledgements.get(rule.id);
      const reason = reasons
        ? reasons.length > 1
          ? reasons.shift()
          : reasons[0]
        : undefined;
      const entry = {
        file,
        rule: rule.id,
        message: rule.message,
        remedy: rule.remedy,
        statement: withoutComments.replace(/\s+/g, " ").trim().slice(0, 140),
        reason,
      };

      if (reason === undefined) {
        violations.push(entry);
      } else {
        waived.push(entry);
      }
    }
  }
}

for (const entry of waived) {
  console.log(
    `waived  ${entry.file}  ${entry.rule}${entry.reason ? `  (${entry.reason})` : ""}`,
  );
}

if (violations.length === 0) {
  console.log(
    `Checked ${files.length} migration file(s). No backwards-incompatible changes found.`,
  );
  process.exit(0);
}

console.error(
  `\n${violations.length} backwards-incompatible migration change(s) found.\n`,
);

for (const entry of violations) {
  console.error(`  ${entry.file}  [${entry.rule}]`);
  console.error(`    ${entry.message}`);
  console.error(`    ${entry.statement}`);
  console.error(`    fix: ${entry.remedy}`);
  console.error(
    `    override: add "-- migration-check: allow ${entry.rule} <why it is safe>" to the file\n`,
  );
}

console.error(
  "Old and new instances run at the same time during a rollout, so a migration\nmust be compatible with the code that is already deployed.\n",
);

process.exit(1);
