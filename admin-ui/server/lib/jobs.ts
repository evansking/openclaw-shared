import fs from "fs/promises";
import { JOBS_FILE } from "./paths.js";

interface JobsFile {
  version: number;
  jobs: any[];
}

async function readRaw(): Promise<JobsFile> {
  const raw = await fs.readFile(JOBS_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function readJobs(): Promise<any[]> {
  const data = await readRaw();
  return data.jobs ?? [];
}

export async function writeJobs(jobs: any[]): Promise<void> {
  const data = await readRaw();
  // Create backup
  const existing = await fs.readFile(JOBS_FILE, "utf-8");
  await fs.writeFile(JOBS_FILE + ".bak", existing, "utf-8");
  // Write with preserved version
  data.jobs = jobs;
  const json = JSON.stringify(data, null, 2) + "\n";
  await fs.writeFile(JOBS_FILE, json, "utf-8");
  // Verify written file is valid JSON
  const verify = await fs.readFile(JOBS_FILE, "utf-8");
  JSON.parse(verify);
}
