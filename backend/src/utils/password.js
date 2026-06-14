import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const ROUNDS = 12;

export const hashPassword = (value) => bcrypt.hash(value, ROUNDS);
export const comparePassword = (value, hash) => bcrypt.compare(value, hash);

export const generateTemporaryPassword = () =>
  `${crypto.randomBytes(15).toString("base64url")}aA1!`;
