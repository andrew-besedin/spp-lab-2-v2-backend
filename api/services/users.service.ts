import User from "../schemes/User";

class UsersService {
    list() {
        return User.findAll({
            attributes: ["id", "username", "displayName", "avatarUrl"],
            order: [["username", "ASC"]],
        });
    }
}

const usersService = new UsersService();
export default usersService;
