import { Router } from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { FEEDWATCHER_DIR, ARTICLES_FILE, KINDLE_SENT_FILE, LINKEDIN_DRAFTS_FILE, FEEDS_FILE, LINKEDIN_DRAFTS_DIR, BIN_DIR } from "../lib/paths.js";
import { appConfig } from "../lib/app-config.js";

const router = Router();

function readJSON(filePath: string): any {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function readKindleSent(): string[] {
  return readJSON(KINDLE_SENT_FILE) || [];
}

function writeKindleSent(ids: string[]) {
  fs.writeFileSync(KINDLE_SENT_FILE, JSON.stringify(ids, null, 2));
}

// linkedin-drafts.json: { [articleId]: "filename.md" }
function readLinkedinDrafts(): Record<string, string> {
  return readJSON(LINKEDIN_DRAFTS_FILE) || {};
}

function writeLinkedinDrafts(map: Record<string, string>) {
  fs.writeFileSync(LINKEDIN_DRAFTS_FILE, JSON.stringify(map, null, 2));
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "").toLowerCase();
}

// One-time bootstrap: scan existing drafts and build the map from Source URLs → article IDs
function bootstrapLinkedinDrafts(articles: any[]): Record<string, string> {
  const map = readLinkedinDrafts();
  if (!fs.existsSync(LINKEDIN_DRAFTS_DIR)) return map;

  // Build normalized URL → article ID lookup
  const urlToId: Record<string, string> = {};
  for (const a of articles) {
    if (a.link) urlToId[normalizeUrl(a.link)] = a.id;
  }

  // Already-mapped filenames
  const mapped = new Set(Object.values(map));

  let changed = false;
  for (const file of fs.readdirSync(LINKEDIN_DRAFTS_DIR)) {
    if (!file.endsWith(".md") || mapped.has(file)) continue;
    const content = fs.readFileSync(path.join(LINKEDIN_DRAFTS_DIR, file), "utf-8");
    const m = content.match(/^\**Source:\**\s*(.+)$/m);
    if (m) {
      const sourceUrl = normalizeUrl(m[1].trim());
      // Try exact match first, then check if any article URL contains or is contained by the source
      let articleId = urlToId[sourceUrl];
      if (!articleId) {
        for (const [normUrl, id] of Object.entries(urlToId)) {
          if (normUrl.includes(sourceUrl) || sourceUrl.includes(normUrl)) {
            articleId = id;
            break;
          }
        }
      }
      if (articleId && !map[articleId]) {
        map[articleId] = file;
        changed = true;
      }
    }
  }

  if (changed) writeLinkedinDrafts(map);
  return map;
}

// GET /api/blog-watcher/articles
router.get("/articles", async (_req, res) => {
  try {
    if (!appConfig.features.blog_watcher || !fs.existsSync(FEEDWATCHER_DIR)) {
      return res.json([]);
    }
    const articles: any[] = readJSON(ARTICLES_FILE) || [];
    const kindleSent = new Set(readKindleSent());
    const draftsMap = appConfig.features.linkedin_drafts ? bootstrapLinkedinDrafts(articles) : {};

    // Enrich + sort newest first
    const enriched = articles
      .map((a: any) => ({
        ...a,
        kindleSent: kindleSent.has(a.id),
        linkedinDraft: draftsMap[a.id] || null,
      }))
      .sort((a: any, b: any) => {
        const da = new Date(a.processedAt || a.pubDate || 0).getTime();
        const db = new Date(b.processedAt || b.pubDate || 0).getTime();
        return db - da;
      });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blog-watcher/articles/:id/linkedin-draft
router.get("/articles/:id/linkedin-draft", async (req, res) => {
  try {
    if (!appConfig.features.linkedin_drafts) {
      return res.status(404).json({ error: "LinkedIn drafts feature disabled" });
    }
    const draftsMap = readLinkedinDrafts();
    const filename = draftsMap[req.params.id];
    if (!filename) return res.status(404).json({ error: "No draft for this article" });

    const filePath = path.join(LINKEDIN_DRAFTS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Draft file missing" });

    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ filename, content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blog-watcher/feeds
router.get("/feeds", async (_req, res) => {
  try {
    if (!appConfig.features.blog_watcher || !fs.existsSync(FEEDWATCHER_DIR)) {
      return res.json([]);
    }
    const feeds: any[] = readJSON(FEEDS_FILE) || [];
    const seen: Record<string, string[]> = readJSON(path.join(FEEDWATCHER_DIR, "seen.json")) || {};

    const result = feeds.map((f: any) => ({
      name: f.name,
      url: f.url,
      articleCount: (seen[f.name] || []).length,
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blog-watcher/status
router.get("/status", async (_req, res) => {
  try {
    if (!appConfig.features.blog_watcher || !fs.existsSync(FEEDWATCHER_DIR)) {
      return res.json({ totalArticles: 0, richArticles: 0, feedCount: 0, lastCheck: null });
    }
    const articles: any[] = readJSON(ARTICLES_FILE) || [];
    const seen: Record<string, string[]> = readJSON(path.join(FEEDWATCHER_DIR, "seen.json")) || {};
    const feeds: any[] = readJSON(FEEDS_FILE) || [];

    const totalSeen = Object.values(seen).reduce((sum, arr) => sum + (arr as string[]).length, 0);

    const logFile = path.join(FEEDWATCHER_DIR, "feed-watcher.log");
    let lastCheck: string | null = null;
    if (fs.existsSync(logFile)) {
      lastCheck = fs.statSync(logFile).mtime.toISOString();
    }

    res.json({
      totalArticles: totalSeen,
      richArticles: articles.length,
      feedCount: feeds.length,
      lastCheck,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blog-watcher/articles/:id/send-to-kindle
router.post("/articles/:id/send-to-kindle", async (req, res) => {
  try {
    if (!appConfig.features.blog_watcher) {
      return res.status(400).json({ error: "Blog watcher feature disabled" });
    }
    const articles: any[] = readJSON(ARTICLES_FILE) || [];
    const article = articles.find((a: any) => a.id === req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const sent = readKindleSent();
    if (sent.includes(req.params.id)) {
      return res.status(409).json({ error: "Already sent to Kindle" });
    }

    sent.push(req.params.id);
    writeKindleSent(sent);
    res.json({ ok: true });

    const sendToKindlePath = path.join(BIN_DIR, "send-to-kindle");
    if (fs.existsSync(sendToKindlePath)) {
      exec(
        `"${sendToKindlePath}" "${article.link}"`,
        { timeout: 180000 },
        (err, _stdout, stderr) => {
          if (err) {
            console.error(`send-to-kindle failed for ${article.id}: ${stderr || err.message}`);
          }
        }
      );
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blog-watcher/check — trigger feed-watcher run
router.post("/check", async (_req, res) => {
  if (!appConfig.features.blog_watcher) {
    return res.status(400).json({ error: "Blog watcher feature disabled" });
  }
  const feedWatcherPath = path.join(BIN_DIR, "feed-watcher");
  if (!fs.existsSync(feedWatcherPath)) {
    return res.status(400).json({ error: "feed-watcher script not found" });
  }
  exec(feedWatcherPath, { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: err.message, stderr });
    }
    res.json({ ok: true, stdout, stderr });
  });
});

export default router;
