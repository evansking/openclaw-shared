import { useState } from "react";
import {
  Brain,
  Calendar,
  Bell,
  Minus,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  useTextProcessorDecisions,
  useTextProcessorStats,
} from "../../hooks/use-api";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 0 || seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ACTION_ICON: Record<string, typeof Brain> = {
  memory: Brain,
  calendar: Calendar,
  reminder: Bell,
  none: Minus,
};

function outcomeBadge(outcome: string) {
  const styles: Record<string, string> = {
    memory_saved: "bg-green-500/10 text-green-500",
    reminder_sent: "bg-green-500/10 text-green-500",
    calendar_sent: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
    below_threshold: "bg-yellow-500/10 text-yellow-500",
    error: "bg-red-500/10 text-red-500",
    none: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    memory_saved: "memory saved",
    reminder_sent: "reminder sent",
    calendar_sent: "calendar sent",
    below_threshold: "below threshold",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[11px] font-medium ${styles[outcome] || styles.none}`}
    >
      {labels[outcome] || outcome}
    </span>
  );
}

type Filter = "flagged" | "all" | "memory" | "calendar" | "reminder";

function DecisionCard({
  decision,
  expanded,
  onToggle,
}: {
  decision: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const action = decision.deepseek?.action || "none";
  const Icon = ACTION_ICON[action] || Minus;
  const confidence = decision.deepseek?.confidence;

  return (
    <div
      className="bg-card border rounded-lg p-4 cursor-pointer hover:border-muted-foreground/30 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{decision.sender}</span>
              <span className="text-xs text-muted-foreground">
                {decision.timestamp ? timeAgo(decision.timestamp) : ""}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {decision.messagePreview}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {outcomeBadge(decision.outcome)}
          {confidence != null && (
            <span className="text-[11px] text-muted-foreground">
              {Math.round(confidence * 100)}%
            </span>
          )}
          {expanded ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div
          className="mt-3 pt-3 border-t space-y-3 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="text-xs text-muted-foreground mb-1">Message</div>
            <p className="leading-relaxed">{decision.messagePreview}</p>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">
              DeepSeek Classification
            </div>
            <div className="bg-secondary rounded p-2 text-xs space-y-1">
              <div>
                Action: <span className="font-medium">{action}</span>
              </div>
              <div>
                Confidence:{" "}
                <span className="font-medium">
                  {confidence != null
                    ? `${Math.round(confidence * 100)}%`
                    : "\u2014"}
                </span>
              </div>
              {decision.deepseek?.data &&
                Object.keys(decision.deepseek.data).length > 0 && (
                  <div className="mt-1">
                    <div className="text-muted-foreground mb-0.5">
                      Extracted data:
                    </div>
                    <pre className="text-[11px] whitespace-pre-wrap break-all">
                      {JSON.stringify(decision.deepseek.data, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </div>

          {decision.claude && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Claude Verification
              </div>
              <div className="bg-secondary rounded p-2 text-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  {decision.claude.decision === "approved" ? (
                    <CheckCircle2 size={13} className="text-green-500" />
                  ) : (
                    <XCircle size={13} className="text-red-500" />
                  )}
                  <span className="font-medium capitalize">
                    {decision.claude.decision}
                  </span>
                </div>
                {decision.claude.reason && (
                  <div className="text-muted-foreground">
                    {decision.claude.reason}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 text-xs text-muted-foreground">
            {decision.senderPhone && (
              <span>Phone: {decision.senderPhone}</span>
            )}
            {decision.chatId != null && (
              <span>Chat ID: {decision.chatId}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TextProcessorIndex() {
  const [filter, setFilter] = useState<Filter>("flagged");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: decisions, isLoading } = useTextProcessorDecisions();
  const { data: stats } = useTextProcessorStats();

  const filtered = decisions?.filter((d: any) => {
    if (filter === "all") return true;
    if (filter === "flagged") return d.deepseek?.action !== "none";
    return d.deepseek?.action === filter;
  });

  const statCards = [
    { label: "Total", value: stats?.total ?? "\u2014" },
    { label: "Flagged", value: stats?.flagged ?? "\u2014" },
    { label: "Approved", value: stats?.approved ?? "\u2014" },
    { label: "Rejected", value: stats?.rejected ?? "\u2014" },
  ];

  const filters: { key: Filter; label: string }[] = [
    { key: "flagged", label: "Flagged" },
    { key: "all", label: "All" },
    { key: "memory", label: "Memory" },
    { key: "calendar", label: "Calendar" },
    { key: "reminder", label: "Reminder" },
  ];

  const pill = (active: boolean) =>
    `px-3 py-1 text-xs rounded-full border transition-colors ${
      active
        ? "bg-foreground text-background border-foreground"
        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
    }`;

  return (
    <div className="pt-6">
      <h1 className="text-lg font-semibold mb-6">Text Classification</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={pill(filter === f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Decision list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Loading decisions...
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          {decisions?.length === 0
            ? "No decisions yet. Waiting for the text processor to classify messages."
            : "No decisions match this filter."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map((d: any) => (
            <DecisionCard
              key={d.id}
              decision={d}
              expanded={expandedId === d.id}
              onToggle={() =>
                setExpandedId(expandedId === d.id ? null : d.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
