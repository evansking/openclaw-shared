import { useCronJobs, useUpdateCronJob, useDeleteCronJob, useRunCronJob, useCreateCronJob } from "../../hooks/use-api";
import { JobCard } from "./job-card";
import { ScheduleTimeline } from "./schedule-timeline";
import { NextUpQueue } from "./next-up-queue";
import { useState, useContext } from "react";
import { AgentContext } from "../../App";

export function CronIndex() {
  const { agent } = useContext(AgentContext);
  const { data: allJobs, isLoading } = useCronJobs();
  const update = useUpdateCronJob();
  const remove = useDeleteCronJob();
  const run = useRunCronJob();
  const create = useCreateCronJob();
  const [showNew, setShowNew] = useState(false);

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  const jobs = allJobs?.filter((j: any) => j.agentId === agent) ?? [];
  const recurring = jobs.filter((j: any) => j.schedule?.kind === "cron");
  const oneShot = jobs.filter((j: any) => j.schedule?.kind !== "cron");

  const handleToggle = (id: string, enabled: boolean) => {
    update.mutate({ id, data: { enabled } });
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Cron Jobs</h1>
        <button
          onClick={() => setShowNew(true)}
          className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:opacity-90"
        >
          + New Job
        </button>
      </div>

      <ScheduleTimeline />
      <NextUpQueue />

      {showNew && (
        <JobCard
          job={{ id: "", name: "", schedule: "0 9 * * *", timezone: "America/Los_Angeles", enabled: true, agentId: agent, payload: "" }}
          isNew
          onSave={(data) => { create.mutate(data); setShowNew(false); }}
          onCancel={() => setShowNew(false)}
          onToggle={() => {}}
          onDelete={() => {}}
          onRun={() => {}}
        />
      )}

      {recurring.length > 0 && (
        <>
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Recurring</h2>
          <div className="space-y-3 mb-8">
            {recurring.map((j: any) => (
              <JobCard
                key={j.id}
                job={j}
                onToggle={(enabled) => handleToggle(j.id, enabled)}
                onDelete={() => remove.mutate(j.id)}
                onRun={() => run.mutate(j.id)}
                onSave={(data) => update.mutate({ id: j.id, data })}
              />
            ))}
          </div>
        </>
      )}

      {oneShot.length > 0 && (
        <>
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">One-Shot</h2>
          <div className="space-y-3">
            {oneShot.map((j: any) => (
              <JobCard
                key={j.id}
                job={j}
                onToggle={(enabled) => handleToggle(j.id, enabled)}
                onDelete={() => remove.mutate(j.id)}
                onRun={() => run.mutate(j.id)}
                onSave={(data) => update.mutate({ id: j.id, data })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
