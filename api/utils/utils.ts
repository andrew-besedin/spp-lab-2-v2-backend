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
