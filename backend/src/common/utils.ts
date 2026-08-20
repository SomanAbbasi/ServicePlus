const SNAKE_RE = /_([a-z0-9])/g;

function toCamel(s: string): string {
  return s.replace(SNAKE_RE, (_, c) => c.toUpperCase());
}

/**
 * Strip `id` from the payload and convert snake_case keys to camelCase.
 * Prisma rejects unknown fields in `data`, so every key must match the model.
 */
export function sanitizeInput<T extends Record<string, any>>(
  raw: T,
): Omit<T, 'id'> {
  const { id: _id, ...rest } = raw;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(rest)) {
    out[toCamel(k)] = v;
  }
  return out as Omit<T, 'id'>;
}
