import { Router } from "express";
import { exec, execSync } from "child_process";
import { readJobs, writeJobs } from "../lib/jobs.js";
import { readTail } from "../lib/tail.js";
import { CRON_RUNS_DIR } from "../lib/paths.js";
import { CronExpressionParser } from "cron-parser";
import path from "path";

const router = Router();

// GET /api/cron/jobs - list all jobs
router.get("/jobs", async (_req, res) => {
  try {
    const jobs = await readJobs();
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cron/jobs/:id - get single job
router.get("/jobs/:id", async (req, res) => {
  try {
    const jobs = await readJobs();
    const job = jobs.find((j: any) => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cron/jobs/:id - update job (merge fields)
router.put("/jobs/:id", async (req, res) => {
  try {
    const jobs = await readJobs();
    const index = jobs.findIndex((j: any) => j.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Job not found" });
    }
    // Merge provided fields into existing job
    jobs[index] = { ...jobs[index], ...req.body, id: req.params.id };
    await writeJobs(jobs);
    res.json(jobs[index]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cron/jobs - create new job
router.post("/jobs", async (req, res) => {
  try {
    const jobs = await readJobs();
    const newJob = req.body;
    if (!newJob.id) {
      return res.status(400).json({ error: "Job must have an id" });
    }
    // Check for duplicate id
    if (jobs.find((j: any) => j.id === newJob.id)) {
      return res.status(409).json({ error: "Job with this id already exists" });
    }
    jobs.push(newJob);
    await writeJobs(jobs);
    res.status(201).json(newJob);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cron/jobs/:id - delete job
router.delete("/jobs/:id", async (req, res) => {
  try {
    const jobs = await readJobs();
    const index = jobs.findIndex((j: any) => j.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Job not found" });
    }
    const removed = jobs.splice(index, 1)[0];
    await writeJobs(jobs);
    res.json({ ok: true, removed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cron/jobs/:id/run - trigger job
router.post("/jobs/:id/run", async (req, res) => {
  try {
    const jobs = await readJobs();
    const job = jobs.find((j: any) => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    const payload = job.payload ?? {};
    const agentId = job.agentId || "main";

    if (payload.kind === "agentTurn" && payload.message) {
      // openclaw cron run --force has iMessage delivery issues, so we use
      // openclaw agent directly for all agent-turn jobs.
      let instruction = payload.message;
      let deliverAfter: { channel: string; to: string } | null = null;

      // Jobs with explicit delivery: rewrite instruction to compose-only,
      // then we deliver via openclaw message send afterwards.
      if (payload.deliver && payload.channel && payload.to) {
        instruction = instruction
          .replace(/\btext\b/i, "Compose a message for")
          .replace(/\bsend\b/i, "Write a message for");
        instruction += " Do not try to send it, just write the message text.";
        deliverAfter = { channel: payload.channel, to: payload.to };
      }

      const safeInstruction = instruction.replace(/'/g, "'\\''");
      const agentCmd = `openclaw agent --agent ${agentId} --message '${safeInstruction}' --json --timeout 300`;

      exec(agentCmd, { timeout: 310000 }, (error, stdout, stderr) => {
        if (error) {
          return res.status(500).json({ error: error.message, stderr, stdout });
        }

        let agentText = "";
        try {
          const result = JSON.parse(stdout);
          const payloads = result?.result?.payloads ?? [];
          agentText = payloads[0]?.text ?? "";
        } catch { /* non-JSON output is fine for self-delivering jobs */ }

        if (!deliverAfter) {
          // Self-delivering job (e.g. update check) — agent handled everything
          return res.json({ ok: true, text: agentText || "(agent handled delivery)", stdout });
        }

        if (!agentText) {
          return res.status(500).json({ error: "Agent returned no text to deliver" });
        }

        const safeText = agentText.replace(/'/g, "'\\''");
        const sendCmd = `openclaw message send --channel ${deliverAfter.channel} --target ${deliverAfter.to} --message '${safeText}'`;
        exec(sendCmd, { timeout: 15000 }, (sendErr, sendOut, sendStderr) => {
          if (sendErr) {
            return res.status(500).json({ error: sendErr.message, stderr: sendStderr, stdout: sendOut });
          }
          res.json({ ok: true, text: agentText, stdout: sendOut });
        });
      });
      return;
    }

    // Fallback for non-agent-turn jobs
    const cmd = `openclaw cron run ${job.id} --force`;
    exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error && !stderr?.includes("gateway timeout")) {
        return res.status(500).json({
          error: error.message,
          stderr,
          stdout,
        });
      }
      res.json({ ok: true, stdout, stderr });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cron/jobs/:id/runs?limit=20 - run history for a job
router.get("/jobs/:id/runs", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const filePath = path.join(CRON_RUNS_DIR, `${req.params.id}.jsonl`);
    const tail = await readTail(filePath, 50_000);
    if (!tail) {
      return res.json([]);
    }
    const lines = tail.split("\n").filter((l) => l.trim().length > 0);
    const runs: any[] = [];
    for (let i = lines.length - 1; i >= 0 && runs.length < limit; i--) {
      try {
        runs.push(JSON.parse(lines[i]));
      } catch {
        // skip malformed lines
      }
    }
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cron/schedule-map - 24h fire-time grid for all enabled cron jobs
router.get("/schedule-map", async (_req, res) => {
  try {
    const allJobs = await readJobs();
    const cronJobs = allJobs.filter(
      (j: any) => j.enabled && j.schedule?.kind === "cron" && j.schedule?.expr
    );

    const result = cronJobs.map((j: any) => {
      const hours: number[] = [];
      try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const interval = CronExpressionParser.parse(j.schedule.expr, {
          currentDate: startOfDay,
          endDate: endOfDay,
          tz: j.schedule.tz || "America/Los_Angeles",
        });

        while (true) {
          try {
            const next = interval.next();
            hours.push(next.toDate().getHours());
          } catch {
            break;
          }
        }
      } catch {
        // invalid expression, return empty hours
      }

      return {
        id: j.id,
        name: j.name,
        agentId: j.agentId || "main",
        expr: j.schedule.expr,
        tz: j.schedule.tz || "America/Los_Angeles",
        hours: [...new Set(hours)].sort((a, b) => a - b),
      };
    });

    res.json({ jobs: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cron/next-up?limit=10 - upcoming job fires sorted soonest-first
router.get("/next-up", async (_req, res) => {
  try {
    const limit = Math.min(parseInt(_req.query.limit as string) || 10, 50);
    const allJobs = await readJobs();
    const enabled = allJobs.filter((j: any) => j.enabled);

    const entries: any[] = [];
    for (const j of enabled) {
      let nextRunAtMs = j.state?.nextRunAtMs;

      // Fall back to cron-parser if state is missing
      if (!nextRunAtMs && j.schedule?.kind === "cron" && j.schedule?.expr) {
        try {
          const interval = CronExpressionParser.parse(j.schedule.expr, {
            tz: j.schedule.tz || "America/Los_Angeles",
          });
          nextRunAtMs = interval.next().toDate().getTime();
        } catch {
          // skip if expression is invalid
        }
      }

      if (!nextRunAtMs && j.schedule?.kind === "at") {
        nextRunAtMs = j.schedule.atMs;
      }

      if (nextRunAtMs) {
        entries.push({
          id: j.id,
          name: j.name,
          agentId: j.agentId || "main",
          nextRunAtMs,
          scheduleKind: j.schedule?.kind || "unknown",
          expr: j.schedule?.expr,
          lastStatus: j.state?.lastStatus,
          lastDurationMs: j.state?.lastDurationMs,
        });
      }
    }

    entries.sort((a, b) => a.nextRunAtMs - b.nextRunAtMs);
    res.json(entries.slice(0, limit));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
