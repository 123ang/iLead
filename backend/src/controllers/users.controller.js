import * as userService from "../services/user.service.js";

export const listUsers = async (req, res) => res.json(await userService.listUsers());
