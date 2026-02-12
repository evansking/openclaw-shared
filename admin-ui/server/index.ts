import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import workspaceRouter from "./routes/workspace.js";
import friendsRouter from "./routes/friends.js";
import cronRouter from "./routes/cron.js";
import toolsRouter from "./routes/tools.js";
import skillsRouter from "./routes/skills.js";
import settingsRouter from "./routes/settings.js";
import servicesRouter from "./routes/services.js";
import blogWatcherRouter from "./routes/blog-watcher.js";
import textProcessorRouter from "./routes/text-processor.js";
import gatewayRouter from "./routes/gateway.js";
import memoryRouter from "./routes/memory.js";
import storiesRouter from "./routes/stories.js";
import watchdogRouter from "./routes/watchdog.js";
import appConfigRouter from "./routes/app-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// API Routes
app.use("/api/app-config", appConfigRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/cron", cronRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/blog-watcher", blogWatcherRouter);
app.use("/api/text-processor", textProcessorRouter);
app.use("/api/gateway", gatewayRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/stories", storiesRouter);
app.use("/api/watchdog", watchdogRouter);

// Serve static files from the Vite build
const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));
// SPA fallback: serve index.html for any non-API, non-static route
app.use((_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Admin UI server listening on http://0.0.0.0:${PORT}`);
  console.log(`  mode: ${process.env.NODE_ENV || "development"}`);
});
