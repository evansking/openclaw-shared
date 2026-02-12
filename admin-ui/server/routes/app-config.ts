import { Router } from "express";
import { appConfig } from "../lib/app-config.js";

const router = Router();

// GET /api/app-config - return feature flags and user name for frontend
router.get("/", (_req, res) => {
  res.json({
    features: appConfig.features,
    user_name: appConfig.user_name,
    app_title: appConfig.app_title,
  });
});

export default router;
