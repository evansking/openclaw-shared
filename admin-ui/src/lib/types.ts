export interface WorkspaceFile {
  filename: string;
  lines: number;
}

export interface Friend {
  slug: string;
  name: string;
  files: string[];
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  timezone: string;
  enabled: boolean;
  agentId: string;
  isolated?: boolean;
  sessionTarget?: string;
  delivery?: {
    channel: string;
    recipient: string;
  };
  payload: string;
  lastRun?: string;
}

export interface Tool {
  name: string;
  size: number;
  modified: string;
  isExecutable: boolean;
  isFile: boolean;
  isDirectory: boolean;
  preview: string;
}

export interface ToolDetail {
  name: string;
  path: string;
  content: string;
  language: string;
  description: string;
  isBinary: boolean;
  editable: boolean;
}

export interface Skill {
  name: string;
  description: string;
  content?: string;
}

export interface ServiceStatus {
  name: string;
  label: string;
  pid: number | null;
  running: boolean;
}

export interface SettingsData {
  [key: string]: any;
}
