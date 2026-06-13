/**
 * Finds or creates a test user and prints a valid "token=..." cookie for it,
 * for use with scripts/test-api.ts:
 *
 *   AUTH_COOKIE=$(npx tsx scripts/mint-test-token.ts) npx tsx scripts/test-api.ts
 */
import "dotenv/config";
import sequelize from "../api/sequelize";
import { signToken } from "../api/utils/jwt";
import User from "../api/schemes/User";

async function main() {
    await sequelize.authenticate();

    const [user] = await User.findOrCreate({
        where: { githubId: "test-script-user" },
        defaults: {
            githubId: "test-script-user",
            username: "test-script-user",
            displayName: "Test Script User",
            avatarUrl: "",
        },
    });

    const token = signToken({ id: user.id });
    console.log(`token=${token}`);

    await sequelize.close();
}

main();
