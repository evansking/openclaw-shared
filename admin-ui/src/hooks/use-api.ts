import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { api, AppConfigResponse } from "../lib/api";
import { AgentContext } from "../App";

export function useAppConfig() {
  return useQuery<AppConfigResponse>({
    queryKey: ["app-config"],
    queryFn: api.getAppConfig,
    staleTime: Infinity, // Config rarely changes, no need to refetch
  });
}

export function useWorkspaceFiles() {
  const { agent } = useContext(AgentContext);
  return useQuery({ queryKey: ["workspace", agent], queryFn: () => api.getWorkspaceFiles(agent) });
}
export function useWorkspaceFile(name: string | undefined) {
  const { agent } = useContext(AgentContext);
  return useQuery({
    queryKey: ["workspace", agent, name],
    queryFn: () => api.getWorkspaceFile(name!, agent),
    enabled: !!name,
  });
}
export function useSaveWorkspaceFile() {
  const { agent } = useContext(AgentContext);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      api.saveWorkspaceFile(name, content, agent),
    onSuccess: (_, { name }) => {
      qc.invalidateQueries({ queryKey: ["workspace", agent, name] });
      qc.invalidateQueries({ queryKey: ["workspace", agent] });
    },
  });
}

export function useMemoryFiles() {
  const { agent } = useContext(AgentContext);
  return useQuery({ queryKey: ["memory", agent], queryFn: () => api.getMemoryFiles(agent) });
}
export function useMemoryFile(name: string | undefined) {
  const { agent } = useContext(AgentContext);
  return useQuery({
    queryKey: ["memory", agent, name],
    queryFn: () => api.getMemoryFile(name!, agent),
    enabled: !!name,
  });
}
export function useSaveMemoryFile() {
  const { agent } = useContext(AgentContext);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      api.saveMemoryFile(name, content, agent),
    onSuccess: (_, { name }) => {
      qc.invalidateQueries({ queryKey: ["memory", agent, name] });
      qc.invalidateQueries({ queryKey: ["memory", agent] });
    },
  });
}

export function useStories() {
  const { agent } = useContext(AgentContext);
  return useQuery({ queryKey: ["stories", agent], queryFn: () => api.getStories(agent) });
}
export function useStory(name: string | undefined) {
  const { agent } = useContext(AgentContext);
  return useQuery({
    queryKey: ["stories", agent, name],
    queryFn: () => api.getStory(name!, agent),
    enabled: !!name,
  });
}
export function useSaveStory() {
  const { agent } = useContext(AgentContext);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      api.saveStory(name, content, agent),
    onSuccess: (_, { name }) => {
      qc.invalidateQueries({ queryKey: ["stories", agent, name] });
      qc.invalidateQueries({ queryKey: ["stories", agent] });
    },
  });
}

export function useFriends() {
  const { agent } = useContext(AgentContext);
  return useQuery({ queryKey: ["friends", agent], queryFn: () => api.getFriends(agent) });
}
export function useFriendFile(slug: string | undefined, file: string) {
  const { agent } = useContext(AgentContext);
  return useQuery({
    queryKey: ["friends", agent, slug, file],
    queryFn: () => api.getFriendFile(slug!, file, agent),
    enabled: !!slug,
  });
}
export function useSaveFriendFile() {
  const { agent } = useContext(AgentContext);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, file, content }: { slug: string; file: string; content: string }) =>
      api.saveFriendFile(slug, file, content, agent),
    onSuccess: (_, { slug, file }) => {
      qc.invalidateQueries({ queryKey: ["friends", agent, slug, file] });
    },
  });
}
export function useDeleteFriend() {
  const { agent } = useContext(AgentContext);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.deleteFriend(slug, agent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends", agent] });
    },
  });
}

export function useCronJobs() {
  return useQuery({ queryKey: ["cron"], queryFn: api.getCronJobs });
}
export function useUpdateCronJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCronJob(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron"] }),
  });
}
export function useCreateCronJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createCronJob(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron"] }),
  });
}
export function useDeleteCronJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCronJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron"] }),
  });
}
export function useRunCronJob() {
  return useMutation({ mutationFn: (id: string) => api.runCronJob(id) });
}

export function useCronJobRuns(jobId: string | null) {
  return useQuery({
    queryKey: ["cron-runs", jobId],
    queryFn: () => api.getCronJobRuns(jobId!),
    enabled: !!jobId,
  });
}

export function useCronScheduleMap() {
  return useQuery({
    queryKey: ["cron-schedule-map"],
    queryFn: api.getCronScheduleMap,
    refetchInterval: 60000,
  });
}

