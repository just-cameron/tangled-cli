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
