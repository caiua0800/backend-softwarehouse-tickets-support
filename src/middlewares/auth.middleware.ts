import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

// Adicionando a propriedade 'user' ao objeto Request do Express
declare global {
  namespace Express {
    export interface Request {
      user?: { userId: string };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, payload) => {
    if (err) return res.sendStatus(403); // Token inválido ou expirado
    req.user = payload as { userId: string };
    next();
  });
};

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] as string;
  if (!apiKey)
    return res.status(401).json({ message: "API Key não fornecida." });

  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  const keyExists = await prisma.apiKey.findUnique({ where: { hashedKey } });

  if (!keyExists) return res.status(403).json({ message: "API Key inválida." });

  next();
};
