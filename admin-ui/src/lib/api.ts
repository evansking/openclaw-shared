const BASE = "/api";

export interface AppFeatures {
  text_processor: boolean;
  blog_watcher: boolean;
  active_chats: boolean;
  friends: boolean;
  stories: boolean;
  linkedin_drafts: boolean;
  watchdog: boolean;
}

export interface AppConfigResponse {
  features: AppFeatures;
  user_name: string;
  app_title: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  // App Config
  getAppConfig: () => request<AppConfigResponse>("/app-config"),

  // Workspace
  getWorkspaceFiles: (agent: string) => request<any[]>(`/workspace?agent=${agent}`),
  getWorkspaceFile: (name: string, agent: string) => request<any>(`/workspace/${name}?agent=${agent}`),
  saveWorkspaceFile: (name: string, content: string, agent: string) =>
    request(`/workspace/${name}?agent=${agent}`, { method: "PUT", body: JSON.stringify({ content }) }),

  // Memory
  getMemoryFiles: (agent: string) => request<any[]>(`/memory?agent=${agent}`),
  getMemoryFile: (name: string, agent: string) => request<any>(`/memory/${name}?agent=${agent}`),
  saveMemoryFile: (name: string, content: string, agent: string) =>
    request(`/memory/${name}?agent=${agent}`, { method: "PUT", body: JSON.stringify({ content }) }),

  // Stories
  getStories: (agent: string) => request<any[]>(`/stories?agent=${agent}`),
  getStory: (name: string, agent: string) => request<any>(`/stories/${name}?agent=${agent}`),
  saveStory: (name: string, content: string, agent: string) =>
    request(`/stories/${name}?agent=${agent}`, { method: "PUT", body: JSON.stringify({ content }) }),

  // Friends
  getFriends: (agent: string) => request<any[]>(`/friends?agent=${agent}`),
  getFriendFile: (slug: string, file: string, agent: string) => request<any>(`/friends/${slug}/${file}?agent=${agent}`),
  saveFriendFile: (slug: string, file: string, content: string, agent: string) =>
    request(`/friends/${slug}/${file}?agent=${agent}`, { method: "PUT", body: JSON.stringify({ content }) }),
  deleteFriend: (slug: string, agent: string) =>
    request(`/friends/${slug}?agent=${agent}`, { method: "DELETE" }),

  // Cron
  getCronJobs: () => request<any[]>("/cron/jobs"),
  getCronJob: (id: string) => request<any>(`/cron/jobs/${id}`),
  updateCronJob: (id: string, data: any) =>
    request(`/cron/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  createCronJob: (data: any) =>
    request("/cron/jobs", { method: "POST", body: JSON.stringify(data) }),
  deleteCronJob: (id: string) =>
    request(`/cron/jobs/${id}`, { method: "DELETE" }),
  runCronJob: (id: string) =>
    request(`/cron/jobs/${id}/run`, { method: "POST" }),
  getCronJobRuns: (id: string, limit = 20) =>
    request<any[]>(`/cron/jobs/${id}/runs?limit=${limit}`),
  getCronScheduleMap: () => request<any>("/cron/schedule-map"),
  getCronNextUp: (limit = 10) => request<any[]>(`/cron/next-up?limit=${limit}`),

  // Tools
  getTools: () => request<any[]>("/tools"),
  getTool: (name: string) => request<any>(`/tools/${name}`),
  saveTool: (name: string, content: string) =>
    request(`/tools/${name}`, { method: "PUT", body: JSON.stringify({ content }) }),
  runTool: (name: string) => request(`/tools/${name}/run`, { method: "POST" }),

  // Skills
  getSkills: (agent: string) => request<any[]>(`/skills?agent=${agent}`),
  getSkill: (name: string, agent: string) => request<any>(`/skills/${name}?agent=${agent}`),
  saveSkill: (name: string, content: string, agent: string) =>
    request(`/skills/${name}?agent=${agent}`, { method: "PUT", body: JSON.stringify({ content }) }),

  // Settings
  getSettings: () => request<any>("/settings"),
  saveSettings: (data: any) =>
    request("/settings", { method: "PUT", body: JSON.stringify(data) }),

  // Blog Watcher
  getBlogArticles: () => request<any[]>("/blog-watcher/articles"),
  getBlogFeeds: () => request<any[]>("/blog-watcher/feeds"),
  getBlogStatus: () => request<any>("/blog-watcher/status"),
  checkBlog: () => request("/blog-watcher/check", { method: "POST" }),
  sendToKindle: (id: string) => request(`/blog-watcher/articles/${id}/send-to-kindle`, { method: "POST" }),
  getLinkedinDraft: (id: string) => request<{ filename: string; content: string }>(`/blog-watcher/articles/${id}/linkedin-draft`),

  // Text Processor
  getTextProcessorDecisions: () => request<any[]>("/text-processor/decisions"),
  getTextProcessorWatchedChats: () => request<any[]>("/text-processor/watched-chats"),
  getTextProcessorStats: () => request<any>("/text-processor/stats"),
  expireWatchedChat: (chatId: number) =>
    request(`/text-processor/watched-chats/${chatId}`, { method: "DELETE" }),

  // Gateway
  getGatewayStats: () => request<any>("/gateway/stats"),
  getGatewaySessions: () => request<any[]>("/gateway/sessions"),
  getGatewayActivity: (limit = 100) => request<any[]>(`/gateway/activity?limit=${limit}`),
  getGatewayErrors: (limit = 50) => request<any[]>(`/gateway/errors?limit=${limit}`),
  getSessionMessages: (id: string, limit = 50) =>
    request<any[]>(`/gateway/session/${id}/messages?limit=${limit}`),

  // Services
  getServices: () => request<any[]>("/services"),
  serviceAction: (name: string, action: string) =>
    request(`/services/${name}/${action}`, { method: "POST" }),

  // Watchdog
  getWatchdogState: () => request<any>("/watchdog/state"),
  getWatchdogLogs: (limit = 100) => request<any[]>(`/watchdog/logs?limit=${limit}`),
  getWatchdogRuns: (limit = 50) => request<any[]>(`/watchdog/runs?limit=${limit}`),
  getWatchdogStats: () => request<any>("/watchdog/stats"),
};
