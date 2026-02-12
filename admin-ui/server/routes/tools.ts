import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { BIN_DIR } from "../lib/paths.js";

const router = Router();

function detectLanguage(content: string, filename: string): string {
  // Check shebang first
  const shebangMatch = content.match(/^#!\s*\/.*\/(env\s+)?(\w+)/);
  if (shebangMatch) {
    const interp = shebangMatch[2];
    if (interp === "bash" || interp === "sh" || interp === "zsh") return "bash";
    if (interp === "node") return "javascript";
    if (interp === "python" || interp === "python3") return "python";
    if (interp === "ruby") return "ruby";
    if (interp === "perl") return "perl";
  }

  // Fall back to extension
  const ext = path.extname(filename).toLowerCase();
  const extMap: Record<string, string> = {
    ".sh": "bash", ".bash": "bash", ".zsh": "bash",
    ".js": "javascript", ".mjs": "javascript", ".ts": "typescript",
    ".py": "python", ".rb": "ruby", ".pl": "perl",
    ".swift": "swift", ".sql": "sql",
    ".json": "json", ".yaml": "yaml", ".yml": "yaml",
    ".md": "markdown", ".txt": "text",
  };
  return extMap[ext] || "text";
}

function extractDescription(content: string, language: string): string {
  const lines = content.split("\n");
  let start = 0;

  // Skip shebang
  if (lines[0]?.startsWith("#!")) start = 1;
  // Skip blank lines after shebang
  while (start < lines.length && lines[start].trim() === "") start++;

  if (start >= lines.length) return "";

  // Handle # comments (bash, python, ruby, yaml)
  if (["bash", "python", "ruby", "yaml", "text"].includes(language) || lines[start].startsWith("#")) {
    const commentLines: string[] = [];
    for (let i = start; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#")) {
        commentLines.push(line.replace(/^#\s?/, ""));
      } else break;
    }
    return commentLines.join(" ").trim();
  }

  // Handle -- comments (sql)
  if (language === "sql") {
    const commentLines: string[] = [];
    for (let i = start; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("--")) {
        commentLines.push(line.replace(/^--\s?/, ""));
      } else break;
    }
    return commentLines.join(" ").trim();
  }

  // Handle /** */ block comments (javascript, typescript, swift)
  if (["javascript", "typescript", "swift"].includes(language)) {
    const line = lines[start].trim();
    if (line.startsWith("/**") || line.startsWith("/*")) {
      const commentLines: string[] = [];
      for (let i = start; i < lines.length; i++) {
        const l = lines[i].trim();
        if (i === start) {
          const cleaned = l.replace(/^\/\*\*?\s?/, "").replace(/\*\/\s*$/, "").trim();
          if (cleaned) commentLines.push(cleaned);
        } else if (l.includes("*/")) {
          const cleaned = l.replace(/\*\/.*$/, "").replace(/^\*\s?/, "").trim();
          if (cleaned) commentLines.push(cleaned);
          break;
        } else {
          commentLines.push(l.replace(/^\*\s?/, ""));
        }
      }
      return commentLines.join(" ").trim();
    }
    // Also handle // comments
    if (line.startsWith("//")) {
      const commentLines: string[] = [];
      for (let i = start; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l.startsWith("//")) {
          commentLines.push(l.replace(/^\/\/\s?/, ""));
        } else break;
      }
      return commentLines.join(" ").trim();
    }
  }

  return "";
}

// GET /api/tools - list all files in BIN_DIR with stat info
router.get("/", async (_req, res) => {
  try {
    const entries = await fs.readdir(BIN_DIR);
    const tools = [];
    for (const name of entries) {
      const filePath = path.join(BIN_DIR, name);
      try {
        const stat = await fs.stat(filePath);
        let preview = "";
        if (stat.isFile() && stat.size < 50_000) {
          try {
            const raw = await fs.readFile(filePath, "utf-8");
            preview = raw.slice(0, 400);
          } catch {
            // binary or unreadable
          }
        }
        tools.push({
          name,
          size: stat.size,
          modified: stat.mtime.toISOString(),
          isExecutable: !!(stat.mode & 0o111),
          isFile: stat.isFile(),
          isDirectory: stat.isDirectory(),
          preview,
        });
      } catch {
        // Skip files we can't stat
      }
    }
    res.json(tools);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tools/:name - get full file detail
router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    if (name.includes("/") || name.includes("..")) {
      return res.status(400).json({ error: "Invalid tool name" });
    }
    const toolPath = path.join(BIN_DIR, name);
    const resolved = path.resolve(toolPath);
    if (!resolved.startsWith(BIN_DIR)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }

    try {
      await fs.stat(resolved);
    } catch {
      return res.status(404).json({ error: "Tool not found" });
    }

    let content = "";
    let isBinary = false;
    try {
      const buf = await fs.readFile(resolved);
      // Check for binary: look for null bytes in first 8KB
      const sample = buf.subarray(0, 8192);
      if (sample.includes(0)) {
        isBinary = true;
      } else {
        content = buf.toString("utf-8");
      }
    } catch {
      isBinary = true;
    }

    const language = isBinary ? "binary" : detectLanguage(content, name);
    const description = isBinary ? "" : extractDescription(content, language);
    const editable = path.extname(name).toLowerCase() === ".sql";

    res.json({ name, path: resolved, content, language, description, isBinary, editable });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tools/:name - save file content (SQL only)
router.put("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    if (name.includes("/") || name.includes("..")) {
      return res.status(400).json({ error: "Invalid tool name" });
    }
    const toolPath = path.join(BIN_DIR, name);
    const resolved = path.resolve(toolPath);
    if (!resolved.startsWith(BIN_DIR)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    if (path.extname(name).toLowerCase() !== ".sql") {
      return res.status(403).json({ error: "Only .sql files can be edited" });
    }

    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content is required" });
    }

    await fs.writeFile(resolved, content, "utf-8");
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tools/:name/run - exec the tool
router.post("/:name/run", async (req, res) => {
  try {
    const { name } = req.params;
    // Prevent path traversal
    if (name.includes("/") || name.includes("..")) {
      return res.status(400).json({ error: "Invalid tool name" });
    }
    // Verify the tool exists and is a file
    const toolPath = path.join(BIN_DIR, name);
    const resolved = path.resolve(toolPath);
    if (!resolved.startsWith(BIN_DIR)) {
      return res.status(403).json({ error: "Path traversal not allowed" });
    }
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isFile()) {
        return res.status(400).json({ error: "Not a file" });
      }
      if (!(stat.mode & 0o111)) {
        return res.status(400).json({ error: "File is not executable" });
      }
    } catch {
      return res.status(404).json({ error: "Tool not found" });
    }

    const args = req.body.args || "";
    const cmd = `${resolved} ${args}`;
    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({
          error: error.message,
          stdout,
          stderr,
        });
      }
      res.json({ ok: true, stdout, stderr });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
