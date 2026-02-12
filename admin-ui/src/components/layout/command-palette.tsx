import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { useWorkspaceFiles, useFriends, useCronJobs, useSkills } from "../../hooks/use-api";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { data: files } = useWorkspaceFiles();
  const { data: friends } = useFriends();
  const { data: jobs } = useCronJobs();
  const { data: skills } = useSkills();

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => onOpenChange(false)}>
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-[560px] bg-[hsl(0,0%,10%)] border rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Command className="flex flex-col">
          <Command.Input
            placeholder="Jump to..."
            className="w-full px-4 py-3 bg-transparent border-b text-sm outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <Command.List className="max-h-[300px] overflow-auto p-2">
            <Command.Empty className="p-4 text-sm text-muted-foreground text-center">No results.</Command.Empty>

            <Command.Group heading="Workspace" className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {files?.map((f: any) => (
                <Command.Item key={f.filename} onSelect={() => go(`/workspace/${f.filename}`)} className="px-3 py-2 text-sm rounded cursor-pointer data-[selected=true]:bg-accent">
                  {f.filename}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Friends" className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {friends?.map((f: any) => (
                <Command.Item key={f.slug} onSelect={() => go(`/friends/${f.slug}`)} className="px-3 py-2 text-sm rounded cursor-pointer data-[selected=true]:bg-accent">
                  {f.name}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Cron Jobs" className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {jobs?.map((j: any) => (
                <Command.Item key={j.id} onSelect={() => go("/cron")} className="px-3 py-2 text-sm rounded cursor-pointer data-[selected=true]:bg-accent">
                  {j.name}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Skills" className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {skills?.map((s: any) => (
                <Command.Item key={s.name} onSelect={() => go("/skills")} className="px-3 py-2 text-sm rounded cursor-pointer data-[selected=true]:bg-accent">
                  {s.name}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <Command.Item onSelect={() => go("/cron")} className="px-3 py-2 text-sm rounded cursor-pointer data-[selected=true]:bg-accent">Cron Jobs</Command.Item>
              <Command.Item onSelect={() => go("/tools")} className="px-3 py-2 text-sm rounded cursor-pointer data-[selected=true]:bg-accent">Tools</Command.Item>
              <Command.Item onSelect={() => go("/skills")} className="px-3 py-2 text-sm rounded cursor-pointer data-[selected=true]:bg-accent">Skills</Command.Item>
              <Command.Item onSelect={() => go("/settings")} className="px-3 py-2 text-sm rounded cursor-pointer data-[selected=true]:bg-accent">Settings</Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
