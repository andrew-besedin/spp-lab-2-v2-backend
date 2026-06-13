import express from "express";
import cardsController from "../controllers/cards.controller";
import middleware from "../middleware";

const router = express.Router();

router.use(middleware.requireAuth);

router.get("/", cardsController.list);
router.post("/", cardsController.create);
router.get("/:id", cardsController.get);
router.patch("/:id", cardsController.update);
router.post("/:id/comments", cardsController.addComment);

export default router;
