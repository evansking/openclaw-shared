export function ServiceIndicator({ label, running }: { label: string; running: boolean }) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full ${running ? "bg-green-500" : "bg-red-500"}`} />
      <span>{label}</span>
    </div>
  );
}
