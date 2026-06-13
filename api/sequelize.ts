import { Sequelize } from 'sequelize';

const isSocket = !!process.env.PGHOST?.startsWith('/cloudsql/');

const sequelize = new Sequelize({
    dialect: 'postgres',
    dialectOptions: isSocket ? {
        socketPath: process.env.PGHOST
    } : undefined,
    password: process.env.PGPASSWORD,
    host: isSocket ? undefined : process.env.PGHOST,
    username: process.env.PGUSER,
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE,
    logging: false
});

export default sequelize;
