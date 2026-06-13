import express from "express";
import cardsController from "../controllers/cards.controller";
import middleware from "../middleware";
import { createCardValidation } from "../interfaces/cards/CreateCardDto";
import { updateCardValidation } from "../interfaces/cards/UpdateCardDto";
import { addCommentValidation } from "../interfaces/cards/AddCommentDto";
import { getCardValidation } from "../interfaces/cards/GetCardDto";

const router = express.Router();

router.use(middleware.requireAuth);

router.get("/", cardsController.list);
router.post("/", createCardValidation, middleware.validator, cardsController.create);
router.get("/:id", getCardValidation, middleware.validator, cardsController.get);
router.patch("/:id", updateCardValidation, middleware.validator, cardsController.update);
router.post("/:id/comments", addCommentValidation, middleware.validator, cardsController.addComment);

export default router;
