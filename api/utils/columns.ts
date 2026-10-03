export const COLUMN_ORDER = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;

export type ColumnStatus = (typeof COLUMN_ORDER)[number];

export function canTransition(from: ColumnStatus, to: ColumnStatus): boolean {
    if (from === to) return true;
    if (from === 'done') return false;

    const diff = Math.abs(COLUMN_ORDER.indexOf(to) - COLUMN_ORDER.indexOf(from));
    return diff === 1;
}
