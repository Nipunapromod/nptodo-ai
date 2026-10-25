export function formatPreviewCount(value) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("Preview count must be a finite, non-negative number");
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(value);
}

export function normalizeTaskText(value) {
  if (typeof value !== "string") throw new TypeError("Task text must be a string");
  return value.trim().replace(/\s+/g, " ");
}
