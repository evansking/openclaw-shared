import { Routes, Route } from "react-router-dom";
import { useState, createContext, Component, ReactNode } from "react";
import { TopBar } from "./components/layout/top-bar";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-red-400">
          <h1 className="text-xl font-bold mb-4">React Error</h1>
          <pre className="bg-zinc-900 p-4 rounded overflow-auto text-sm">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Sidebar } from "./components/layout/sidebar";
import { Dashboard } from "./pages/dashboard";
import { FileEditor } from "./pages/workspace/file-editor";
import { FriendsIndex } from "./pages/friends/index";
import { FriendDetail } from "./pages/friends/friend-detail";
import { CronIndex } from "./pages/cron/index";
import { ToolsIndex } from "./pages/tools/index";
import { SkillsIndex } from "./pages/skills/index";
import { SettingsIndex } from "./pages/settings/index";
import { BlogWatcherIndex } from "./pages/blog-watcher/index";
import { TextProcessorIndex } from "./pages/text-processor/index";
import { ActiveChatsIndex } from "./pages/active-chats/index";
import { GatewayIndex } from "./pages/gateway/index";
import { MemoryEditor } from "./pages/memory/memory-editor";
import { StoryEditor } from "./pages/stories/story-editor";
import { WatchdogIndex } from "./pages/watchdog/index";

export const AgentContext = createContext<{
  agent: string;
  setAgent: (a: string) => void;
}>({ agent: "main", setAgent: () => {} });

export default function App() {
  const [agent, setAgent] = useState("main");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AgentContext.Provider value={{ agent, setAgent }}>
      <div className="flex flex-col h-screen">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          {sidebarOpen && <Sidebar />}
          <main className="flex-1 overflow-auto px-6 pb-6">
            <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workspace/:filename" element={<FileEditor />} />
              <Route path="/memory/:filename" element={<MemoryEditor />} />
              <Route path="/stories/:filename" element={<StoryEditor />} />
              <Route path="/friends" element={<FriendsIndex />} />
              <Route path="/friends/:slug" element={<FriendDetail />} />
              <Route path="/cron" element={<CronIndex />} />
              <Route path="/tools" element={<ToolsIndex />} />
              <Route path="/skills" element={<SkillsIndex />} />
              <Route path="/blog-watcher" element={<BlogWatcherIndex />} />
              <Route path="/active-chats" element={<ActiveChatsIndex />} />
              <Route path="/text-processor" element={<TextProcessorIndex />} />
              <Route path="/gateway" element={<GatewayIndex />} />
              <Route path="/watchdog" element={<WatchdogIndex />} />
              <Route path="/settings" element={<SettingsIndex />} />
            </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </AgentContext.Provider>
  );
}
