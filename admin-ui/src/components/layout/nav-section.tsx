import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  active?: boolean;
  onClickTitle?: () => void;
  children?: React.ReactNode;
}

export function NavSection({ title, icon, count, defaultOpen = false, active, onClickTitle, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const isLink = !!onClickTitle && !children;

  return (
    <div className="mb-1">
      <button
        onClick={isLink ? onClickTitle : () => setOpen(!open)}
        className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider hover:text-foreground ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {isLink ? (
          <span className="w-[14px] shrink-0" />
        ) : (
          open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />
        )}
        {icon && <span className="shrink-0 opacity-70">{icon}</span>}
        <span>{title}</span>
        {count !== undefined && (
          <span className="ml-auto text-[10px] bg-secondary px-1.5 rounded">{count}</span>
        )}
      </button>
      {!isLink && open && children && (
        <div className="relative ml-[18px] pl-3 border-l border-border">
          {children}
        </div>
      )}
    </div>
  );
}
