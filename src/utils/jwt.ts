import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string, rememberMe: boolean) => {
  const expiresIn = rememberMe ? "30d" : "1d";
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn });
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as {
      userId: string;
      iat: number;
      exp: number;
    };
  } catch (error) {
    return null;
  }
};
