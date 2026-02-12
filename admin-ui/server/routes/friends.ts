import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { getAgentPaths } from "../lib/paths.js";

const router = Router();

// GET /api/friends - list all friends
router.get("/", async (req, res) => {
  try {
    const { friends: friendsDir } = getAgentPaths((req.query.agent as string) || "main");
    let entries;
    try {
      entries = await fs.readdir(friendsDir, { withFileTypes: true });
    } catch {
      return res.json([]);
    }
    const friends = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      const friendDir = path.join(friendsDir, slug);
      const files = await fs.readdir(friendDir);
      const mdFiles = files.filter((f) => f.endsWith(".md"));

      let name = slug;
      const indexPath = path.join(friendDir, "index.md");
      try {
        const indexContent = await fs.readFile(indexPath, "utf-8");
        const firstLine = indexContent.split("\n")[0];
        name = firstLine.replace(/^#+\s*/, "").trim() || slug;
      } catch {
        // No index.md, use slug as name
      }

      friends.push({
        slug,
        name,
        fileCount: mdFiles.length,
        files: mdFiles,
      });
    }
    res.json(friends);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/friends/:slug/:file - read a specific friend file
router.get("/:slug/:file", async (req, res) => {
  try {
    const { friends: friendsDir } = getAgentPaths((req.query.agent as string) || "main");
    const { slug, file } = req.params;
    const resolved = path.resolve(friendsDir, slug, file);
    if (!resolved.startsWith(friendsDir)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    const content = await fs.readFile(resolved, "utf-8");
    const lines = content.split("\n").length;
    res.json({ slug, file, content, lines });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/friends/:slug/:file - write a specific friend file
router.put("/:slug/:file", async (req, res) => {
  try {
    const { friends: friendsDir } = getAgentPaths((req.query.agent as string) || "main");
    const { slug, file } = req.params;
    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }
    const resolved = path.resolve(friendsDir, slug, file);
    if (!resolved.startsWith(friendsDir)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, content, "utf-8");
    const lines = content.split("\n").length;
    res.json({ slug, file, lines, ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/friends/:slug - delete a friend directory
router.delete("/:slug", async (req, res) => {
  try {
    const { friends: friendsDir } = getAgentPaths((req.query.agent as string) || "main");
    const { slug } = req.params;
    const resolved = path.resolve(friendsDir, slug);
    if (!resolved.startsWith(friendsDir)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    await fs.rm(resolved, { recursive: true });
    res.json({ ok: true });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "Friend not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
