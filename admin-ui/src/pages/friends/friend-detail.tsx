import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useFriendFile, useSaveFriendFile, useFriends, useDeleteFriend } from "../../hooks/use-api";
import { MarkdownEditor } from "../../components/shared/markdown-editor";

export function FriendDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: friends } = useFriends();
  const friend = friends?.find((f: any) => f.slug === slug);
  const [activeFile, setActiveFile] = useState("index.md");
  const { data, isLoading } = useFriendFile(slug, activeFile);
  const save = useSaveFriendFile();
  const del = useDeleteFriend();

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="h-full flex flex-col pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">{friend?.name ?? slug}</h1>
        <button
          onClick={() => {
            if (confirm(`Delete ${friend?.name ?? slug}?`)) {
              del.mutate(slug!, { onSuccess: () => navigate("/friends") });
            }
          }}
          disabled={del.isPending}
          className="w-[60px] h-[26px] inline-flex items-center justify-center text-xs rounded bg-destructive text-destructive-foreground disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {del.isPending ? <Loader2 size={13} className="animate-spin" /> : "Delete"}
        </button>
      </div>

      {friend && friend.files.length > 1 && (
        <div className="flex gap-1 mb-4">
          {friend.files.map((f: string) => (
            <button
              key={f}
              onClick={() => setActiveFile(f)}
              className={`text-xs px-3 py-1 rounded ${
                activeFile === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <MarkdownEditor
          content={data?.content ?? ""}
          onSave={(content) => save.mutate({ slug: slug!, file: activeFile, content })}
          saving={save.isPending}
        />
      </div>
    </div>
  );
}
