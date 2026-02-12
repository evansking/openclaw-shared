export function timeAgo(ts: number | string): string {
  const d = typeof ts === "number" ? ts : new Date(ts).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return "<1s";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function formatJobName(name: string): string {
  if (!name) return "";
  return name
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatCountdown(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return "now";
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `in ${m}m`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  if (d === 0) return `in ${h}h ${m}m`;
  const mo = Math.floor(d / 30);
  const remD = d % 30;
  if (mo === 0) return `in ${d}d ${remH}h`;
  const y = Math.floor(mo / 12);
  const remMo = mo % 12;
  if (y === 0) return `in ${mo}mo ${remD}d`;
  return `in ${y}y ${remMo}mo`;
}
