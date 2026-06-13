import { Request, Response } from "express";
import { tryCatch } from "../utils/utils";
import sequelize from "../sequelize";
import Card from "../schemes/Card";
import Comment from "../schemes/Comment";
import ActivityLog from "../schemes/ActivityLog";
import User from "../schemes/User";
import { canTransition, COLUMN_ORDER } from "../utils/columns";
import { logActivity, moveCard } from "../services/cards.service";
import { CreateCardDto } from "../interfaces/cards/CreateCardDto";
import { UpdateCardDto, UpdateCardParams } from "../interfaces/cards/UpdateCardDto";
import { AddCommentDto, AddCommentParams } from "../interfaces/cards/AddCommentDto";
import { GetCardParams } from "../interfaces/cards/GetCardDto";

class CardNotFoundError extends Error {}
class InvalidTransitionError extends Error {}

const USER_ATTRIBUTES = ["id", "username", "displayName", "avatarUrl"];

const CARD_INCLUDE = [
    { model: User, as: "assignee", attributes: USER_ATTRIBUTES },
    { model: User, as: "creator", attributes: USER_ATTRIBUTES },
];

const CARD_DETAIL_INCLUDE = [
    ...CARD_INCLUDE,
    {
        model: Comment,
        as: "comments",
        include: [{ model: User, as: "author", attributes: USER_ATTRIBUTES }],
    },
    {
        model: ActivityLog,
        as: "activityLog",
        include: [{ model: User, as: "author", attributes: USER_ATTRIBUTES }],
    },
];

class CardsController {
    list = tryCatch(async (req: Request, res: Response) => {
        const cards = await Card.findAll({ include: CARD_INCLUDE });

        cards.sort((a, b) => {
            const statusDiff = COLUMN_ORDER.indexOf(a.status) - COLUMN_ORDER.indexOf(b.status);
            return statusDiff !== 0 ? statusDiff : a.position - b.position;
        });

        res.status(200).json({ success: true, data: cards });
    });

    get = tryCatch<GetCardParams>(async (req, res) => {
        const card = await Card.findByPk(Number(req.params.id), { include: CARD_DETAIL_INCLUDE });

        if (!card) {
            res.status(404).json({ success: false, data: "Card not found" });
            return;
        }

        res.status(200).json({ success: true, data: card });
    });

    create = tryCatch<unknown, unknown, CreateCardDto>(async (req, res) => {
        const { title, description, priority, assigneeId } = req.body;

        const cardId = await sequelize.transaction(async (transaction) => {
            const lastInBacklog = await Card.count({ where: { status: "backlog" }, transaction });

            const card = await Card.create({
                title,
                description: description || "",
                priority: priority || "medium",
                status: "backlog",
                position: lastInBacklog,
                assigneeId: assigneeId || null,
                creatorId: req.user!.id,
            }, { transaction });

            await logActivity(card.id, req.user!.id, "created", undefined, transaction);

            return card.id;
        });

        const result = await Card.findByPk(cardId, { include: CARD_INCLUDE });
        res.status(200).json({ success: true, data: result });
    });

    update = tryCatch<UpdateCardParams, unknown, UpdateCardDto>(async (req, res) => {
        const { title, description, priority, assigneeId, status, position } = req.body;
        const userId = req.user!.id;

        let cardId: number | null = null;

        try {
            await sequelize.transaction(async (transaction) => {
                const card = await Card.findByPk(Number(req.params.id), { transaction });

                if (!card) {
                    throw new CardNotFoundError();
                }

                if (priority !== undefined && priority !== card.priority) {
                    await logActivity(card.id, userId, "priority_changed", { from: card.priority, to: priority }, transaction);
                    card.priority = priority;
                }

                if (title !== undefined && title !== card.title) {
                    await logActivity(card.id, userId, "title_changed", { from: card.title, to: title }, transaction);
                    card.title = title;
                }

                if (description !== undefined && description !== card.description) {
                    await logActivity(card.id, userId, "description_changed", { from: card.description, to: description }, transaction);
                    card.description = description;
                }

                if (assigneeId !== undefined && assigneeId !== card.assigneeId) {
                    await logActivity(card.id, userId, "assignee_changed", { from: card.assigneeId, to: assigneeId }, transaction);
                    card.assigneeId = assigneeId;
                }

                await card.save({ transaction });

                if (status !== undefined && status !== card.status) {
                    if (!canTransition(card.status, status)) {
                        throw new InvalidTransitionError();
                    }

                    await logActivity(card.id, userId, "status_changed", { from: card.status, to: status }, transaction);
                    await moveCard(card, status, position ?? 0, transaction);
                } else if (position !== undefined && position !== card.position) {
                    await moveCard(card, card.status, position, transaction);
                }

                cardId = card.id;
            });
        } catch (err) {
            if (err instanceof CardNotFoundError) {
                res.status(404).json({ success: false, data: "Card not found" });
                return;
            }

            if (err instanceof InvalidTransitionError) {
                res.status(200).json({ success: false, data: "Invalid column transition" });
                return;
            }

            throw err;
        }

        const result = await Card.findByPk(cardId!, { include: CARD_INCLUDE });
        res.status(200).json({ success: true, data: result });
    });

    addComment = tryCatch<AddCommentParams, unknown, AddCommentDto>(async (req, res) => {
        const { body } = req.body;

        let commentId: number | null = null;

        try {
            await sequelize.transaction(async (transaction) => {
                const card = await Card.findByPk(Number(req.params.id), { transaction });

                if (!card) {
                    throw new CardNotFoundError();
                }

                const comment = await Comment.create({ cardId: card.id, userId: req.user!.id, body }, { transaction });
                commentId = comment.id;
            });
        } catch (err) {
            if (err instanceof CardNotFoundError) {
                res.status(404).json({ success: false, data: "Card not found" });
                return;
            }

            throw err;
        }

        const result = await Comment.findByPk(commentId!, {
            include: [{ model: User, as: "author", attributes: USER_ATTRIBUTES }],
        });

        res.status(200).json({ success: true, data: result });
    });
}

const cardsController = new CardsController();
export default cardsController;
