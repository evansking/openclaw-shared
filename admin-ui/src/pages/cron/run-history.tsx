import { useState } from "react";
import { useCronJobRuns } from "../../hooks/use-api";
import { StatusBadge } from "../../components/shared/status-badge";
import { timeAgo, formatTime, formatDuration } from "../../lib/format";

interface Props {
  jobId: string;
}

export function RunHistory({ jobId }: Props) {
  const [open, setOpen] = useState(false);
  const { data: runs, isLoading } = useCronJobRuns(open ? jobId : null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? "\u25BE" : "\u25B8"} History
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          {isLoading && (
            <div className="text-xs text-muted-foreground">Loading runs...</div>
          )}
          {runs && runs.length === 0 && (
            <div className="text-xs text-muted-foreground">No run history.</div>
          )}
          {runs?.map((run: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent/30 rounded px-2 py-1"
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
            >
              <StatusBadge
                status={run.status === "error" ? "error" : "ok"}
                className="text-[10px] px-1.5"
              />
              {run.durationMs != null && (
                <span className="text-muted-foreground shrink-0">
                  {formatDuration(run.durationMs)}
                </span>
              )}
              <span
                className="text-muted-foreground shrink-0"
                title={run.ts ? new Date(run.ts).toLocaleString() : ""}
              >
                {run.ts ? timeAgo(run.ts) : run.runAtMs ? timeAgo(run.runAtMs) : ""}
              </span>
              <span className="flex-1 truncate text-muted-foreground">
                {expandedIdx === i
                  ? run.summary || ""
                  : run.summary
                    ? run.summary.length > 60
                      ? run.summary.slice(0, 60) + "..."
                      : run.summary
                    : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
