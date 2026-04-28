/**
 * Deterministically convert a title into a URL-safe slug.
 * Lower-cases, strips diacritics, replaces non-alphanumerics with hyphens.
 * Truncates to 500 chars to match the stories.slug varchar(500) column.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 500);
}
