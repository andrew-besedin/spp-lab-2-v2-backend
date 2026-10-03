import User from './User';
import Card from './Card';
import Comment from './Comment';
import ActivityLog from './ActivityLog';

Card.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
Card.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });

Card.hasMany(Comment, { as: 'comments', foreignKey: 'cardId' });
Comment.belongsTo(Card, { foreignKey: 'cardId' });
Comment.belongsTo(User, { as: 'author', foreignKey: 'userId' });

Card.hasMany(ActivityLog, { as: 'activityLog', foreignKey: 'cardId' });
ActivityLog.belongsTo(Card, { foreignKey: 'cardId' });
ActivityLog.belongsTo(User, { as: 'author', foreignKey: 'userId' });
