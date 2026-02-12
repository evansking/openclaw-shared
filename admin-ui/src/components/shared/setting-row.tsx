interface Props {
  label: string;
  description: string;
  children: React.ReactNode;
}

export function SettingRow({ label, description, children }: Props) {
  return (
    <div className="flex items-start justify-between py-3 border-b last:border-0">
      <div className="mr-4">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
