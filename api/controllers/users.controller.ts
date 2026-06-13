import { Request, Response } from "express";
import { tryCatch } from "../utils/utils";
import User from "../schemes/User";

class UsersController {
    list = tryCatch(async (req: Request, res: Response) => {
        const users = await User.findAll({
            attributes: ["id", "username", "displayName", "avatarUrl"],
            order: [["username", "ASC"]],
        });

        res.status(200).json({ success: true, data: users });
    });
}

const usersController = new UsersController();
export default usersController;
