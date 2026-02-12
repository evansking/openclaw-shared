import fs from "fs/promises";
import { CONFIG_FILE } from "./paths.js";

export async function readConfig(): Promise<any> {
  const raw = await fs.readFile(CONFIG_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function writeConfig(config: any): Promise<void> {
  // Create backup
  const existing = await fs.readFile(CONFIG_FILE, "utf-8");
  await fs.writeFile(CONFIG_FILE + ".bak", existing, "utf-8");
  // Write new config
  const json = JSON.stringify(config, null, 2) + "\n";
  await fs.writeFile(CONFIG_FILE, json, "utf-8");
  // Verify written file is valid JSON
  const verify = await fs.readFile(CONFIG_FILE, "utf-8");
  JSON.parse(verify); // throws if invalid
}
