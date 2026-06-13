import express from "express";
import authController from "../controllers/auth.controller";
import middleware from "../middleware";

const router = express.Router();

router.get("/github", authController.redirectToGithub);
router.get("/github/callback", authController.githubCallback);
router.get("/me", middleware.requireAuth, authController.me);
router.post("/logout", authController.logout);

export default router;
