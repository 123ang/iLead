import dotenv from 'dotenv';
dotenv.config();
export const env = {
  port: Number(process.env.PORT || 3003),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  timezone: process.env.TIMEZONE || 'Asia/Kuala_Lumpur',
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
};
