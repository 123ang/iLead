import bcrypt from "bcryptjs";

const ROUNDS = 12;

export const hashPassword = (value) => bcrypt.hash(value, ROUNDS);
export const comparePassword = (value, hash) => bcrypt.compare(value, hash);

export const generateTemporaryPassword = () => "iLead2026!";
