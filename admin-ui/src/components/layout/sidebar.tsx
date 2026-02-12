import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FolderOpen, Users, Clock, Wrench, Sparkles, Settings, Server, Rss, MessageSquare, MessageCircle, Radio, Brain, BookOpen, Eye } from "lucide-react";
import { NavSection } from "./nav-section";
import { ServiceIndicator } from "./service-indicator";
import { useWorkspaceFiles, useMemoryFiles, useStories, useFriends, useCronJobs, useTools, useSkills, useServices, useAppConfig } from "../../hooks/use-api";
import { AgentContext } from "../../App";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { agent } = useContext(AgentContext);
  const { data: appConfig } = useAppConfig();
  const { data: files } = useWorkspaceFiles();
  const { data: memoryFiles } = useMemoryFiles();
  const { data: stories } = useStories();
  const { data: friends } = useFriends();
  const { data: allJobs } = useCronJobs();
  const { data: tools } = useTools();
  const { data: skills } = useSkills();
  const { data: services } = useServices();
  const [friendFilter, setFriendFilter] = useState("");
  const jobs = allJobs?.filter((j: any) => j.agentId === agent);

  const filteredFriends = friends?.filter((f: any) =>
    f.name.toLowerCase().includes(friendFilter.toLowerCase())
  );

  const item = (active: boolean) =>
    `w-full text-left py-1 text-sm hover:bg-accent rounded-sm px-2 ${
      active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
    }`;

  const features = appConfig?.features;

  return (
    <aside className="w-60 border-r bg-[hsl(0,0%,8%)] overflow-y-auto shrink-0 flex flex-col">
      <div className="flex-1 py-2">
        <NavSection title="GATEWAY" icon={<Radio size={14} />} active={location.pathname === "/gateway"} onClickTitle={() => navigate("/gateway")} />

        <NavSection title="WORKSPACE" icon={<FolderOpen size={14} />}>
          {files?.map((f: any) => (
            <button
              key={f.filename}
              onClick={() => navigate(`/workspace/${f.filename}`)}
              className={`${item(location.pathname === `/workspace/${f.filename}`)} flex justify-between`}
            >
              <span className="truncate">{f.filename}</span>
              <span className="text-[11px] text-muted-foreground ml-2 shrink-0">{f.lines}L</span>
            </button>
          ))}
        </NavSection>

        <NavSection title="MEMORY" icon={<Brain size={14} />} count={memoryFiles?.length}>
          {memoryFiles?.map((f: any) => (
            <button
              key={f.filename}
              onClick={() => navigate(`/memory/${f.filename}`)}
              className={`${item(location.pathname === `/memory/${f.filename}`)} flex justify-between`}
            >
              <span className="truncate">{f.date}</span>
              {f.size > 0 && (
                <span className="text-[11px] text-muted-foreground ml-2 shrink-0">{f.lines}L</span>
              )}
            </button>
          ))}
        </NavSection>

        {(features?.stories ?? true) && (
          <NavSection title="STORIES" icon={<BookOpen size={14} />} count={stories?.length}>
            {stories?.map((f: any) => (
              <button
                key={f.filename}
                onClick={() => navigate(`/stories/${f.filename}`)}
                className={`${item(location.pathname === `/stories/${f.filename}`)} flex justify-between`}
              >
                <span className="truncate">{f.filename.replace(".md", "")}</span>
                <span className="text-[11px] text-muted-foreground ml-2 shrink-0">{f.lines}L</span>
              </button>
            ))}
          </NavSection>
        )}

        {(features?.friends ?? true) && (
          <NavSection title="FRIENDS" icon={<Users size={14} />} count={friends?.length}>
            <div className="pb-1">
              <input
                type="text"
                placeholder="filter..."
                value={friendFilter}
                onChange={(e) => setFriendFilter(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-secondary rounded border-0 outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {filteredFriends?.map((f: any) => (
              <button
                key={f.slug}
                onClick={() => navigate(`/friends/${f.slug}`)}
                className={`${item(location.pathname === `/friends/${f.slug}`)} truncate`}
              >
                {f.name}
              </button>
            ))}
          </NavSection>
        )}

        <NavSection title="CRON JOBS" icon={<Clock size={14} />} count={jobs?.length} active={location.pathname === "/cron"} onClickTitle={() => navigate("/cron")} />

        <NavSection title="TOOLS" icon={<Wrench size={14} />} count={tools?.length} active={location.pathname === "/tools"} onClickTitle={() => navigate("/tools")} />

        <NavSection title="SKILLS" icon={<Sparkles size={14} />} count={skills?.length} active={location.pathname === "/skills"} onClickTitle={() => navigate("/skills")} />

        {features?.active_chats && (
          <NavSection title="ACTIVE CHATS" icon={<MessageCircle size={14} />} active={location.pathname === "/active-chats"} onClickTitle={() => navigate("/active-chats")} />
        )}

        {features?.text_processor && (
          <NavSection title="TEXT CLASSIFICATION" icon={<MessageSquare size={14} />} active={location.pathname === "/text-processor"} onClickTitle={() => navigate("/text-processor")} />
        )}

        {features?.blog_watcher && (
          <NavSection title="BLOG WATCHER" icon={<Rss size={14} />} active={location.pathname === "/blog-watcher"} onClickTitle={() => navigate("/blog-watcher")} />
        )}

        {features?.watchdog && (
          <NavSection title="MESSAGE WATCHDOG" icon={<Eye size={14} />} active={location.pathname === "/watchdog"} onClickTitle={() => navigate("/watchdog")} />
        )}

        <NavSection title="SETTINGS" icon={<Settings size={14} />}>
          {[
            "iMessage Channel",
            "Agent Defaults",
            "Heartbeat",
            "Streaming & Output",
            "Message Handling",
            "Session Management",
            "Context & Compaction",
            "Web Search & Fetch",
            "Commands",
            "Browser",
            "Gateway",
            "Cron System",
            "Skills",
            "Plugins",
            "Logging",
            "UI & Identity",
            "Updates",
          ].map((section) => (
            <button
              key={section}
              onClick={() => navigate(`/settings#${section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)}
              className={`${item(false)} truncate`}
            >
              {section}
            </button>
          ))}
        </NavSection>
      </div>

      <div className="border-t p-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase text-muted-foreground tracking-wider mb-2">
          <Server size={14} className="opacity-70" />
          <span>Services</span>
        </div>
        {services?.map((s: any) => (
          <ServiceIndicator key={s.name} label={s.label} running={s.running} />
        ))}
      </div>
    </aside>
  );
}
