import { Request, Response } from "express";
import { tryCatch } from "../utils/utils";
import Card, { PRIORITIES } from "../schemes/Card";
import Comment from "../schemes/Comment";
import ActivityLog from "../schemes/ActivityLog";
import User from "../schemes/User";
import { canTransition, COLUMN_ORDER, ColumnStatus } from "../utils/columns";
import { logActivity, moveCard } from "../services/cards.service";

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

    get = tryCatch(async (req: Request, res: Response) => {
        const card = await Card.findByPk(Number(req.params.id), { include: CARD_DETAIL_INCLUDE });

        if (!card) {
            res.status(404).json({ success: false, data: "Card not found" });
            return;
        }

        res.status(200).json({ success: true, data: card });
    });

    create = tryCatch(async (req: Request, res: Response) => {
        const { title, description, priority, assigneeId } = req.body;

        if (!title || typeof title !== "string") {
            res.status(200).json({ success: false, data: "Title is required" });
            return;
        }

        if (priority && !PRIORITIES.includes(priority)) {
            res.status(200).json({ success: false, data: "Invalid priority" });
            return;
        }

        const lastInBacklog = await Card.count({ where: { status: "backlog" } });

        const card = await Card.create({
            title,
            description: description || "",
            priority: priority || "medium",
            status: "backlog",
            position: lastInBacklog,
            assigneeId: assigneeId || null,
            creatorId: req.user!.id,
        });

        await logActivity(card.id, req.user!.id, "created");

        const result = await Card.findByPk(card.id, { include: CARD_INCLUDE });
        res.status(200).json({ success: true, data: result });
    });

    update = tryCatch(async (req: Request, res: Response) => {
        const card = await Card.findByPk(Number(req.params.id));

        if (!card) {
            res.status(404).json({ success: false, data: "Card not found" });
            return;
        }

        const { title, description, priority, assigneeId, status, position } = req.body;
        const userId = req.user!.id;

        if (priority !== undefined && priority !== card.priority) {
            if (!PRIORITIES.includes(priority)) {
                res.status(200).json({ success: false, data: "Invalid priority" });
                return;
            }
            await logActivity(card.id, userId, "priority_changed", { from: card.priority, to: priority });
            card.priority = priority;
        }

        if (title !== undefined && title !== card.title) {
            await logActivity(card.id, userId, "title_changed", { from: card.title, to: title });
            card.title = title;
        }

        if (description !== undefined && description !== card.description) {
            await logActivity(card.id, userId, "description_changed", { from: card.description, to: description });
            card.description = description;
        }

        if (assigneeId !== undefined && assigneeId !== card.assigneeId) {
            await logActivity(card.id, userId, "assignee_changed", { from: card.assigneeId, to: assigneeId });
            card.assigneeId = assigneeId;
        }

        await card.save();

        if (status !== undefined && status !== card.status) {
            if (!COLUMN_ORDER.includes(status as ColumnStatus) || !canTransition(card.status, status as ColumnStatus)) {
                res.status(200).json({ success: false, data: "Invalid column transition" });
                return;
            }

            await logActivity(card.id, userId, "status_changed", { from: card.status, to: status });
            await moveCard(card, status as ColumnStatus, position ?? 0);
        } else if (position !== undefined && position !== card.position) {
            await moveCard(card, card.status, position);
        }

        const result = await Card.findByPk(card.id, { include: CARD_INCLUDE });
        res.status(200).json({ success: true, data: result });
    });

    addComment = tryCatch(async (req: Request, res: Response) => {
        const card = await Card.findByPk(Number(req.params.id));

        if (!card) {
            res.status(404).json({ success: false, data: "Card not found" });
            return;
        }

        const { body } = req.body;

        if (!body || typeof body !== "string" || !body.trim()) {
            res.status(200).json({ success: false, data: "Comment body is required" });
            return;
        }

        const comment = await Comment.create({ cardId: card.id, userId: req.user!.id, body });
        const result = await Comment.findByPk(comment.id, {
            include: [{ model: User, as: "author", attributes: USER_ATTRIBUTES }],
        });

        res.status(200).json({ success: true, data: result });
    });
}

const cardsController = new CardsController();
export default cardsController;
