import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import sequelize from "../sequelize";
import { COLUMN_ORDER, ColumnStatus } from "../utils/columns";

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = typeof PRIORITIES[number];

class Card extends Model<InferAttributes<Card>, InferCreationAttributes<Card>> {
    declare id: CreationOptional<number>;
    declare title: string;
    declare description: CreationOptional<string>;
    declare priority: CreationOptional<Priority>;
    declare status: CreationOptional<ColumnStatus>;
    declare position: number;
    declare assigneeId: CreationOptional<number | null>;
    declare creatorId: number;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

Card.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
        },
        priority: {
            type: DataTypes.ENUM(...PRIORITIES),
            allowNull: false,
            defaultValue: "medium",
        },
        status: {
            type: DataTypes.ENUM(...COLUMN_ORDER),
            allowNull: false,
            defaultValue: "backlog",
        },
        position: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        assigneeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        creatorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        modelName: "Card",
        tableName: "cards",
    }
);

export default Card;
