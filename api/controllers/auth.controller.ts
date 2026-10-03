import { Request, Response } from 'express';
import { tryCatch } from '../utils/utils';
import { signToken } from '../utils/jwt';
import envVars from '../utils/envVars';
import authService from '../services/auth.service';

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

class AuthController {
    redirectToGithub = (req: Request, res: Response) => {
        res.redirect(authService.getGithubAuthorizeUrl());
    };

    githubCallback = tryCatch(async (req: Request, res: Response) => {
        const code = req.query.code as string | undefined;
        const user = code ? await authService.authenticateWithGithubCode(code) : null;

        if (!user) {
            res.redirect(`${envVars().FRONTEND_URL}/login?error=GITHUB_AUTH_FAILED`);
            return;
        }

        const token = signToken({ id: user.id });
        res.cookie('token', token, COOKIE_OPTIONS);
        res.redirect(envVars().FRONTEND_URL);
    });

    me = tryCatch(async (req: Request, res: Response) => {
        res.status(200).json({ success: true, data: req.user });
    });

    logout = tryCatch(async (req: Request, res: Response) => {
        res.clearCookie('token');
        res.status(200).json({ success: true, data: null });
    });
}

const authController = new AuthController();
export default authController;
