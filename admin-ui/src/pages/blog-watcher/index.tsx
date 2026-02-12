import { useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Mail,
  Linkedin,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookOpen,
  X,
} from "lucide-react";
import { useBlogArticles, useBlogFeeds, useBlogStatus, useCheckBlog, useSendToKindle, useLinkedinDraft } from "../../hooks/use-api";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 0 || seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DraftViewer({ articleId, onClose }: { articleId: string; onClose: () => void }) {
  const { data, isLoading } = useLinkedinDraft(articleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-card border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Linkedin size={14} className="text-blue-400" />
            LinkedIn Draft
            {data?.filename && (
              <span className="text-xs text-muted-foreground">({data.filename})</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-8">Loading draft...</div>
          ) : data?.content ? (
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{data.content}</pre>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">Draft not found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  expanded,
  onToggle,
  isSent,
  onSendToKindle,
  onViewDraft,
}: {
  article: any;
  expanded: boolean;
  onToggle: () => void;
  isSent: boolean;
  onSendToKindle: () => void;
  onViewDraft: () => void;
}) {
  const dateStr = article.pubDate || article.processedAt;
  const hasDraft = !!article.linkedinDraft;

  return (
    <div
      className="bg-card border rounded-lg p-4 cursor-pointer hover:border-muted-foreground/30 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline leading-tight"
            onClick={(e) => e.stopPropagation()}
          >
            {article.title}
          </a>
          <div className="text-xs text-muted-foreground mt-1">
            {article.feedName} {dateStr ? `\u00b7 ${timeAgo(dateStr)}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {isSent ? (
            <span title="Sent to Kindle">
              <BookOpen size={15} className="text-green-500" />
            </span>
          ) : (
            <button
              title="Send to Kindle"
              onClick={(e) => {
                e.stopPropagation();
                onSendToKindle();
              }}
              className="p-0.5 rounded hover:bg-accent transition-colors"
            >
              <BookOpen size={15} className="text-muted-foreground hover:text-foreground" />
            </button>
          )}
          {hasDraft ? (
            <button
              title="View LinkedIn draft"
              onClick={(e) => {
                e.stopPropagation();
                onViewDraft();
              }}
              className="p-0.5 rounded hover:bg-accent transition-colors"
            >
              <Linkedin size={15} className="text-blue-400" />
            </button>
          ) : (
            <span title="No LinkedIn draft">
              <Linkedin size={15} className="text-muted-foreground/30" />
            </span>
          )}
          {article.kindle === "failed" && (
            <span title={`Kindle failed: ${article.kindleError || "unknown"}`}>
              <AlertTriangle size={15} className="text-red-500" />
            </span>
          )}
          {article.texted === true && (
            <span title="Texted">
              <Mail size={15} className="text-green-500" />
            </span>
          )}
          {article.texted === false && (
            <span title="Text failed">
              <Mail size={15} className="text-red-500" />
            </span>
          )}
          {expanded ? (
            <ChevronDown size={14} className="text-muted-foreground ml-1" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground ml-1" />
          )}
        </div>
      </div>

      {!expanded && article.summary && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{article.summary}</p>
      )}

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          {article.summary && <p className="text-sm leading-relaxed">{article.summary}</p>}
          <div className="flex flex-wrap gap-4 text-xs">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} /> Open article
            </a>
            {isSent ? (
              <span className="text-green-500 inline-flex items-center gap-1">
                <BookOpen size={12} /> Sent to Kindle
              </span>
            ) : (
              <button
                className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendToKindle();
                }}
              >
                <BookOpen size={12} /> Send to Kindle
              </button>
            )}
            {hasDraft && (
              <button
                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDraft();
                }}
              >
                <Linkedin size={12} /> View Draft
              </button>
            )}
          </div>
          {article.kindle === "failed" && article.kindleError && (
            <div className="text-xs text-red-400 bg-red-950/20 rounded p-2">
              Kindle error: {article.kindleError}
            </div>
          )}
          {(article.processedAt || article.pubDate) && (
            <div className="text-xs text-muted-foreground">
              {article.processedAt
                ? `Processed ${timeAgo(article.processedAt)}`
                : `Published ${timeAgo(article.pubDate)}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BlogWatcherIndex() {
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [draftFilter, setDraftFilter] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localSent, setLocalSent] = useState<Set<string>>(new Set());
  const [viewingDraftId, setViewingDraftId] = useState<string | null>(null);

  const { data: articles, isLoading: loadingArticles } = useBlogArticles();
  const { data: feeds } = useBlogFeeds();
  const { data: status } = useBlogStatus();
  const checkNow = useCheckBlog();
  const sendToKindle = useSendToKindle();

  const filteredArticles = articles
    ?.filter((a: any) => !selectedFeed || a.feedName === selectedFeed)
    .filter((a: any) => !draftFilter || a.linkedinDraft);

  const isSent = (a: any) => a.kindleSent || localSent.has(a.id);

  const tracked = articles?.filter((a: any) => isSent(a) || a.kindle === "failed") || [];
  const kindleRate = tracked.length
    ? Math.round((tracked.filter((a: any) => isSent(a)).length / tracked.length) * 100)
    : null;

  const stats = [
    { label: "Total Articles", value: status?.totalArticles ?? "-" },
    { label: "Active Feeds", value: status?.feedCount ?? "-" },
    { label: "Last Check", value: status?.lastCheck ? timeAgo(status.lastCheck) : "-" },
    { label: "Kindle Rate", value: kindleRate !== null ? `${kindleRate}%` : "-" },
  ];

  const pill = (active: boolean) =>
    `px-3 py-1 text-xs rounded-full border transition-colors ${
      active
        ? "bg-foreground text-background border-foreground"
        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
    }`;

  return (
    <div className="pt-6">
      {viewingDraftId && (
        <DraftViewer articleId={viewingDraftId} onClose={() => setViewingDraftId(null)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Blog Watcher</h1>
        <button
          onClick={() => checkNow.mutate()}
          disabled={checkNow.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border bg-card hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={checkNow.isPending ? "animate-spin" : ""} />
          {checkNow.isPending ? "Checking..." : "Check Now"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setSelectedFeed(null)} className={pill(selectedFeed === null)}>
          All
        </button>
        {feeds?.map((f: any) => (
          <button
            key={f.name}
            onClick={() => setSelectedFeed(selectedFeed === f.name ? null : f.name)}
            className={pill(selectedFeed === f.name)}
          >
            {f.name}
          </button>
        ))}
        <button
          onClick={() => setDraftFilter(!draftFilter)}
          className={pill(draftFilter)}
        >
          Has Draft
        </button>
      </div>

      {loadingArticles ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading articles...</div>
      ) : filteredArticles?.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          {articles?.length === 0
            ? "No articles yet. Run a check to fetch new articles."
            : "No articles match this filter."}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredArticles?.map((article: any) => (
            <ArticleCard
              key={article.id}
              article={article}
              expanded={expandedId === article.id}
              onToggle={() => setExpandedId(expandedId === article.id ? null : article.id)}
              isSent={isSent(article)}
              onSendToKindle={() => {
                setLocalSent((prev) => new Set(prev).add(article.id));
                sendToKindle.mutate(article.id);
              }}
              onViewDraft={() => setViewingDraftId(article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
