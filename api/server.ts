import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initdb from './database';
import sequelize from './sequelize';
import envVars from './utils/envVars';
import middleware from './middleware';
import debugFn from './debug';
import './schemes/associations';
import authRouter from './routes/auth.route';
import cardsRouter from './routes/cards.route';
import usersRouter from './routes/users.route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startApp() {
    await initdb();
    await sequelize.authenticate();
    await sequelize.sync({
        // force: true
        // alter: true
    });

    // TODO: import and start background daemons here

    await debugFn();

    const server = express();

    server.use(express.json());
    server.use(cookieParser());
    server.use(cors({ origin: true, credentials: true }));
    server.options('*', cors({ origin: true, credentials: true }));

    const apiServer = express.Router();
    server.use('/api', apiServer);
    apiServer.use('/public', express.static(path.join(__dirname, './public')));

    apiServer.use('/auth', authRouter);
    apiServer.use('/cards', cardsRouter);
    apiServer.use('/users', usersRouter);

    server.listen(envVars().PORT, () => {
        console.log(`> API server ready on http://localhost:${envVars().PORT}`);
    });
}
