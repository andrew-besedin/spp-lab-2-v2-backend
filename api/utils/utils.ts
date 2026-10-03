import { Request, Response } from "express";

export function tryCatch<P = unknown, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown>(
    fn: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response) => Promise<any>,
    cleanup?: () => Promise<void>
) {
    return async function (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response) {
        try {
            await fn(req, res);
        } catch (err) {
            console.log(err);
            res.status(500).send({
                success: false,
                data: "INTERNAL_SERVER_ERROR",
            });
        } finally {
            cleanup && (await cleanup());
        }
    };
}
