import { Request, Response } from "express";
import { tryCatch } from "../utils/utils";
import { signToken } from "../utils/jwt";
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

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

class AuthController {
    redirectToGithub = (req: Request, res: Response) => {
        const params = new URLSearchParams({
            client_id: envVars().GITHUB_CLIENT_ID,
            redirect_uri: envVars().GITHUB_CALLBACK_URL,
            scope: "read:user",
        });

        res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
    };

    githubCallback = tryCatch(async (req: Request, res: Response) => {
        const code = req.query.code as string | undefined;

        if (!code) {
            res.redirect(envVars().FRONTEND_URL);
            return;
        }

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
            res.redirect(envVars().FRONTEND_URL);
            return;
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

        const token = signToken({ id: user.id });
        res.cookie("token", token, COOKIE_OPTIONS);
        res.redirect(envVars().FRONTEND_URL);
    });

    me = tryCatch(async (req: Request, res: Response) => {
        res.status(200).json({ success: true, data: req.user });
    });

    logout = tryCatch(async (req: Request, res: Response) => {
        res.clearCookie("token");
        res.status(200).json({ success: true, data: null });
    });
}

const authController = new AuthController();
export default authController;
