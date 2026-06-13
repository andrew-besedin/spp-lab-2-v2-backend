import { Request, Response } from "express";
import { tryCatch } from "../utils/utils";
import usersService from "../services/users.service";

class UsersController {
    list = tryCatch(async (req: Request, res: Response) => {
        const users = await usersService.list();
        res.status(200).json({ success: true, data: users });
    });
}

const usersController = new UsersController();
export default usersController;
