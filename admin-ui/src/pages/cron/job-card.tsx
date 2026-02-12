import { useState } from "react";
import { StatusBadge } from "../../components/shared/status-badge";
import { RunHistory } from "./run-history";
import { formatJobName } from "../../lib/format";
import { jobColor } from "./job-color";

interface Props {
  job: any;
  isNew?: boolean;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onRun: () => void;
  onSave: (data: any) => void;
  onCancel?: () => void;
}

function scheduleToHuman(schedule: any): string {
  if (!schedule) return "—";
  if (schedule.kind === "at") {
    const ts = schedule.at || schedule.atMs;
    if (!ts) return "Once: (no date)";
    const d = new Date(ts);
    return `Once: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (schedule.kind === "cron" && schedule.expr) {
    const parts = schedule.expr.split(" ");
    if (parts.length < 5) return schedule.expr;
    const [min, hour, dom, , ] = parts;
    if (dom === "*" && hour !== "*" && min !== "*") return `Daily at ${hour}:${min.padStart(2, "0")}`;
    if (parts[0].startsWith("*/") || parts[1].startsWith("*/")) {
      return `Every ${parts[1].startsWith("*/") ? parts[1].slice(2) + "h" : parts[0].slice(2) + "m"}`;
    }
    return schedule.expr;
  }
  return JSON.stringify(schedule);
}

function getPayloadText(payload: any): string {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  if (payload.kind === "agentTurn") return payload.message ?? "";
  if (payload.kind === "systemEvent") return payload.text ?? "";
  return JSON.stringify(payload, null, 2);
}

function getScheduleExpr(schedule: any): string {
  if (!schedule) return "";
  if (schedule.kind === "cron") return schedule.expr ?? "";
  if (schedule.kind === "at") {
    // Handle both `at` (ISO string) and `atMs` (timestamp) formats
    const ts = schedule.at || schedule.atMs;
    if (!ts) return "";
    return typeof ts === "string" ? ts : new Date(ts).toISOString();
  }
  return "";
}

function getScheduleTz(schedule: any): string {
  if (!schedule) return "America/Los_Angeles";
  return schedule.tz ?? "America/Los_Angeles";
}

export function JobCard({ job, isNew, onToggle, onDelete, onRun, onSave, onCancel }: Props) {
  const [expanded, setExpanded] = useState(!!isNew);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [form, setForm] = useState({
    name: job.name ?? "",
    id: job.id ?? "",
    scheduleExpr: isNew ? "0 9 * * *" : getScheduleExpr(job.schedule),
    timezone: isNew ? "America/Los_Angeles" : getScheduleTz(job.schedule),
    agentId: job.agentId ?? "main",
    sessionTarget: job.sessionTarget ?? "",
    payloadText: isNew ? "" : getPayloadText(job.payload),
  });

  const handleField = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = () => {
    const update: any = {
      name: form.name,
      agentId: form.agentId,
      sessionTarget: form.sessionTarget || undefined,
      schedule: { kind: "cron", expr: form.scheduleExpr, tz: form.timezone },
      payload: { kind: "agentTurn", message: form.payloadText },
    };
    if (isNew) {
      update.id = form.id;
      update.enabled = true;
    }
    onSave(update);
    if (!isNew) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const lastRun = job.state?.lastRunAtMs
    ? new Date(job.state.lastRunAtMs).toLocaleString()
    : null;

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50"
        onClick={() => !isNew && setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!isNew && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: jobColor(job.id) }}
              />
            )}
            <span className="text-sm font-medium truncate">{formatJobName(job.name) || "New Job"}</span>
            <span className="text-xs font-mono text-muted-foreground">{scheduleToHuman(job.schedule)}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] px-1.5 py-0 rounded bg-secondary text-muted-foreground">{job.agentId}</span>
            {lastRun && (
              <span className="text-[11px] text-muted-foreground">last: {lastRun}</span>
            )}
          </div>
        </div>
        <StatusBadge status={job.enabled ? "enabled" : "disabled"} />
        {!isNew && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(!job.enabled); }}
            className={`w-9 h-5 rounded-full transition-colors relative ${job.enabled ? "bg-primary" : "bg-zinc-600"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${job.enabled ? "left-[18px]" : "left-0.5"}`} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Name</span>
              <input value={form.name} onChange={(e) => handleField("name", e.target.value)} className="w-full mt-1 px-2 py-1.5 text-sm bg-secondary rounded border-0 outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">ID</span>
              <input value={form.id} onChange={(e) => handleField("id", e.target.value)} disabled={!isNew} className="w-full mt-1 px-2 py-1.5 text-sm bg-secondary rounded border-0 outline-none disabled:opacity-50 font-mono text-xs" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Schedule (cron expr)</span>
              <input value={form.scheduleExpr} onChange={(e) => handleField("scheduleExpr", e.target.value)} className="w-full mt-1 px-2 py-1.5 text-sm bg-secondary rounded border-0 outline-none font-mono" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Timezone</span>
              <input value={form.timezone} onChange={(e) => handleField("timezone", e.target.value)} className="w-full mt-1 px-2 py-1.5 text-sm bg-secondary rounded border-0 outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Agent</span>
              <select value={form.agentId} onChange={(e) => handleField("agentId", e.target.value)} className="w-full mt-1 px-2 py-1.5 text-sm bg-secondary rounded border-0 outline-none">
                <option value="main">main</option>
                <option value="shared">shared</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Session Target</span>
              <input value={form.sessionTarget} onChange={(e) => handleField("sessionTarget", e.target.value)} className="w-full mt-1 px-2 py-1.5 text-sm bg-secondary rounded border-0 outline-none" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-muted-foreground">Payload</span>
            <textarea value={form.payloadText} onChange={(e) => handleField("payloadText", e.target.value)} rows={12} className="w-full mt-1 px-2 py-1.5 text-sm bg-secondary rounded border-0 outline-none font-mono resize-y" />
          </label>
          <div className="flex gap-2 pt-2">
            {!isNew && (
              <button onClick={() => { setRunning(true); onRun(); setTimeout(() => setRunning(false), 3000); }} disabled={running} className={`px-3 py-1.5 text-xs rounded transition-colors ${running ? "bg-yellow-600 text-white" : "bg-secondary hover:bg-accent"}`}>{running ? "Running..." : "Run Now"}</button>
            )}
            <button onClick={handleSave} className={`px-3 py-1.5 text-xs rounded transition-colors ${saved ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
              {isNew ? "Create" : saved ? "Saved!" : "Save"}
            </button>
            {isNew ? (
              <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded bg-secondary hover:bg-accent">Cancel</button>
            ) : (
              <button onClick={onDelete} className="px-3 py-1.5 text-xs rounded bg-destructive text-destructive-foreground hover:opacity-90 ml-auto">Delete</button>
            )}
          </div>
          {!isNew && (
            <>
              <div className="border-t my-3" />
              <RunHistory jobId={job.id} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
