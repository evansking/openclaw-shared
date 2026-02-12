import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { getAgentPaths } from "../lib/paths.js";

const router = Router();

// GET /api/stories - list all .md files in memory/stories
router.get("/", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const storiesDir = path.join(workspace, "memory", "stories");
    const entries = await fs.readdir(storiesDir);
    const files = [];
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      const filePath = path.join(storiesDir, entry);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n").length;
      files.push({ filename: entry, lines, size: stat.size });
    }
    files.sort((a, b) => a.filename.localeCompare(b.filename));
    res.json(files);
  } catch (err: any) {
    if (err.code === "ENOENT") return res.json([]);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stories/:filename - read a story file
router.get("/:filename", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const storiesDir = path.join(workspace, "memory", "stories");
    const { filename } = req.params;
    if (!filename.endsWith(".md")) {
      return res.status(400).json({ error: "Only .md files are allowed" });
    }
    const resolved = path.resolve(storiesDir, filename);
    if (!resolved.startsWith(storiesDir)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    const content = await fs.readFile(resolved, "utf-8");
    const lines = content.split("\n").length;
    res.json({ filename, content, lines });
  } catch (err: any) {
    if (err.code === "ENOENT") return res.status(404).json({ error: "File not found" });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/stories/:filename - write a story file
router.put("/:filename", async (req, res) => {
  try {
    const { workspace } = getAgentPaths((req.query.agent as string) || "main");
    const storiesDir = path.join(workspace, "memory", "stories");
    const { filename } = req.params;
    const { content } = req.body;
    if (!filename.endsWith(".md")) {
      return res.status(400).json({ error: "Only .md files are allowed" });
    }
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }
    const resolved = path.resolve(storiesDir, filename);
    if (!resolved.startsWith(storiesDir)) {
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
