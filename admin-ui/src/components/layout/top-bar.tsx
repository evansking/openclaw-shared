import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Settings, Search } from "lucide-react";
import { AgentContext } from "../../App";
import { CommandPalette } from "./command-palette";
import { useAppConfig } from "../../hooks/use-api";

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { agent, setAgent } = useContext(AgentContext);
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { data: appConfig } = useAppConfig();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const title = appConfig?.app_title || "OpenClaw Admin";
  const titleLetter = title.charAt(0).toUpperCase();

  return (
    <>
      <header className="h-12 border-b flex items-center px-4 bg-[hsl(0,0%,9%)] shrink-0">
        <button onClick={onToggleSidebar} className="mr-3 text-muted-foreground hover:text-foreground">
          <Menu size={18} />
        </button>
        <span className="font-semibold text-sm tracking-tight mr-auto">
          <span className="text-primary">[{titleLetter}]</span> {title}
        </span>

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-muted-foreground text-xs hover:text-foreground mr-4"
        >
          <Search size={14} />
          <span>Search...</span>
          <kbd className="ml-2 text-[10px] bg-background px-1.5 py-0.5 rounded">&#8984;K</kbd>
        </button>

        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="bg-secondary text-foreground text-xs px-2 py-1.5 rounded-md border-0 mr-3 outline-none"
        >
          <option value="main">main</option>
          <option value="shared">shared</option>
        </select>

        <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
          <Settings size={18} />
        </button>
      </header>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
