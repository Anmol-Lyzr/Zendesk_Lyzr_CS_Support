const Z_LOCALE = "en-US";

export function formatShortDate(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString(Z_LOCALE, { month: "short", day: "numeric" });
}

export function formatShortDateFromYmd(ymd: string) {
  // Interpret YYYY-MM-DD as a local calendar date (not UTC).
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!y || !m || !d) return ymd;
  return formatShortDate(new Date(y, m - 1, d, 12, 0, 0, 0).toISOString());
}

export function formatShortDateTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleString(Z_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function startOfLocalDayFromYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

export function endOfLocalDayFromYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
}

