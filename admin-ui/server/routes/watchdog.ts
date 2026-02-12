import { Router } from "express";
import fs from "fs";
import { homedir } from "os";

const router = Router();

const WATCHDOG_STATE_FILE = `${homedir()}/clawd/memory/watchdog-state.json`;
const WATCHDOG_LOG_FILE = `${homedir()}/clawd/logs/message-watchdog.log`;
const GATEWAY_LOG_DIR = "/tmp/openclaw";

function readJSON(filePath: string): any {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function readLogTail(filePath: string, lines: number): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const allLines = content.split("\n").filter((l) => l.trim());
  return allLines.slice(-lines);
}

function parseWatchdogLogLine(line: string): any {
  // Format: 2026-02-07 20:27:21.227 [INFO] message
  const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) \[(\w+)\] (.*)$/);
  if (!match) return null;
  return {
    timestamp: match[1],
    level: match[2],
    message: match[3],
  };
}

function parseGatewayLogForRuns(limit: number): any[] {
  const today = new Date().toISOString().split("T")[0];
  const logFile = `${GATEWAY_LOG_DIR}/openclaw-${today}.log`;
  if (!fs.existsSync(logFile)) return [];

  const content = fs.readFileSync(logFile, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());

  const runs: any[] = [];
  const activeRuns = new Map<string, any>();

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const msg = obj["1"] || "";
      const time = obj.time;

      // Parse run start
      const startMatch = msg.match(
        /embedded run start: runId=([a-f0-9-]+) sessionId=([a-f0-9-]+).*?messageChannel=(\w+)/
      );
      if (startMatch) {
        activeRuns.set(startMatch[1], {
          runId: startMatch[1],
          sessionId: startMatch[2],
          messageChannel: startMatch[3],
          startedAt: time,
          status: "running",
        });
      }

      // Parse run done
      const doneMatch = msg.match(
        /embedded run done: runId=([a-f0-9-]+) sessionId=([a-f0-9-]+) durationMs=(\d+) aborted=(true|false)/
      );
      if (doneMatch) {
        const run = activeRuns.get(doneMatch[1]);
        if (run) {
          run.completedAt = time;
          run.durationMs = parseInt(doneMatch[3], 10);
          run.aborted = doneMatch[4] === "true";
          run.status = doneMatch[4] === "true" ? "aborted" : "completed";
          runs.push(run);
          activeRuns.delete(doneMatch[1]);
        }
      }
    } catch {}
  }

  // Add still-active runs
  for (const run of activeRuns.values()) {
    run.elapsedMs = Date.now() - new Date(run.startedAt).getTime();
    runs.push(run);
  }

  // Sort by start time descending, limit
  return runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, limit);
}

// GET /api/watchdog/state
router.get("/state", (_req, res) => {
  try {
    const state = readJSON(WATCHDOG_STATE_FILE) || {
      lastLogPosition: { file: null, offset: 0 },
      alertHistory: [],
      suppressedRuns: {},
      lastRecoveryAttempt: null,
    };
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/watchdog/logs?limit=100
router.get("/logs", (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const lines = readLogTail(WATCHDOG_LOG_FILE, limit);
    const parsed = lines.map(parseWatchdogLogLine).filter(Boolean);
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/watchdog/runs?limit=50
router.get("/runs", (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const runs = parseGatewayLogForRuns(limit);
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/watchdog/stats
router.get("/stats", (_req, res) => {
  try {
    const state = readJSON(WATCHDOG_STATE_FILE);
    const runs = parseGatewayLogForRuns(1000);

    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Count alerts in last hour
    const recentAlerts = (state?.alertHistory || []).filter(
      (a: any) => new Date(a.at).getTime() > oneHourAgo
    );

    // Count runs by status
    const activeRuns = runs.filter((r) => r.status === "running");
    const completedRuns = runs.filter((r) => r.status === "completed");
    const abortedRuns = runs.filter((r) => r.status === "aborted");

    // Average duration of completed runs
    const avgDuration =
      completedRuns.length > 0
        ? Math.round(
            completedRuns.reduce((sum, r) => sum + (r.durationMs || 0), 0) /
              completedRuns.length
          )
        : 0;

    // Longest running active run
    const longestActive = activeRuns.length > 0
      ? Math.max(...activeRuns.map((r) => r.elapsedMs || 0))
      : 0;

    res.json({
      alertsLastHour: recentAlerts.length,
      alertsByLevel: recentAlerts.reduce((acc: any, a: any) => {
        acc[`L${a.level}`] = (acc[`L${a.level}`] || 0) + 1;
        return acc;
      }, {}),
      activeRuns: activeRuns.length,
      completedToday: completedRuns.length,
      abortedToday: abortedRuns.length,
      avgDurationMs: avgDuration,
      longestActiveMs: longestActive,
      lastRecoveryAttempt: state?.lastRecoveryAttempt || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
