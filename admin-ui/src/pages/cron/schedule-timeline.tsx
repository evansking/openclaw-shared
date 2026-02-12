import { useState } from "react";
import { useCronScheduleMap } from "../../hooks/use-api";
import { jobColor } from "./job-color";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ScheduleTimeline() {
  const { data } = useCronScheduleMap();
  const nowHour = new Date().getHours();
  const [hover, setHover] = useState<{ hour: number; names: string[] } | null>(null);

  if (!data?.jobs?.length) return null;

  // Build a map: hour -> list of jobs firing at that hour
  const hourMap = new Map<number, { id: string; name: string }[]>();
  for (const job of data.jobs) {
    for (const h of job.hours) {
      if (!hourMap.has(h)) hourMap.set(h, []);
      hourMap.get(h)!.push({ id: job.id, name: job.name });
    }
  }

  const tz = data.jobs[0]?.tz || "America/Los_Angeles";

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">
          24h Schedule
        </h2>
        <span className="text-[10px] text-muted-foreground">{tz}</span>
      </div>
      <div className="bg-card border rounded-lg px-4 py-3">
        <div className="flex items-end gap-0 relative">
          {HOURS.map((h) => {
            const jobs = hourMap.get(h) || [];
            const isNow = h === nowHour;
            return (
              <div
                key={h}
                className="flex-1 flex flex-col items-center gap-1 relative group"
                onMouseEnter={() => jobs.length > 0 ? setHover({ hour: h, names: jobs.map(j => j.name) }) : setHover(null)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Tooltip */}
                {hover?.hour === h && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
                    <div className="text-[11px] text-foreground font-medium">{h}:00</div>
                    {hover.names.map((name, i) => (
                      <div key={i} className="text-[10px] text-muted-foreground">{name}</div>
                    ))}
                  </div>
                )}
                {/* Dots stacked vertically */}
                <div className="flex flex-col gap-0.5 min-h-[20px] justify-end">
                  {jobs.map((j) => (
                    <div
                      key={j.id}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: jobColor(j.id) }}
                    />
                  ))}
                </div>
                {/* Now marker */}
                {isNow && (
                  <div className="w-full h-0.5 bg-foreground/40 rounded" />
                )}
                {/* Hour label */}
                <span className={`text-[9px] ${isNow ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                  {h}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
