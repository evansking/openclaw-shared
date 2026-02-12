import { Router } from "express";
import fs from "fs";
import { execSync } from "child_process";
import { TEXT_PROCESSOR_DECISIONS_FILE, WATCHED_CHATS_FILE, CONFIG_FILE } from "../lib/paths.js";
import { appConfig } from "../lib/app-config.js";

const router = Router();

function readJSON(filePath: string): any {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Text processor config from app config
const CHAT_DB = appConfig.text_processor?.chat_db || "";
const CONTACTS_FILE = appConfig.text_processor?.contacts_file || "";

function resolveGroupChatName(chatId: string): string {
  if (!CHAT_DB || !fs.existsSync(CHAT_DB)) return `Group #${chatId}`;

  try {
    // Get participant handles from chat.db
    const sql = `SELECT GROUP_CONCAT(h.id, '|') FROM chat c JOIN chat_handle_join chj ON c.ROWID = chj.chat_id JOIN handle h ON chj.handle_id = h.ROWID WHERE c.ROWID = ${Number(chatId)};`;
    const raw = execSync(`sqlite3 "${CHAT_DB}" "${sql}"`, { encoding: "utf-8" }).trim();
    if (!raw) return `Group #${chatId}`;

    // Load contacts for name lookup
    const contacts: Record<string, string> = {};
    if (CONTACTS_FILE && fs.existsSync(CONTACTS_FILE)) {
      for (const line of fs.readFileSync(CONTACTS_FILE, "utf-8").split("\n")) {
        const [phone, name] = line.split("|");
        if (phone && name) contacts[phone.trim()] = name.trim();
      }
    }

    const names = raw.split("|").map((h) => {
      const name = contacts[h.trim()];
      return name ? name.split(" ")[0] : h.trim();
    });
    return names.join(", ");
  } catch {
    return `Group #${chatId}`;
  }
}

// GET /api/text-processor/decisions
router.get("/decisions", (_req, res) => {
  try {
    if (!appConfig.features.text_processor) {
      return res.json([]);
    }
    const decisions = readJSON(TEXT_PROCESSOR_DECISIONS_FILE) || [];
    res.json(decisions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/text-processor/watched-chats
router.get("/watched-chats", (_req, res) => {
  try {
    if (!appConfig.features.text_processor && !appConfig.features.active_chats) {
      return res.json([]);
    }

    // Permanent chats from openclaw.json
    const permanent: any[] = [];
    const config = readJSON(CONFIG_FILE);
    if (config) {
      // Main DM is always active (dmPolicy: "pairing") - use configured context name
      permanent.push({ chat_id: "main", context: appConfig.dm_context, permanent: true });

      // Group bindings with channel: "imessage"
      const bindings: any[] = config.bindings || [];
      for (const b of bindings) {
        if (b.match?.channel === "imessage" && b.match?.peer?.kind === "group") {
          permanent.push({
            chat_id: b.match.peer.id,
            context: resolveGroupChatName(b.match.peer.id),
            permanent: true,
          });
        }
      }
    }

    // Temporary watched chats
    const chats: any[] = readJSON(WATCHED_CHATS_FILE) || [];
    const now = new Date().toISOString();
    const active = chats
      .filter((c: any) => (c.expires_at || "") > now)
      .map((c: any) => ({ ...c, permanent: false }));

    res.json([...permanent, ...active]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/text-processor/watched-chats/:chatId
router.delete("/watched-chats/:chatId", (req, res) => {
  try {
    const chatId = Number(req.params.chatId);
    const chats: any[] = readJSON(WATCHED_CHATS_FILE) || [];
    const filtered = chats.filter((c: any) => c.chat_id !== chatId);
    fs.writeFileSync(WATCHED_CHATS_FILE, JSON.stringify(filtered, null, 2));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/text-processor/stats
router.get("/stats", (_req, res) => {
  try {
    if (!appConfig.features.text_processor) {
      return res.json({ total: 0, flagged: 0, escalated: 0, approved: 0, rejected: 0, byAction: {} });
    }
    const decisions: any[] = readJSON(TEXT_PROCESSOR_DECISIONS_FILE) || [];
    const total = decisions.length;
    const flagged = decisions.filter((d: any) => d.deepseek?.action !== "none").length;
    const escalated = decisions.filter((d: any) => d.escalated).length;
    const approved = decisions.filter((d: any) =>
      ["memory_saved", "reminder_sent", "calendar_sent"].includes(d.outcome)
    ).length;
    const rejected = decisions.filter((d: any) => d.outcome === "rejected").length;

    const byAction: Record<string, number> = {};
    for (const d of decisions) {
      const action = d.deepseek?.action || "none";
      byAction[action] = (byAction[action] || 0) + 1;
    }

    res.json({ total, flagged, escalated, approved, rejected, byAction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
