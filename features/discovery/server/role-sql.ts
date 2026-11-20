import "server-only";

import { sql, type SQL, type AnyColumn } from "drizzle-orm";
import type { RoleMatcher } from "@/lib/discovery/role-match";

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export function titleMatchesSql(matcher: RoleMatcher, column: AnyColumn): SQL {
  if (matcher.length === 0) {
    return sql`false`;
  }

  const padded = sql`(' ' || trim(regexp_replace(lower(${column}), '[^a-z0-9]+', ' ', 'g')) || ' ')`;
  const roles = matcher.map((groups) =>
    sql.join(
      groups.map((variants) =>
        sql`(${sql.join(variants.map((variant) => sql`${padded} like ${`% ${escapeLike(variant)} %`}`), sql` or `)})`,
      ),
      sql` and `,
    ),
  );

  return sql`(${sql.join(roles.map((role) => sql`(${role})`), sql` or `)})`;
}
