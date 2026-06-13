import { Transaction } from "sequelize";
import sequelize from "../sequelize";
import Card from "../schemes/Card";
import Comment from "../schemes/Comment";
import ActivityLog, { ActivityAction } from "../schemes/ActivityLog";
import User from "../schemes/User";
import { canTransition, ColumnStatus, COLUMN_ORDER } from "../utils/columns";
import { CreateCardDto } from "../interfaces/cards/CreateCardDto";
import { UpdateCardDto } from "../interfaces/cards/UpdateCardDto";

export class CardNotFoundError extends Error {}
export class InvalidTransitionError extends Error {}

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

class CardsService {
    private logActivity(
        cardId: number,
        userId: number,
        action: ActivityAction,
        meta?: Record<string, unknown>,
        transaction?: Transaction
    ) {
        return ActivityLog.create({ cardId, userId, action, meta: meta ?? null }, { transaction });
    }

    /**
     * Moves a card to (possibly) a new column and position, reindexing affected
     * columns to sequential positions starting at 0.
     */
    private async moveCard(card: Card, newStatus: ColumnStatus, newIndex: number, transaction?: Transaction) {
        const oldStatus = card.status;

        if (oldStatus === newStatus) {
            const siblings = await Card.findAll({
                where: { status: oldStatus },
                order: [["position", "ASC"]],
                transaction,
            });

            const reordered = siblings.filter((c) => c.id !== card.id);
            const clampedIndex = Math.max(0, Math.min(newIndex, reordered.length));
            reordered.splice(clampedIndex, 0, card);

            await Promise.all(reordered.map((c, index) => c.update({ position: index }, { transaction })));
        } else {
            const sourceSiblings = await Card.findAll({
                where: { status: oldStatus },
                order: [["position", "ASC"]],
                transaction,
            });
            const destSiblings = await Card.findAll({
                where: { status: newStatus },
                order: [["position", "ASC"]],
                transaction,
            });

            const remainingSource = sourceSiblings.filter((c) => c.id !== card.id);
            const clampedIndex = Math.max(0, Math.min(newIndex, destSiblings.length));
            destSiblings.splice(clampedIndex, 0, card);

            await card.update({ status: newStatus }, { transaction });
            await Promise.all(remainingSource.map((c, index) => c.update({ position: index }, { transaction })));
            await Promise.all(destSiblings.map((c, index) => c.update({ position: index }, { transaction })));
        }

        await card.reload({ transaction });
    }

    async list() {
        const cards = await Card.findAll({ include: CARD_INCLUDE });

        cards.sort((a, b) => {
            const statusDiff = COLUMN_ORDER.indexOf(a.status) - COLUMN_ORDER.indexOf(b.status);
            return statusDiff !== 0 ? statusDiff : a.position - b.position;
        });

        return cards;
    }

    getDetail(id: number) {
        return Card.findByPk(id, { include: CARD_DETAIL_INCLUDE });
    }

    async create(data: CreateCardDto, userId: number) {
        const { title, description, priority, assigneeId } = data;

        const cardId = await sequelize.transaction(async (transaction) => {
            const lastInBacklog = await Card.count({ where: { status: "backlog" }, transaction });

            const card = await Card.create({
                title,
                description: description || "",
                priority: priority || "medium",
                status: "backlog",
                position: lastInBacklog,
                assigneeId: assigneeId || null,
                creatorId: userId,
            }, { transaction });

            await this.logActivity(card.id, userId, "created", undefined, transaction);

            return card.id;
        });

        return Card.findByPk(cardId, { include: CARD_INCLUDE });
    }

    async update(id: number, data: UpdateCardDto, userId: number) {
        const { title, description, priority, assigneeId, status, position } = data;

        const cardId = await sequelize.transaction(async (transaction) => {
            const card = await Card.findByPk(id, { transaction });

            if (!card) {
                throw new CardNotFoundError();
            }

            if (priority !== undefined && priority !== card.priority) {
                await this.logActivity(card.id, userId, "priority_changed", { from: card.priority, to: priority }, transaction);
                card.priority = priority;
            }

            if (title !== undefined && title !== card.title) {
                await this.logActivity(card.id, userId, "title_changed", { from: card.title, to: title }, transaction);
                card.title = title;
            }

            if (description !== undefined && description !== card.description) {
                await this.logActivity(card.id, userId, "description_changed", { from: card.description, to: description }, transaction);
                card.description = description;
            }

            if (assigneeId !== undefined && assigneeId !== card.assigneeId) {
                await this.logActivity(card.id, userId, "assignee_changed", { from: card.assigneeId, to: assigneeId }, transaction);
                card.assigneeId = assigneeId;
            }

            await card.save({ transaction });

            if (status !== undefined && status !== card.status) {
                if (!canTransition(card.status, status)) {
                    throw new InvalidTransitionError();
                }

                await this.logActivity(card.id, userId, "status_changed", { from: card.status, to: status }, transaction);
                await this.moveCard(card, status, position ?? 0, transaction);
            } else if (position !== undefined && position !== card.position) {
                await this.moveCard(card, card.status, position, transaction);
            }

            return card.id;
        });

        return Card.findByPk(cardId, { include: CARD_INCLUDE });
    }

    async addComment(cardId: number, userId: number, body: string) {
        const commentId = await sequelize.transaction(async (transaction) => {
            const card = await Card.findByPk(cardId, { transaction });

            if (!card) {
                throw new CardNotFoundError();
            }

            const comment = await Comment.create({ cardId: card.id, userId, body }, { transaction });
            return comment.id;
        });

        return Comment.findByPk(commentId, {
            include: [{ model: User, as: "author", attributes: USER_ATTRIBUTES }],
        });
    }
}

const cardsService = new CardsService();
export default cardsService;