export function useCronNextUp() {
  return useQuery({
    queryKey: ["cron-next-up"],
    queryFn: () => api.getCronNextUp(),
    refetchInterval: 30000,
  });
}

export function useTools() {
  return useQuery({ queryKey: ["tools"], queryFn: api.getTools });
}
export function useTool(name: string | null) {
  return useQuery({
    queryKey: ["tools", name],
    queryFn: () => api.getTool(name!),
    enabled: !!name,
  });
}
export function useSaveTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      api.saveTool(name, content),
    onSuccess: (_, { name }) => {
      qc.invalidateQueries({ queryKey: ["tools", name] });
      qc.invalidateQueries({ queryKey: ["tools"] });
    },
  });
}

export function useSkills() {
  const { agent } = useContext(AgentContext);
  return useQuery({ queryKey: ["skills", agent], queryFn: () => api.getSkills(agent) });
}
export function useSkill(name: string | undefined) {
  const { agent } = useContext(AgentContext);
  return useQuery({
    queryKey: ["skills", agent, name],
    queryFn: () => api.getSkill(name!, agent),
    enabled: !!name,
  });
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: api.getSettings });
}
export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.saveSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useTextProcessorDecisions() {
  return useQuery({
    queryKey: ["text-processor-decisions"],
    queryFn: api.getTextProcessorDecisions,
    refetchInterval: 15000,
  });
}
export function useTextProcessorWatchedChats() {
  return useQuery({
    queryKey: ["text-processor-watched-chats"],
    queryFn: api.getTextProcessorWatchedChats,
    refetchInterval: 15000,
  });
}
export function useExpireWatchedChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: number) => api.expireWatchedChat(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["text-processor-watched-chats"] });
    },
  });
}
export function useTextProcessorStats() {
  return useQuery({
    queryKey: ["text-processor-stats"],
    queryFn: api.getTextProcessorStats,
    refetchInterval: 15000,
  });
}

// Gateway
export function useGatewayStats() {
  return useQuery({
    queryKey: ["gateway-stats"],
    queryFn: api.getGatewayStats,
    refetchInterval: 15000,
  });
}
export function useGatewaySessions() {
  return useQuery({
    queryKey: ["gateway-sessions"],
    queryFn: api.getGatewaySessions,
    refetchInterval: 30000,
  });
}
export function useGatewayActivity(limit = 100) {
  return useQuery({
    queryKey: ["gateway-activity", limit],
    queryFn: () => api.getGatewayActivity(limit),
    refetchInterval: 15000,
  });
}
export function useGatewayErrors(limit = 50) {
  return useQuery({
    queryKey: ["gateway-errors", limit],
    queryFn: () => api.getGatewayErrors(limit),
    refetchInterval: 15000,
  });
}
export function useSessionMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-messages", sessionId],
    queryFn: () => api.getSessionMessages(sessionId!),
    enabled: !!sessionId,
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: api.getServices,
    refetchInterval: 10000,
  });
}

export function useBlogArticles() {
  return useQuery({ queryKey: ["blog-articles"], queryFn: api.getBlogArticles });
}
export function useBlogFeeds() {
  return useQuery({ queryKey: ["blog-feeds"], queryFn: api.getBlogFeeds });
}
export function useBlogStatus() {
  return useQuery({
    queryKey: ["blog-status"],
    queryFn: api.getBlogStatus,
    refetchInterval: 30000,
  });
}
export function useCheckBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.checkBlog(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-articles"] });
      qc.invalidateQueries({ queryKey: ["blog-feeds"] });
      qc.invalidateQueries({ queryKey: ["blog-status"] });
    },
  });
}
export function useLinkedinDraft(articleId: string | null) {
  return useQuery({
    queryKey: ["linkedin-draft", articleId],
    queryFn: () => api.getLinkedinDraft(articleId!),
    enabled: !!articleId,
  });
}
export function useSendToKindle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.sendToKindle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-articles"] });
    },
  });
}

// Watchdog
export function useWatchdogState() {
  return useQuery({
    queryKey: ["watchdog-state"],
    queryFn: api.getWatchdogState,
    refetchInterval: 10000,
  });
}
export function useWatchdogLogs(limit = 100) {
  return useQuery({
    queryKey: ["watchdog-logs", limit],
    queryFn: () => api.getWatchdogLogs(limit),
    refetchInterval: 5000,
  });
}
export function useWatchdogRuns(limit = 50) {
  return useQuery({
    queryKey: ["watchdog-runs", limit],
    queryFn: () => api.getWatchdogRuns(limit),
    refetchInterval: 5000,
  });
}
export function useWatchdogStats() {
  return useQuery({
    queryKey: ["watchdog-stats"],
    queryFn: api.getWatchdogStats,
    refetchInterval: 10000,
  });
}
