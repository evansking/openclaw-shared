import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { getAgentPaths } from "../lib/paths.js";

const router = Router();

// GET /api/skills - list all skill dirs with name/description from SKILL.md
router.get("/", async (req, res) => {
  try {
    const { skills: skillsDir } = getAgentPaths((req.query.agent as string) || "main");
    let entries;
    try {
      entries = await fs.readdir(skillsDir, { withFileTypes: true });
    } catch {
      return res.json([]);
    }
    const skills = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      const skillFile = path.join(skillsDir, name, "SKILL.md");
      let title = name;
      let description = "";
      try {
        const content = await fs.readFile(skillFile, "utf-8");
        if (content.startsWith("---")) {
          const endIdx = content.indexOf("---", 3);
          if (endIdx !== -1) {
            const frontmatter = content.slice(3, endIdx);
            const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
            const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
            if (nameMatch) title = nameMatch[1].trim();
            if (descMatch) description = descMatch[1].trim();
          }
        } else {
          const lines = content.split("\n");
          const firstLine = lines[0] || "";
          title = firstLine.replace(/^#+\s*/, "").trim() || name;
          for (let i = 1; i < Math.min(lines.length, 10); i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith("#")) {
              description = line;
              break;
            }
          }
        }
      } catch {
        // No SKILL.md found
      }
      let preview = "";
      try {
        const raw = await fs.readFile(skillFile, "utf-8");
        preview = raw.slice(0, 400);
      } catch {
        // no content
      }
      skills.push({ name, title, description, preview });
    }
    res.json(skills);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/skills/:name - read full SKILL.md
router.get("/:name", async (req, res) => {
  try {
    const { skills: skillsDir } = getAgentPaths((req.query.agent as string) || "main");
    const { name } = req.params;
    if (name.includes("/") || name.includes("..")) {
      return res.status(400).json({ error: "Invalid skill name" });
    }
    const skillFile = path.join(skillsDir, name, "SKILL.md");
    const resolved = path.resolve(skillFile);
    if (!resolved.startsWith(skillsDir)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    const content = await fs.readFile(resolved, "utf-8");
    const lines = content.split("\n").length;
    res.json({ name, content, lines });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "Skill not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/skills/:name - write SKILL.md
router.put("/:name", async (req, res) => {
  try {
    const { skills: skillsDir } = getAgentPaths((req.query.agent as string) || "main");
    const { name } = req.params;
    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }
    if (name.includes("/") || name.includes("..")) {
      return res.status(400).json({ error: "Invalid skill name" });
    }
    const skillFile = path.join(skillsDir, name, "SKILL.md");
    const resolved = path.resolve(skillFile);
    if (!resolved.startsWith(skillsDir)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, content, "utf-8");
    const lines = content.split("\n").length;
    res.json({ name, lines, ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
