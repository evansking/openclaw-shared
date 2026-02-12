import { useSkills, useSkill } from "../../hooks/use-api";
import { useState } from "react";
import { MarkdownViewer } from "../../components/shared/markdown-viewer";

export function SkillsIndex() {
  const { data: skills, isLoading } = useSkills();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detail } = useSkill(selected ?? undefined);
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  const q = search.toLowerCase();
  const filtered = skills?.filter((s: any) => {
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.preview && s.preview.toLowerCase().includes(q))
    );
  });

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Skills</h1>
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 text-xs bg-secondary rounded border-0 outline-none text-foreground placeholder:text-muted-foreground w-48"
        />
      </div>
      <div className="space-y-3">
        {filtered?.map((s: any) => (
          <div key={s.name} className="bg-card border rounded-lg overflow-hidden">
            <button
              onClick={() => setSelected(selected === s.name ? null : s.name)}
              className="w-full text-left px-4 py-3 hover:bg-accent/50 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
              </div>
              <span className="text-muted-foreground text-xs">{selected === s.name ? "\u25BC" : "\u25B6"}</span>
            </button>
            {selected === s.name && detail && (
              <div className="border-t px-4 py-3">
                <MarkdownViewer content={detail.content} />
              </div>
            )}
          </div>
        ))}
        {filtered?.length === 0 && (
          <div className="text-sm text-muted-foreground">No matching skills.</div>
        )}
      </div>
    </div>
  );
}
