import { useState, useRef } from "react";
import {
  useGatewayStats,
  useGatewaySessions,
  useGatewayActivity,
  useGatewayErrors,
  useSessionMessages,
} from "../../hooks/use-api";
import { timeAgo, formatTime } from "../../lib/format";

function categoryIcon(cat: string): string {
  switch (cat) {
    case "delivery":
      return "\u{1f4e4}";
    case "browser":
      return "\u{1f310}";
    case "auth":
      return "\u{1f511}";
    default:
      return "\u{2699}\u{fe0f}";
  }
}

function typeIcon(type: string): string {
  switch (type) {
    case "group":
      return "\u{1f465}";
    case "subagent":
      return "\u{1f916}";
    default:
      return "\u{1f4f1}";
  }
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  value,
  label,
  onClick,
}: {
  value: string | number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-card border rounded-lg p-4 ${onClick ? "cursor-pointer hover:border-foreground/30 transition-colors" : ""}`}
      onClick={onClick}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Row (expandable)
// ---------------------------------------------------------------------------

function SessionRow({
  session,
  expanded,
  onToggle,
}: {
  session: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: messages, isLoading } = useSessionMessages(
    expanded ? session.sessionId : null
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/50"
      >
        <span className="text-sm shrink-0 opacity-70">
          {typeIcon(session.type)}
        </span>
        <span className="text-[11px] text-muted-foreground font-mono shrink-0 w-12">
          {session.agent}
        </span>
        <span className="text-sm flex-1 truncate">{session.friendlyName}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {session.totalTokens > 0
            ? `${Math.round(session.totalTokens / 1000)}K tok`
            : ""}
        </span>
        <span className="text-xs text-muted-foreground shrink-0 w-16 text-right">
          {session.updatedAt ? timeAgo(session.updatedAt) : ""}
        </span>
        <span className="text-muted-foreground shrink-0">
          {expanded ? "\u25BE" : "\u25B8"}
        </span>
      </button>

      {expanded && (
        <div className="border-t bg-secondary/30 px-4 py-3">
          {isLoading && (
            <div className="text-xs text-muted-foreground">
              Loading messages...
            </div>
          )}
          {messages && messages.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No messages in this session.
            </div>
          )}
          {messages && messages.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {messages.slice(0, 20).map((m: any, i: number) => (
                <div key={i} className="text-sm">
                  <span className="text-xs opacity-60 mr-2">
                    {m.role === "user" ? "\u{1f464}" : "\u{1f916}"}
                  </span>
                  <span className="text-muted-foreground text-xs mr-2">
                    {m.timestamp ? formatTime(m.timestamp) : ""}
                  </span>
                  <span className="text-foreground">
                    {m.text.length > 300
                      ? m.text.slice(0, 300) + "..."
                      : m.text}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
            <span>
              Context: {session.percentUsed}% (
              {Math.round(session.totalTokens / 1000)}K /{" "}
              {Math.round(session.contextTokens / 1000)}K)
            </span>
            {session.model && <span>Model: {session.model}</span>}
            {session.abortedLastRun && (
              <span className="text-yellow-500">Aborted last run</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error Row (expandable)
// ---------------------------------------------------------------------------

function ErrorRow({
  err,
  expanded,
  onToggle,
}: {
  err: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="px-4 py-2 flex flex-col cursor-pointer hover:bg-accent/30"
      onClick={onToggle}
    >
      <div className="flex items-start gap-3 text-sm">
        <span className="shrink-0 opacity-70">
          {err.count > 3 ? "\u26a0\ufe0f" : "\u274c"}
        </span>
        <span className="flex-1 text-muted-foreground min-w-0">
          {err.subsystem && (
            <span className="text-foreground font-mono text-xs mr-1.5">
              [{err.subsystem}]
            </span>
          )}
          {expanded
            ? err.message
            : err.message.length > 120
              ? err.message.slice(0, 120) + "..."
              : err.message}
          {err.count > 1 && (
            <span className="ml-2 text-xs text-yellow-500">
              (x{err.count})
            </span>
          )}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {timeAgo(err.timestamp)}
        </span>
      </div>
      {expanded && (
        <div className="mt-2 ml-8 text-xs text-muted-foreground font-mono">
          {formatTime(err.timestamp)}
          {err.subsystem && ` [${err.subsystem}]`}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function GatewayIndex() {
  const { data: stats } = useGatewayStats();
  const { data: sessions } = useGatewaySessions();
  const { data: activity } = useGatewayActivity();
  const { data: errors } = useGatewayErrors();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [expandedError, setExpandedError] = useState<number | null>(null);
  const [errorSearch, setErrorSearch] = useState("");
  const errorsRef = useRef<HTMLDivElement>(null);

  // Filter out cron sessions — cron page already covers those
  const messagingSessions = sessions?.filter(
    (s: any) => s.type === "direct" || s.type === "group"
  );

  const filteredErrors = errors?.filter((err: any) => {
    if (!errorSearch) return true;
    const q = errorSearch.toLowerCase();
    return (
      err.message.toLowerCase().includes(q) ||
      (err.subsystem && err.subsystem.toLowerCase().includes(q))
    );
  });

  const scrollToErrors = () => {
    errorsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="pt-6">
      <h1 className="text-lg font-semibold mb-6">Gateway</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          value={stats?.totalSessions ?? "-"}
          label="sessions"
        />
        <StatCard
          value={stats?.formattedTokens ?? "-"}
          label="tokens"
        />
        <StatCard
          value={stats?.deliveriesToday ?? "-"}
          label="sent today"
        />
        <StatCard
          value={stats?.errorsToday ?? "-"}
          label="errors today"
          onClick={scrollToErrors}
        />
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
          Recent Activity
        </h2>
        <div className="bg-card border rounded-lg divide-y max-h-60 overflow-y-auto">
          {activity?.slice(0, 30).map((evt: any, i: number) => (
            <div
              key={i}
              className="px-4 py-2 flex items-start gap-3 text-sm"
            >
              <span className="shrink-0 opacity-70">
                {categoryIcon(evt.category)}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 w-20">
                {formatTime(evt.timestamp)}
              </span>
              <span className="flex-1 text-muted-foreground truncate">
                {evt.subsystem ? (
                  <span className="text-foreground font-mono text-xs mr-1.5">
                    [{evt.subsystem}]
                  </span>
                ) : null}
                {evt.message}
              </span>
            </div>
          ))}
          {(!activity || activity.length === 0) && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No recent activity.
            </div>
          )}
        </div>
      </div>

      {/* Sessions (messaging only — cron is in the Cron page) */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Sessions
          </h2>
          {messagingSessions && (
            <span className="text-[11px] text-muted-foreground">
              {messagingSessions.length}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {messagingSessions?.map((s: any) => (
            <SessionRow
              key={s.key}
              session={s}
              expanded={expandedSession === s.sessionId}
              onToggle={() =>
                setExpandedSession(
                  expandedSession === s.sessionId ? null : s.sessionId
                )
              }
            />
          ))}
          {(!messagingSessions || messagingSessions.length === 0) && (
            <div className="text-sm text-muted-foreground">
              No sessions found.
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      <div ref={errorsRef}>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Errors
          </h2>
          <input
            type="text"
            placeholder="search errors..."
            value={errorSearch}
            onChange={(e) => setErrorSearch(e.target.value)}
            className="px-2 py-1 text-xs bg-secondary rounded border-0 outline-none text-foreground placeholder:text-muted-foreground w-48"
          />
          {filteredErrors && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              {filteredErrors.length}
            </span>
          )}
        </div>
        <div className="bg-card border rounded-lg divide-y max-h-96 overflow-y-auto">
          {filteredErrors?.map((err: any, i: number) => (
            <ErrorRow
              key={i}
              err={err}
              expanded={expandedError === i}
              onToggle={() =>
                setExpandedError(expandedError === i ? null : i)
              }
            />
          ))}
          {(!filteredErrors || filteredErrors.length === 0) && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {errorSearch ? "No matching errors." : "No recent errors."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
