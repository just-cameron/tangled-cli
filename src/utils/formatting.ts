/**
 * Format a date for display with human-readable relative time
 * @param dateString - ISO date string
 * @returns Human-readable date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString();
}

/**
 * Format issue state for display
 * @param state - Issue state ('open' or 'closed')
 * @returns Formatted state badge string
 */
export function formatIssueState(state: 'open' | 'closed'): string {
  return state === 'open' ? '[OPEN]' : '[CLOSED]';
}

/**
 * Pick specific fields from an object, omitting fields not present in the object
 */
function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }
  return result;
}

/**
 * Output data as JSON to stdout, following GitHub CLI conventions.
 *
 * @param data - The data to output (object or array of objects)
 * @param fields - Comma-separated field names to include; omit for all fields
 */
export function outputJson<T extends object>(
  data: T | T[],
  fields?: string
): void {
  if (fields) {
    const fieldList = fields
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    if (Array.isArray(data)) {
      console.log(
        JSON.stringify(
          data.map((item) => pickFields(item as Record<string, unknown>, fieldList)),
          null,
          2
        )
      );
    } else {
      console.log(JSON.stringify(pickFields(data as Record<string, unknown>, fieldList), null, 2));
    }
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
