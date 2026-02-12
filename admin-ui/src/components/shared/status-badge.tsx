import { cn } from "../../lib/utils";

interface Props {
  status: "running" | "stopped" | "enabled" | "disabled" | "ok" | "error";
  className?: string;
}

const colors = {
  running: "bg-green-500/20 text-green-400",
  stopped: "bg-red-500/20 text-red-400",
  enabled: "bg-green-500/20 text-green-400",
  disabled: "bg-zinc-500/20 text-zinc-400",
  ok: "bg-green-500/20 text-green-400",
  error: "bg-red-500/20 text-red-400",
};

export function StatusBadge({ status, className }: Props) {
  return (
    <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", colors[status], className)}>
      {status}
    </span>
  );
}
