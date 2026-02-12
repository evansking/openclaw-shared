import fs from "fs";
import path from "path";
import { appConfig } from "./app-config.js";

export const OPENCLAW_DIR = appConfig.openclaw_dir;
export const JOBS_FILE = path.join(OPENCLAW_DIR, "cron/jobs.json");
export const CONFIG_FILE = path.join(OPENCLAW_DIR, "openclaw.json");
export const BIN_DIR = appConfig.bin_dir;

// Blog watcher paths (conditional on feature)
const feedwatcherDir = appConfig.blog_watcher?.feedwatcher_dir || path.join(OPENCLAW_DIR, ".feedwatcher");
export const FEEDWATCHER_DIR = feedwatcherDir;
export const ARTICLES_FILE = path.join(feedwatcherDir, "articles.json");
export const KINDLE_SENT_FILE = path.join(feedwatcherDir, "kindle-sent.json");
export const LINKEDIN_DRAFTS_FILE = path.join(feedwatcherDir, "linkedin-drafts.json");
export const FEEDS_FILE = path.join(feedwatcherDir, "feeds.json");
export const LINKEDIN_DRAFTS_DIR = path.join(appConfig.clawd_dir, "linkedin/drafts");

// Default (main) paths for backwards compat
export const CLAWD_DIR = appConfig.clawd_dir;
export const TEXT_PROCESSOR_DECISIONS_FILE = path.join(OPENCLAW_DIR, "text-processor-decisions.json");
export const WATCHED_CHATS_FILE = path.join(CLAWD_DIR, "memory/watched-chats.json");
export const WORKSPACE_DIR = CLAWD_DIR;
export const FRIENDS_DIR = path.join(CLAWD_DIR, "memory/friends");
export const SKILLS_DIR = path.join(CLAWD_DIR, "skills");

// Gateway data paths
export const GATEWAY_LOG_FILE = path.join(OPENCLAW_DIR, "logs/gateway.log");
export const GATEWAY_ERR_LOG_FILE = path.join(OPENCLAW_DIR, "logs/gateway.err.log");
export const SESSIONS_DIR_MAIN = path.join(OPENCLAW_DIR, "agents/main/sessions");
export const SESSIONS_DIR_SHARED = path.join(OPENCLAW_DIR, "agents/shared/sessions");
export const CRON_RUNS_DIR = path.join(OPENCLAW_DIR, "cron/runs");

// Resolve per-agent workspace paths from config
let _agentMap: Record<string, string> | null = null;

function loadAgentMap(): Record<string, string> {
  if (_agentMap) return _agentMap;
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const config = JSON.parse(raw);
    const list: { id: string; workspace: string }[] = config.agents?.list ?? [];
    _agentMap = {};
    for (const a of list) _agentMap[a.id] = a.workspace;
  } catch {
    _agentMap = { main: CLAWD_DIR };
  }
  return _agentMap;
}

export function getAgentPaths(agent: string) {
  const map = loadAgentMap();
  const workspace = map[agent] || map["main"] || CLAWD_DIR;
  const friendsDir = path.join(workspace, "memory/friends");
  // Some workspaces put contacts directly under memory/ instead of memory/friends/
  const hasFriendsDir = fs.existsSync(friendsDir);
  return {
    workspace,
    friends: hasFriendsDir ? friendsDir : path.join(workspace, "memory"),
    skills: path.join(workspace, "skills"),
  };
}

export const WORKSPACE_FILES = [
  "SOUL.md",
  "IDENTITY.md",
  "USER.md",
  "AGENTS.md",
  "TOOLS.md",
  "MEMORY.md",
  "DECISIONS.md",
  "HEARTBEAT.md",
];

// Services now come from app config
export const SERVICE_NAMES = appConfig.services;

// Generate labels from service names
export const SERVICE_LABELS: Record<string, string> = {};
for (const name of SERVICE_NAMES) {
  // Extract short label from service name: ai.openclaw.gateway -> gateway
  const parts = name.split(".");
  SERVICE_LABELS[name] = parts[parts.length - 1];
}
