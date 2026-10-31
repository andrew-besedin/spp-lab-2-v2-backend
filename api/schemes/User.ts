import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from 'sequelize';
import sequelize from '../sequelize';

export enum UserRole {
    USER = 'user',
    MODERATOR = 'moderator',
    ADMIN = 'admin',
}

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>;
    declare githubId: string;
    declare username: string;
    declare displayName: string;
    declare avatarUrl: string;
    declare role: UserRole;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        githubId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            allowNull: false,
            defaultValue: UserRole.USER,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
    },
);

export default User;
