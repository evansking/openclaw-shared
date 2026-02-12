import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { getAgentPaths } from "../lib/paths.js";

const router = Router();

// GET /api/workspace - list all workspace .md files with line counts
router.get("/", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const dirEntries = await fs.readdir(workspace);
    const files = [];
    for (const entry of dirEntries) {
      if (!entry.endsWith(".md")) continue;
      const filePath = path.join(workspace, entry);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n").length;
      files.push({ filename: entry, lines });
    }
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspace/:filename - read file content
router.get("/:filename", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const { filename } = req.params;
    if (!filename.endsWith(".md")) {
      return res.status(400).json({ error: "Only .md files are allowed" });
    }
    const resolved = path.resolve(workspace, filename);
    if (!resolved.startsWith(workspace)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    const content = await fs.readFile(resolved, "utf-8");
    const lines = content.split("\n").length;
    res.json({ filename, content, lines });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workspace/:filename - write file content
router.put("/:filename", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const { filename } = req.params;
    const { content } = req.body;
    if (!filename.endsWith(".md")) {
      return res.status(400).json({ error: "Only .md files are allowed" });
    }
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }
    const resolved = path.resolve(workspace, filename);
    if (!resolved.startsWith(workspace)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    await fs.writeFile(resolved, content, "utf-8");
    const lines = content.split("\n").length;
    res.json({ filename, lines, ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
