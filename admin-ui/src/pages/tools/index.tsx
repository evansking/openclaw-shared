import { useTools, useTool, useSaveTool } from "../../hooks/use-api";
import { api } from "../../lib/api";
import { useState } from "react";
import { MarkdownEditor } from "../../components/shared/markdown-editor";
import { MarkdownViewer } from "../../components/shared/markdown-viewer";

const langColors: Record<string, string> = {
  bash: "bg-green-900/50 text-green-300",
  javascript: "bg-yellow-900/50 text-yellow-300",
  typescript: "bg-blue-900/50 text-blue-300",
  python: "bg-indigo-900/50 text-indigo-300",
  ruby: "bg-red-900/50 text-red-300",
  swift: "bg-orange-900/50 text-orange-300",
  sql: "bg-cyan-900/50 text-cyan-300",
  json: "bg-purple-900/50 text-purple-300",
  yaml: "bg-pink-900/50 text-pink-300",
  markdown: "bg-gray-700/50 text-gray-300",
  text: "bg-gray-700/50 text-gray-300",
  binary: "bg-gray-700/50 text-gray-400",
};

function LangBadge({ language }: { language: string }) {
  const cls = langColors[language] || langColors.text;
  return (
    <span className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${cls}`}>
      {language}
    </span>
  );
}

function ToolDetail({ name, onRunResult }: { name: string; onRunResult: (r: string) => void }) {
  const { data: detail, isLoading } = useTool(name);
  const saveTool = useSaveTool();

  if (isLoading) return <div className="text-xs text-muted-foreground py-2">Loading...</div>;
  if (!detail) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground font-mono">{detail.path}</div>
      {detail.description && (
        <div className="text-xs text-foreground/80">{detail.description}</div>
      )}
      {detail.isBinary ? (
        <div className="text-xs text-muted-foreground italic p-4 bg-secondary rounded-md">
          Binary file — content not viewable
        </div>
      ) : detail.editable ? (
        <MarkdownEditor
          content={detail.content}
          onSave={(content) => saveTool.mutate({ name, content })}
          saving={saveTool.isPending}
        />
      ) : (
        <MarkdownViewer content={detail.content} />
      )}
    </div>
  );
}

export function ToolsIndex() {
  const { data: tools, isLoading } = useTools();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  const handleRun = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRunningTool(name);
    setRunResults((prev) => ({ ...prev, [name]: "" }));
    // Auto-expand to show result
    setExpanded(name);
    try {
      const res: any = await api.runTool(name);
      setRunResults((prev) => ({ ...prev, [name]: res.stdout || "Done" }));
    } catch (err: any) {
      setRunResults((prev) => ({ ...prev, [name]: `Error: ${err.message}` }));
    }
    setRunningTool(null);
  };

  const q = search.toLowerCase();
  const filtered = tools?.filter((t: any) => {
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.preview && t.preview.toLowerCase().includes(q))
    );
  });

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Tools</h1>
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 text-xs bg-secondary rounded border-0 outline-none text-foreground placeholder:text-muted-foreground w-48"
        />
      </div>
      <div className="space-y-3">
        {filtered?.map((t: any) => {
          const isExpanded = expanded === t.name;
          // Guess language from extension for the list badge
          const ext = t.name.split(".").pop()?.toLowerCase() || "";
          const extLang: Record<string, string> = {
            sh: "bash", bash: "bash", zsh: "bash",
            js: "javascript", mjs: "javascript", ts: "typescript",
            py: "python", rb: "ruby", pl: "perl",
            swift: "swift", sql: "sql",
            json: "json", yaml: "yaml", yml: "yaml",
            md: "markdown", txt: "text",
          };
          const guessedLang = extLang[ext] || (t.preview?.startsWith("#!") ? "bash" : "text");

          return (
            <div key={t.name} className="bg-card border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : t.name)}
                className="w-full text-left px-4 py-3 hover:bg-accent/50 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium truncate">{t.name}</span>
                    <LangBadge language={guessedLang} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {(t.size / 1024).toFixed(1)}KB | {new Date(t.modified).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.isExecutable && (
                    <button
                      onClick={(e) => handleRun(t.name, e)}
                      disabled={runningTool === t.name}
                      className="px-3 py-1.5 text-xs rounded bg-secondary hover:bg-accent disabled:opacity-50"
                    >
                      {runningTool === t.name ? "Running..." : "Run"}
                    </button>
                  )}
                  <span className="text-muted-foreground text-xs">{isExpanded ? "▼" : "▶"}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-3">
                  <ToolDetail
                    name={t.name}
                    onRunResult={(r) => setRunResults((prev) => ({ ...prev, [t.name]: r }))}
                  />
                  {runResults[t.name] && (
                    <pre className="mt-3 p-3 bg-secondary rounded-md text-xs font-mono whitespace-pre-wrap max-h-60 overflow-auto">
                      {runResults[t.name]}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered?.length === 0 && (
          <div className="text-sm text-muted-foreground">No matching tools.</div>
        )}
      </div>
    </div>
  );
}
