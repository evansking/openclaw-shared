import fs from "fs";
import os from "os";
import path from "path";

const CONFIG_FILE = path.join(os.homedir(), ".config/admin-ui/config.json");

export interface AppConfig {
  openclaw_dir: string;
  bin_dir: string;
  clawd_dir: string;
  user_name: string;
  dm_context: string;
  app_title: string;
  features: {
    text_processor: boolean;
    blog_watcher: boolean;
    active_chats: boolean;
    friends: boolean;
    stories: boolean;
    linkedin_drafts: boolean;
    watchdog: boolean;
  };
  text_processor?: {
    chat_db: string;
    contacts_file: string;
  };
  blog_watcher?: {
    feedwatcher_dir: string;
  };
  services: string[];
}

function expandPath(p: string): string {
  if (p.startsWith("~/")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = source[key];
    if (sourceVal !== undefined) {
      if (
        typeof sourceVal === "object" &&
        sourceVal !== null &&
        !Array.isArray(sourceVal) &&
        typeof result[key] === "object" &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key] as any, sourceVal as any);
      } else {
        result[key] = sourceVal as T[keyof T];
      }
    }
  }
  return result;
}

export function loadConfig(): AppConfig {
  const home = os.homedir();
  const defaults: AppConfig = {
    openclaw_dir: path.join(home, ".openclaw"),
    bin_dir: path.join(home, "bin"),
    clawd_dir: path.join(home, "clawd"),
    user_name: "User",
    dm_context: "Main DM",
    app_title: "OpenClaw Admin",
    features: {
      text_processor: false,
      blog_watcher: false,
      active_chats: false,
      friends: true,
      stories: true,
      linkedin_drafts: false,
      watchdog: false,
    },
    services: ["ai.openclaw.gateway"],
  };

  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const userConfig = JSON.parse(raw);

    // Expand ~ in paths
    if (userConfig.openclaw_dir) userConfig.openclaw_dir = expandPath(userConfig.openclaw_dir);
    if (userConfig.bin_dir) userConfig.bin_dir = expandPath(userConfig.bin_dir);
    if (userConfig.clawd_dir) userConfig.clawd_dir = expandPath(userConfig.clawd_dir);
    if (userConfig.text_processor?.chat_db)
      userConfig.text_processor.chat_db = expandPath(userConfig.text_processor.chat_db);
    if (userConfig.text_processor?.contacts_file)
      userConfig.text_processor.contacts_file = expandPath(userConfig.text_processor.contacts_file);
    if (userConfig.blog_watcher?.feedwatcher_dir)
      userConfig.blog_watcher.feedwatcher_dir = expandPath(userConfig.blog_watcher.feedwatcher_dir);

    return deepMerge(defaults, userConfig);
  } catch {
    return defaults;
  }
}

export const appConfig = loadConfig();
