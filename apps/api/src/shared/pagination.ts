export function normalizePage(value: unknown, fallback: number): number {
  return normalizePositiveInteger(value, fallback);
}

export function normalizePageSize(value: unknown, fallback: number, max = 100): number {
  return Math.min(normalizePositiveInteger(value, fallback), max);
}

export function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
