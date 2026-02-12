import { useWorkspaceFiles, useFriends, useCronJobs, useServices } from "../hooks/use-api";
import { useContext } from "react";
import { AgentContext } from "../App";

export function Dashboard() {
  const { agent } = useContext(AgentContext);
  const { data: files } = useWorkspaceFiles();
  const { data: friends } = useFriends();
  const { data: allJobs } = useCronJobs();
  const { data: services } = useServices();
  const jobs = allJobs?.filter((j: any) => j.agentId === agent);

  const stats = [
    { label: "Workspace Files", value: files?.length ?? "-" },
    { label: "Friends", value: friends?.length ?? "-" },
    { label: "Cron Jobs", value: jobs?.length ?? "-" },
    { label: "Active Jobs", value: jobs?.filter((j: any) => j.enabled).length ?? "-" },
    { label: "Services Running", value: services?.filter((s: any) => s.running).length ?? "-" },
  ];

  return (
    <div className="pt-6">
      <h1 className="text-lg font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
