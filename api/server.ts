import "dotenv/config";
import express from "express";
import initdb from "./database";
import sequelize from "./sequelize";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import envVars from "./utils/envVars";
import middleware from "./middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";
import debugFn from "./debug";

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
    server.set("trust proxy", 1);

    server.use(express.json());
    server.use(cookieParser());
    server.use(middleware.validator);
    server.use(cors({ origin: true, credentials: true }));
    server.options("*", cors({ origin: true, credentials: true }));

    const apiServer = express.Router();
    server.use("/api", apiServer);
    apiServer.use('/public', express.static(path.join(__dirname, "./public")));

    // TODO: mount routers here, e.g.:
    // import exampleRouter from "./routes/example.route";
    // apiServer.use("/example", exampleRouter);

    server.listen(envVars().PORT, () => {
        console.log(`> API server ready on http://localhost:${envVars().PORT}`);
    });
}
