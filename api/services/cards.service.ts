import { Transaction } from "sequelize";
import Card from "../schemes/Card";
import ActivityLog, { ActivityAction } from "../schemes/ActivityLog";
import { ColumnStatus } from "../utils/columns";

export function logActivity(
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
export async function moveCard(card: Card, newStatus: ColumnStatus, newIndex: number, transaction?: Transaction) {
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
