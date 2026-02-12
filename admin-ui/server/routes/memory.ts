import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { getAgentPaths } from "../lib/paths.js";

const router = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}\.md$/;

// GET /api/memory - list daily memory files (newest first)
router.get("/", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const memoryDir = path.join(workspace, "memory");
    const entries = await fs.readdir(memoryDir);
    const files = [];
    for (const entry of entries) {
      if (!DATE_RE.test(entry)) continue;
      const filePath = path.join(memoryDir, entry);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n").length;
      const size = stat.size;
      files.push({ filename: entry, date: entry.replace(".md", ""), lines, size });
    }
    files.sort((a, b) => b.date.localeCompare(a.date));
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/memory/:filename - read a memory file
router.get("/:filename", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const memoryDir = path.join(workspace, "memory");
    const { filename } = req.params;
    if (!DATE_RE.test(filename)) {
      return res.status(400).json({ error: "Only daily memory files (YYYY-MM-DD.md) are allowed" });
    }
    const resolved = path.resolve(memoryDir, filename);
    if (!resolved.startsWith(memoryDir)) {
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

// PUT /api/memory/:filename - write a memory file
router.put("/:filename", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const memoryDir = path.join(workspace, "memory");
    const { filename } = req.params;
    const { content } = req.body;
    if (!DATE_RE.test(filename)) {
      return res.status(400).json({ error: "Only daily memory files (YYYY-MM-DD.md) are allowed" });
    }
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }
    const resolved = path.resolve(memoryDir, filename);
    if (!resolved.startsWith(memoryDir)) {
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
