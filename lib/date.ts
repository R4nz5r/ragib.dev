/**
 * Formats an ISO date string into a consistent display format (e.g. "Sep 12, 2026")
 * using UTC timezone to guarantee identical rendering across server and client,
 * preventing hydration mismatches.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
