interface RelativeTimeProps {
  /** ISO timestamp, or null when the moment never happened. */
  value: string | null;
  /** Shown when value is null. */
  fallback?: string;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function formatRelative(milliseconds: number): string {
  const seconds = Math.round((milliseconds - Date.now()) / 1000);
  const unit = UNITS.find(([, size]) => Math.abs(seconds) >= size);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return unit === undefined
    ? "just now"
    : formatter.format(Math.round(seconds / unit[1]), unit[0]);
}

/** A timestamp rendered as "3 hours ago", with the exact value as a tooltip. */
export function RelativeTime({ value, fallback = "never" }: RelativeTimeProps) {
  const milliseconds = value === null ? Number.NaN : Date.parse(value);
  return Number.isNaN(milliseconds) ? (
    <span>{value ?? fallback}</span>
  ) : (
    <time
      dateTime={value ?? undefined}
      title={new Date(milliseconds).toLocaleString()}
      suppressHydrationWarning
    >
      {formatRelative(milliseconds)}
    </time>
  );
}
