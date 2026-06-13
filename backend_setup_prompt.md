---

Scaffold a new Node.js + Express + TypeScript backend project called `[PROJECT_NAME]`. Follow every instruction exactly — file contents, folder structure, config values, and naming conventions must match what is specified below.

---

### 1. Initialize the project

```bash
npm init -y
```

---

### 2. Set `package.json` to this

```json
{
  "name": "[PROJECT_NAME]",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "npx nodemon --exec \"npx tsx ./api/start.ts\"",
    "start": "cross-env NODE_ENV=production npx tsx ./api/start.ts"
  },
  "dependencies": {
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "cross-env": "^7.0.3",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "express-rate-limit": "^8.1.0",
    "express-validator": "^7.2.1",
    "nodemon": "^3.1.7",
    "pg": "^8.13.1",
    "sequelize": "^6.37.5",
    "tsx": "^4.19.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^20",
    "@types/pg": "^8.11.10",
    "typescript": "^5"
  }
}
```

Run `npm install`.

---

### 3. Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./api/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

### 4. Create `nodemon.json`

```json
{
    "verbose": true,
    "ignore": ["node_modules"],
    "watch": ["api/**/*"],
    "ext": "js json ts tsx"
}
```

---

### 5. Create `.sequelizerc`

```js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  'config': path.resolve(__dirname, 'config', 'config.cjs'),
};
```

---

### 6. Create `config/config.cjs`

```js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    dialect: 'postgres'
  },
  test: {
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    dialect: 'postgres'
  },
  production: {
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    dialect: 'postgres'
  }
};
```

---

### 7. Create the folder structure

```
api/
  start.ts
  server.ts
  database.ts
  sequelize.ts
  middleware.ts
  debug.ts
  controllers/
  routes/
  schemes/
  services/
  interfaces/
  utils/
    envVars.ts
    utils.ts
  public/
config/
  config.cjs
migrations/
```

---

### 8. Create `api/start.ts`

```typescript
import { startApp } from './server';

startApp();
```

---

### 9. Create `api/database.ts`

```typescript
import "dotenv/config";
import pg from "pg";

const isSocket = !!process.env.PGHOST?.startsWith('/cloudsql/');

async function initdb() {
    console.log('Connecting to PostgreSQL...');

    const pool = new pg.Pool({
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        host: process.env.PGHOST,
        database: "postgres",
        port: parseInt(process.env.PGPORT || "5432", 10),
        keepAlive: true,
        idleTimeoutMillis: 0,
        max: 100,
        ssl: isSocket ? false : undefined,
    });

    try {
        await pool.query(`CREATE DATABASE "${process.env.PGDATABASE}" `);
    } catch (error: any) {
        if (error.code === "42P04") {
            console.log("Database already exists, skipping creation");
        } else {
            throw error;
        }
    }

    await pool.end();
}

export default initdb;
```

---

### 10. Create `api/sequelize.ts`

```typescript
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
```

---

### 11. Create `api/utils/envVars.ts`

```typescript
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PGDATABASE: z.string().min(1),
    PORT: z.coerce.number().default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

const env = parsed.data;

function envVars() {
    return {
        PORT: env.PORT,
    };
}

export default envVars;
```

> **Note:** Add new env vars by extending `envSchema`. Use `z.string().min(1)` for required strings, `z.string().optional()` for optional ones, `z.coerce.number()` for numbers, and `z.coerce.date()` for dates. The schema is validated once at startup — invalid/missing vars will print a clear error and exit.

---

### 12. Create `api/utils/utils.ts`

```typescript
import { Request, Response } from "express";

export function tryCatch(
    fn: (req: Request, res: Response) => Promise<any>,
    cleanup?: () => Promise<void>
) {
    return async function (req: Request, res: Response) {
        try {
            await fn(req, res);
        } catch (err) {
            console.log(err);
            res.status(500).send({
                success: false,
                data: err?.toString() || "Internal Server Error",
            });
        } finally {
            cleanup && (await cleanup());
        }
    };
}
```

---

### 13. Create `api/middleware.ts`

```typescript
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class Middleware {
    validator(req: Request, res: Response, next: NextFunction) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(200).json({
                success: false,
                data: "Validation error",
                errors: errors.array(),
            });
        } else {
            next();
        }
    }
}

const middleware = new Middleware();
export default middleware;
```

---

### 14. Create `api/debug.ts`

```typescript
export default async function debug() {
    (async () => {
        // debug code here
    })();
}
```

---

### 15. Create `api/server.ts`

```typescript
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
```

---

### 16. Create `.env.local`

```env
PGUSER="postgres"
PGPASSWORD="root"
PGHOST="127.0.0.1"
PGDATABASE="[PROJECT_NAME]_dev"
PGPORT="5432"

PORT="3001"
```

---

### 17. Patterns to follow when adding features

**Adding a new model (scheme)**
- Create `api/schemes/ModelName.ts`
- Use `sequelize` from `api/sequelize.ts` as the connection
- Define attributes with TypeScript types using `Model` from sequelize
- Import and use the model in controllers/services

**Adding a new route**
- Create `api/routes/feature.route.ts` — defines Express Router with endpoints
- Create `api/controllers/feature.controller.ts` — handler functions always wrapped in `tryCatch()`
- Mount in `api/server.ts`: `apiServer.use("/feature", featureRouter)`

**Adding a new background service**
- Create `api/services/feature.service.ts`
- Export a singleton with a `startXxxDaemon()` async method
- Import and call it in `api/server.ts` before the Express server starts

**Response format convention**
```typescript
// success
res.status(200).json({ success: true, data: { ... } });

// error
res.status(200).json({ success: false, data: "Error message" });
```

**Environment variables**
- Always access via `envVars()` from `api/utils/envVars.ts`, never directly from `process.env`
- Add new vars by extending `envSchema` in that file

---

### 18. Run the project

```bash
# Development
npm run dev

# Production
npm start
```

---

## END OF PROMPT
