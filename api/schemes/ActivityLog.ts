import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import sequelize from "../sequelize";

export const ACTIVITY_ACTIONS = [
    "created",
    "title_changed",
    "description_changed",
    "priority_changed",
    "assignee_changed",
    "status_changed",
] as const;
export type ActivityAction = typeof ACTIVITY_ACTIONS[number];

class ActivityLog extends Model<InferAttributes<ActivityLog>, InferCreationAttributes<ActivityLog>> {
    declare id: CreationOptional<number>;
    declare cardId: number;
    declare userId: number;
    declare action: ActivityAction;
    declare meta: CreationOptional<Record<string, unknown> | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

ActivityLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cardId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        action: {
            type: DataTypes.ENUM(...ACTIVITY_ACTIONS),
            allowNull: false,
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        modelName: "ActivityLog",
        tableName: "activity_logs",
    }
);

export default ActivityLog;
