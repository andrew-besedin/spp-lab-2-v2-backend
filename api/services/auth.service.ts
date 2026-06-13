import envVars from "../utils/envVars";
import User from "../schemes/User";

interface GithubTokenResponse {
    access_token?: string;
    error?: string;
}

interface GithubUser {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
}

class AuthService {
    getGithubAuthorizeUrl(): string {
        const params = new URLSearchParams({
            client_id: envVars().GITHUB_CLIENT_ID,
            redirect_uri: envVars().GITHUB_CALLBACK_URL,
            scope: "read:user",
        });

        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    /**
     * Exchanges a GitHub OAuth code for an access token, fetches the GitHub
     * profile, and upserts the corresponding local User. Returns null if the
     * code or token exchange is invalid.
     */
    async authenticateWithGithubCode(code: string): Promise<User | null> {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: envVars().GITHUB_CLIENT_ID,
                client_secret: envVars().GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: envVars().GITHUB_CALLBACK_URL,
            }),
        });

        const tokenData = (await tokenRes.json()) as GithubTokenResponse;

        if (!tokenData.access_token) {
            return null;
        }

        const userRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: "application/vnd.github+json",
            },
        });

        const ghUser = (await userRes.json()) as GithubUser;

        const [user] = await User.upsert({
            githubId: String(ghUser.id),
            username: ghUser.login,
            displayName: ghUser.name || ghUser.login,
            avatarUrl: ghUser.avatar_url,
        }, { conflictFields: ["githubId"] });

        return user;
    }
}

const authService = new AuthService();
export default authService;
