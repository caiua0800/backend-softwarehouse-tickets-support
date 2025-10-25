// src/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

// Esta parte permanece igual, para tipar o objeto 'req'
declare global {
  namespace Express {
    export interface Request {
      user?: { userId: string };
    }
  }
}

/**
 * Middleware de autenticação unificado.
 * Verifica a presença de um JWT (AccessToken) no header 'Authorization'.
 * Se não encontrar ou for inválido, tenta autenticar via 'x-api-key'.
 * Se nenhum dos métodos for bem-sucedido, retorna 401 Unauthorized.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // --- TENTATIVA 1: Autenticação via Access Token (JWT) ---
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
        userId: string;
      };
      req.user = payload; // Anexa o usuário à requisição
      return next(); // Autenticado com sucesso via JWT, encerra o middleware
    } catch (err) {
      // Token JWT é inválido ou expirado. Não retornamos erro ainda.
      // Vamos prosseguir para a verificação da API Key.
    }
  }

  // --- TENTATIVA 2: Autenticação via API Key ---
  const apiKey = req.headers["x-api-key"] as string;

  if (apiKey) {
    try {
      const hashedKey = crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");
      const keyExists = await prisma.apiKey.findUnique({
        where: { hashedKey },
      });

      if (keyExists) {
        return next(); // Autenticado com sucesso via API Key
      }
    } catch (dbError) {
      console.error("Erro ao verificar a API Key no banco:", dbError);
      return res.status(500).json({ message: "Erro interno do servidor." });
    }
  }

  // --- FALHA ---
  // Se chegou até aqui, nenhuma forma de autenticação válida foi fornecida.
  return res.status(401).json({
    message:
      "Acesso não autorizado. Forneça um Access Token ou uma API Key válida.",
  });
};

// As funções antigas 'authenticateToken' e 'authenticateApiKey' podem ser removidas.
