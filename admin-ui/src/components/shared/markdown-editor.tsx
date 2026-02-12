import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  content: string;
  onSave: (content: string) => void;
  saving?: boolean;
}

export function MarkdownEditor({ content, onSave, saving }: Props) {
  const [value, setValue] = useState(content);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValue(content);
    setDirty(false);
  }, [content]);

  const handleChange = (v: string) => {
    setValue(v);
    setDirty(v !== content);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{value.split("\n").length} lines</span>
        <button
          onClick={() => onSave(value)}
          disabled={!dirty || saving}
          className="min-w-[52px] h-[26px] px-3 inline-flex items-center justify-center text-xs rounded bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : "Save"}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 w-full bg-secondary rounded-md p-4 font-mono text-sm resize-none outline-none border focus:border-ring"
        spellCheck={false}
      />
    </div>
  );
}
