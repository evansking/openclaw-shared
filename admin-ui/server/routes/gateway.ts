import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import {
  GATEWAY_LOG_FILE,
  GATEWAY_ERR_LOG_FILE,
  SESSIONS_DIR_MAIN,
  SESSIONS_DIR_SHARED,
  JOBS_FILE,
} from "../lib/paths.js";
import { readTail } from "../lib/tail.js";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readJsonSafe<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function readSessionsIndex(
  dir: string
): Promise<Record<string, any>> {
  return readJsonSafe(path.join(dir, "sessions.json"), {});
}

function todayPrefix(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Parse a structured gateway log line. Returns null for raw text dumps. */
function parseLogLine(line: string): {
  timestamp: string;
  subsystem: string;
  message: string;
  category: string;
} | null {
  // Format: 2026-02-03T05:57:42.855Z [subsystem] message
  // or:     2026-02-03T05:57:42.855Z message (no subsystem)
  const m = line.match(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)$/
  );
  if (!m) return null;
  const timestamp = m[1];
  let rest = m[2];
  let subsystem = "";

  const bracketMatch = rest.match(/^\[([^\]]+)\]\s*(.*)/);
  if (bracketMatch) {
    subsystem = bracketMatch[1];
    rest = bracketMatch[2];
  }

  // Skip lines that look like raw agent text (no subsystem and very long or multi-paragraph)
  if (!subsystem && rest.length > 500) return null;

  // Classify
  let category = "system";
  const lower = rest.toLowerCase();
  if (
    subsystem === "imessage" ||
    lower.includes("delivered") ||
    lower.includes("sent")
  )
    category = "delivery";
  else if (
    subsystem === "browser" ||
    lower.includes("chrome") ||
    lower.includes("browser")
  )
    category = "browser";
  else if (lower.includes("auth") || lower.includes("token"))
    category = "auth";

  return { timestamp, subsystem, message: rest, category };
}

/** Determine session type from session key. */
function sessionType(key: string): string {
  if (key.includes(":cron:")) return "cron";
  if (key.includes(":subagent:")) return "subagent";
  if (key.includes(":group:")) return "group";
  return "direct";
}

/** Extract agent name from session key (agent:{agentId}:{rest}). */
function sessionAgent(key: string): string {
  const parts = key.split(":");
  return parts[1] || "main";
}

// ---------------------------------------------------------------------------
// GET /api/gateway/stats
// ---------------------------------------------------------------------------

