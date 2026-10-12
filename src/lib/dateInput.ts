// Converts an ISO date/datetime string into the `yyyy-mm-dd` value used by
// `<input type="date">`. Uses the user's local timezone so the date shown in
// the input matches the date the backend/other views display (formatDate
// also renders in local time), avoiding off-by-one-day drift.

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
