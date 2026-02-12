import { useState, useEffect } from "react";
import { useCronNextUp } from "../../hooks/use-api";
import { formatCountdown, formatJobName } from "../../lib/format";
import { jobColor } from "./job-color";

export function NextUpQueue() {
  const { data: jobs } = useCronNextUp();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!jobs?.length) return;

    // Check if any job is within 5 minutes
    const hasSoon = jobs.some(
      (j: any) => j.nextRunAtMs - Date.now() < 5 * 60 * 1000
    );
    const interval = hasSoon ? 1000 : 10000;

    const id = setInterval(() => setTick((t) => t + 1), interval);
    return () => clearInterval(id);
  }, [jobs]);

  if (!jobs?.length) return null;

  return (
    <div className="mb-8">
      <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
        Next Up
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {jobs.map((job: any) => {
          const isPast = job.nextRunAtMs <= Date.now();
          return (
            <div
              key={job.id}
              className="bg-card border rounded-lg px-4 py-3 min-w-[180px] shrink-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: jobColor(job.id) }}
                />
                <span className="text-sm font-medium truncate">
                  {formatJobName(job.name)}
                </span>
              </div>
              <div
                className={`text-lg font-bold ${
                  isPast ? "text-yellow-400" : "text-foreground"
                }`}
              >
                {isPast ? "running..." : formatCountdown(job.nextRunAtMs)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] px-1.5 py-0 rounded bg-secondary text-muted-foreground">
                  {job.agentId}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(job.nextRunAtMs).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