router.get("/stats", async (_req, res) => {
  try {
    const [mainSessions, sharedSessions] = await Promise.all([
      readSessionsIndex(SESSIONS_DIR_MAIN),
      readSessionsIndex(SESSIONS_DIR_SHARED),
    ]);

    const allSessions = { ...mainSessions, ...sharedSessions };
    const totalSessions = Object.keys(allSessions).length;
    let totalTokens = 0;
    let model = "";
    for (const s of Object.values(allSessions)) {
      totalTokens += s.totalTokens || 0;
      if (!model && s.model) model = s.model;
    }

    // Count deliveries today from gateway.log
    const today = todayPrefix();
    const logTail = await readTail(GATEWAY_LOG_FILE, 200_000);
    let deliveriesToday = 0;
    for (const line of logTail.split("\n")) {
      if (line.startsWith(today) && line.includes("delivered")) {
        deliveriesToday++;
      }
    }

    // Count errors today from error log
    const errTail = await readTail(GATEWAY_ERR_LOG_FILE, 100_000);
    let errorsToday = 0;
    for (const line of errTail.split("\n")) {
      if (line.startsWith(today) && line.trim().length > 0) {
        errorsToday++;
      }
    }

    res.json({
      totalSessions,
      totalTokens,
      formattedTokens: formatTokens(totalTokens),
      deliveriesToday,
      errorsToday,
      model,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/gateway/sessions
// ---------------------------------------------------------------------------

router.get("/sessions", async (_req, res) => {
  try {
    const [mainSessions, sharedSessions, jobsData] = await Promise.all([
      readSessionsIndex(SESSIONS_DIR_MAIN),
      readSessionsIndex(SESSIONS_DIR_SHARED),
      readJsonSafe<{ jobs?: any[] }>(JOBS_FILE, { jobs: [] }),
    ]);

    const jobs = jobsData.jobs || [];
    const jobNameMap: Record<string, string> = {};
    for (const j of jobs) jobNameMap[j.id] = j.name;

    const allSessions = { ...mainSessions, ...sharedSessions };
    const result = [];

    for (const [key, session] of Object.entries(allSessions) as [
      string,
      any,
    ][]) {
      // Strip skillsSnapshot — it's huge
      const { skillsSnapshot, ...rest } = session;

      const type = sessionType(key);
      const agent = sessionAgent(key);
      const contextTokens = rest.contextTokens || 200000;
      const totalTok = rest.totalTokens || 0;
      const percentUsed = contextTokens
        ? Math.round((totalTok / contextTokens) * 100)
        : 0;

      // Derive friendly name
      let friendlyName = "";
      if (type === "cron") {
        // Key format: agent:main:cron:{jobUUID}:{sessionUUID}
        const parts = key.split(":");
        const jobId = parts[3] || "";
        friendlyName = jobNameMap[jobId] || jobId.slice(0, 8);
      } else if (type === "group") {
        const to = rest.deliveryContext?.to || rest.lastTo || "";
        friendlyName = to.replace(/^imessage:/, "") || "Group";
      } else {
        const to = rest.deliveryContext?.to || rest.lastTo || "";
        friendlyName = to.replace(/^imessage:/, "") || rest.sessionId?.slice(0, 8) || "";
      }

      result.push({
        key,
        sessionId: rest.sessionId,
        agent,
        type,
        totalTokens: totalTok,
        contextTokens,
        percentUsed,
        friendlyName,
        updatedAt: rest.updatedAt,
        model: rest.model || "",
        abortedLastRun: rest.abortedLastRun || false,
      });
    }

    // Sort by updatedAt descending
    result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/gateway/activity?limit=100
// ---------------------------------------------------------------------------

router.get("/activity", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const logTail = await readTail(GATEWAY_LOG_FILE, 200_000);
    const lines = logTail.split("\n");
    const events = [];

    // Process from end to get newest first
    for (let i = lines.length - 1; i >= 0 && events.length < limit; i--) {
      const parsed = parseLogLine(lines[i]);
      if (parsed) events.push(parsed);
    }

    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/gateway/errors?limit=50
// ---------------------------------------------------------------------------

router.get("/errors", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const errTail = await readTail(GATEWAY_ERR_LOG_FILE, 100_000);
    const lines = errTail.split("\n").filter((l) => l.trim().length > 0);

    // Parse and deduplicate adjacent identical messages
    const errors: {
      timestamp: string;
      subsystem: string;
      message: string;
      count: number;
    }[] = [];

    for (let i = lines.length - 1; i >= 0 && errors.length < limit; i--) {
      const line = lines[i];
      // Skip stack trace lines (start with whitespace or "at ")
      if (/^\s+(at |Error:)/.test(line)) continue;

      const m = line.match(
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)/
      );
      if (!m) continue;

      const timestamp = m[1];
      let rest = m[2];
      let subsystem = "";

      const bracketMatch = rest.match(/^\[([^\]]+)\]\s*(.*)/);
      if (bracketMatch) {
        subsystem = bracketMatch[1];
        rest = bracketMatch[2];
      }

      // Dedup: if same message as previous entry, bump count
      const last = errors[errors.length - 1];
      if (last && last.message === rest) {
        last.count++;
        // Keep the most recent timestamp
        continue;
      }

      errors.push({ timestamp, subsystem, message: rest, count: 1 });
    }

    res.json(errors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/gateway/session/:id/messages?limit=50
// ---------------------------------------------------------------------------

router.get("/session/:id/messages", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    // Find the JSONL file in either agent directory
    let jsonlPath = "";
    for (const dir of [SESSIONS_DIR_MAIN, SESSIONS_DIR_SHARED]) {
      const candidate = path.join(dir, `${sessionId}.jsonl`);
      try {
        await fs.access(candidate);
        jsonlPath = candidate;
        break;
      } catch {
        continue;
      }
    }

    if (!jsonlPath) {
      return res.status(404).json({ error: "Session transcript not found" });
    }

    // Read the JSONL and extract user + assistant text messages
    const raw = await fs.readFile(jsonlPath, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    const messages: { role: string; text: string; timestamp: string }[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type !== "message" || !entry.message) continue;
        const msg = entry.message;
        if (msg.role !== "user" && msg.role !== "assistant") continue;

        // Extract text from content blocks
        const textParts: string[] = [];
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "text" && block.text) {
              textParts.push(block.text);
            }
          }
        } else if (typeof msg.content === "string") {
          textParts.push(msg.content);
        }

        const text = textParts.join("\n");
        if (!text || text === "NO_REPLY") continue;

        messages.push({
          role: msg.role,
          text,
          timestamp: entry.timestamp || "",
        });
      } catch {
        // Skip malformed lines
      }
    }

    // Return newest first, limited
    const result = messages.reverse().slice(0, limit);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
