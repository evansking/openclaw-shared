import { Router } from "express";
import { readConfig, writeConfig } from "../lib/config.js";

const router = Router();

function redactSecrets(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(result)) {
    if (/key|secret|token|password/i.test(key) && typeof result[key] === "string") {
      result[key] = result[key].slice(0, 10) + "..." + result[key].slice(-4);
    } else if (typeof result[key] === "object") {
      result[key] = redactSecrets(result[key]);
    }
  }
  return result;
}

// GET /api/settings - read full openclaw.json
router.get("/", async (_req, res) => {
  try {
    const config = await readConfig();
    res.json(redactSecrets(config));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings - write full openclaw.json (with backup)
router.put("/", async (req, res) => {
  try {
    const config = req.body;
    if (!config || typeof config !== "object") {
      return res.status(400).json({ error: "Body must be a JSON object" });
    }
    await writeConfig(config);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
