export function formatInr(paise: number | null | undefined, compact = false) {
  const rupees = (paise ?? 0) / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0, ...(compact ? { notation: "compact" as const } : {}) }).format(rupees);
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
