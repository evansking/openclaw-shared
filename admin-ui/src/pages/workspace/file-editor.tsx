import { useParams } from "react-router-dom";
import { useWorkspaceFile, useSaveWorkspaceFile } from "../../hooks/use-api";
import { MarkdownEditor } from "../../components/shared/markdown-editor";

export function FileEditor() {
  const { filename } = useParams<{ filename: string }>();
  const { data, isLoading } = useWorkspaceFile(filename);
  const save = useSaveWorkspaceFile();

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading...</div>;
  if (!data) return <div className="text-muted-foreground text-sm">File not found</div>;

  return (
    <div className="h-full flex flex-col pt-6">
      <h1 className="text-lg font-semibold mb-4 font-mono">{filename}</h1>
      <div className="flex-1 min-h-0">
        <MarkdownEditor
          content={data.content}
          onSave={(content) => save.mutate({ name: filename!, content })}
          saving={save.isPending}
        />
      </div>
    </div>
  );
}
