import { Router } from "express";
import { exec } from "child_process";
import { SERVICE_NAMES, SERVICE_LABELS } from "../lib/paths.js";

const router = Router();

interface ServiceStatus {
  name: string;
  label: string;
  pid: number | null;
  status: string;
  running: boolean;
}

function parselaunchctlList(): Promise<ServiceStatus[]> {
  return new Promise((resolve, reject) => {
    exec("launchctl list", (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`launchctl list failed: ${stderr || error.message}`));
      }
      const lines = stdout.trim().split("\n");
      const services: ServiceStatus[] = [];

      for (const serviceName of SERVICE_NAMES) {
        const line = lines.find((l) => l.includes(serviceName));
        if (line) {
          const parts = line.split("\t");
          const pidStr = parts[0]?.trim();
          const statusStr = parts[1]?.trim();
          const pid = pidStr === "-" ? null : parseInt(pidStr, 10);
          const status = statusStr === "0" ? "running" : `exit(${statusStr})`;
          services.push({
            name: serviceName,
            label: SERVICE_LABELS[serviceName] || serviceName,
            pid: isNaN(pid as number) ? null : pid,
            status: pid !== null ? "running" : status,
            running: pid !== null,
          });
        } else {
          services.push({
            name: serviceName,
            label: SERVICE_LABELS[serviceName] || serviceName,
            pid: null,
            status: "not loaded",
            running: false,
          });
        }
      }
      resolve(services);
    });
  });
}

// GET /api/services - list known services with status
router.get("/", async (_req, res) => {
  try {
    const services = await parselaunchctlList();
    res.json(services);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:name/:action - run launchctl action
router.post("/:name/:action", async (req, res) => {
  try {
    const { name, action } = req.params;

    // Validate service name
    if (!SERVICE_NAMES.includes(name)) {
      return res.status(400).json({
        error: "Unknown service",
        known: SERVICE_NAMES,
      });
    }

    // Map friendly actions to launchctl commands
    let cmd: string;
    switch (action) {
      case "start":
        cmd = `launchctl kickstart gui/$(id -u)/${name}`;
        break;
      case "stop":
        cmd = `launchctl kill SIGTERM gui/$(id -u)/${name}`;
        break;
      case "restart":
        cmd = `launchctl kill SIGTERM gui/$(id -u)/${name} && sleep 1 && launchctl kickstart gui/$(id -u)/${name}`;
        break;
      default:
        return res.status(400).json({
          error: "Invalid action. Use: start, stop, restart",
        });
    }

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({
          error: error.message,
          stdout,
          stderr,
        });
      }
      res.json({
        ok: true,
        service: name,
        action,
        label: SERVICE_LABELS[name] || name,
        stdout,
        stderr,
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
