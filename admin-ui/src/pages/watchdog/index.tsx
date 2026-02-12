import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useWatchdogState, useWatchdogLogs, useWatchdogRuns, useWatchdogStats } from "../../hooks/use-api";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 0 || seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function levelBadge(level: number) {
  const styles: Record<number, string> = {
    1: "bg-yellow-500/10 text-yellow-500",
    2: "bg-orange-500/10 text-orange-500",
    3: "bg-red-500/10 text-red-500",
    4: "bg-red-600/20 text-red-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${styles[level] || "bg-muted text-muted-foreground"}`}>
      L{level}
    </span>
  );
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    running: "bg-blue-500/10 text-blue-500",
    completed: "bg-green-500/10 text-green-500",
    aborted: "bg-red-500/10 text-red-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function logLevelStyle(level: string): string {
  switch (level) {
    case "ERROR":
      return "text-red-400";
    case "WARN":
      return "text-yellow-400";
    case "INFO":
      return "text-blue-400";
    case "DEBUG":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

type Tab = "overview" | "runs" | "alerts" | "logs";

export function WatchdogIndex() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useWatchdogStats();
  const { data: state } = useWatchdogState();
  const { data: logs, refetch: refetchLogs } = useWatchdogLogs(100);
  const { data: runs, refetch: refetchRuns } = useWatchdogRuns(50);

  const statCards = [
    { label: "Active Runs", value: stats?.activeRuns ?? "—", icon: Activity },
    { label: "Completed Today", value: stats?.completedToday ?? "—", icon: CheckCircle2 },
    { label: "Alerts (1h)", value: stats?.alertsLastHour ?? "—", icon: AlertTriangle },
    { label: "Avg Duration", value: stats?.avgDurationMs ? formatMs(stats.avgDurationMs) : "—", icon: Clock },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "runs", label: "Runs" },
    { key: "alerts", label: "Alert History" },
    { key: "logs", label: "Logs" },
  ];

  const pill = (active: boolean) =>
    `px-3 py-1 text-xs rounded-full border transition-colors ${
      active
        ? "bg-foreground text-background border-foreground"
        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
    }`;

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
    refetchRuns();
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Eye size={20} />
          Message Watchdog
        </h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card border rounded hover:bg-accent transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={pill(activeTab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Current State */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Current State</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Log File</div>
                <div className="font-mono text-xs truncate">
                  {state?.lastLogPosition?.file?.split("/").pop() || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Log Offset</div>
                <div className="font-mono text-xs">
                  {state?.lastLogPosition?.offset?.toLocaleString() || "0"} bytes
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Suppressed Runs</div>
                <div>{Object.keys(state?.suppressedRuns || {}).length}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Recovery</div>
                <div>{state?.lastRecoveryAttempt ? timeAgo(state.lastRecoveryAttempt) : "Never"}</div>
              </div>
            </div>
          </div>

          {/* Longest Active Run */}
          {stats?.longestActiveMs > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-500">
                <Clock size={16} />
                <span className="font-medium">Longest Active Run</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-yellow-400">
                {formatMs(stats.longestActiveMs)}
              </div>
            </div>
          )}

          {/* Recent Runs */}
          <div>
            <h3 className="text-sm font-medium mb-3">Recent Runs</h3>
            <div className="space-y-2">
              {runs?.slice(0, 5).map((run: any) => (
                <div
                  key={run.runId}
                  className="bg-card border rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {statusBadge(run.status)}
                    <span className="font-mono text-xs text-muted-foreground">
                      {run.runId.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {run.messageChannel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {run.durationMs ? formatMs(run.durationMs) : run.elapsedMs ? `${formatMs(run.elapsedMs)} (running)` : "—"}
                    <span>{timeAgo(run.startedAt)}</span>
                  </div>
                </div>
              ))}
              {(!runs || runs.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No runs found today
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "runs" && (
        <div className="space-y-2">
          {runs?.map((run: any) => (
            <div
              key={run.runId}
              className="bg-card border rounded-lg p-4 cursor-pointer hover:border-muted-foreground/30 transition-colors"
              onClick={() => setExpandedRun(expandedRun === run.runId ? null : run.runId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusBadge(run.status)}
                  <span className="font-mono text-sm">{run.runId.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded">
                    {run.messageChannel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">
                    {run.durationMs ? formatMs(run.durationMs) : run.elapsedMs ? `${formatMs(run.elapsedMs)}` : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(run.startedAt)}</span>
                  {expandedRun === run.runId ? (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={14} className="text-muted-foreground" />
                  )}
                </div>
              </div>
              {expandedRun === run.runId && (
                <div className="mt-3 pt-3 border-t text-sm space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Run ID</div>
                      <div className="font-mono text-xs">{run.runId}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Session ID</div>
                      <div className="font-mono text-xs">{run.sessionId}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Started</div>
                      <div className="text-xs">{new Date(run.startedAt).toLocaleString()}</div>
                    </div>
                    {run.completedAt && (
                      <div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                        <div className="text-xs">{new Date(run.completedAt).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {(!runs || runs.length === 0) && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No runs found today
            </div>
          )}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-2">
          {state?.alertHistory?.slice().reverse().map((alert: any, i: number) => (
            <div key={i} className="bg-card border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {levelBadge(alert.level)}
                <span className="font-mono text-xs text-muted-foreground">
                  {alert.runId.slice(0, 8)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(alert.at)}</span>
            </div>
          ))}
          {(!state?.alertHistory || state.alertHistory.length === 0) && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No alerts sent yet
            </div>
          )}
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Time</th>
                  <th className="text-left px-3 py-2 font-medium w-16">Level</th>
                  <th className="text-left px-3 py-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs?.slice().reverse().map((log: any, i: number) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-secondary/50">
                    <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">
                      {log.timestamp.split(" ")[1]}
                    </td>
                    <td className={`px-3 py-1.5 font-medium ${logLevelStyle(log.level)}`}>
                      {log.level}
                    </td>
                    <td className="px-3 py-1.5 font-mono truncate max-w-[600px]">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!logs || logs.length === 0) && (
              <div className="text-sm text-muted-foreground text-center py-8">
                No logs available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
