const rules = new Intl.PluralRules("en");

export function plural(count: number, one: string, other: string) {
  return `${count} ${rules.select(count) === "one" ? one : other}`;
}
