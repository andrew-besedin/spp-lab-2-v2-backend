import express from "express";
import usersController from "../controllers/users.controller";
import middleware from "../middleware";

const router = express.Router();

router.use(middleware.requireAuth);

router.get("/", usersController.list);

export default router;
