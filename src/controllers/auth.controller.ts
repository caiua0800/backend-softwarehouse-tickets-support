import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import crypto from "crypto";

export const authController = {
  // Crie um usuário (idealmente, isso deve ser protegido ou usado apenas para setup inicial)
  register: async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email e senha são obrigatórios." });
    }
    const hashedPassword = await hashPassword(password);
    try {
      const user = await prisma.user.create({
        data: { email, password: hashedPassword },
      });
      res
        .status(201)
        .json({ message: `Usuário ${user.email} criado com sucesso!` });
    } catch (error) {
      res.status(409).json({ message: "Email já existe." });
    }
  },

  login: async (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, rememberMe || false);

    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    await prisma.refreshToken.create({
      data: { hashedToken: hashedRefreshToken, userId: user.id },
    });

    res.json({ accessToken, refreshToken });
  },

  refresh: async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    // Verificamos o token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) return res.sendStatus(403); // Token inválido ou expirado

    // Verificamos se o token existe no nosso banco e não foi revogado
    const hashedToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const tokenInDb = await prisma.refreshToken.findFirst({
      where: { hashedToken, revoked: false },
    });
    if (!tokenInDb) return res.sendStatus(403); // Token não encontrado ou revogado

    // Tudo certo, geramos um novo accessToken
    const newAccessToken = generateAccessToken(payload.userId);
    res.json({ accessToken: newAccessToken });
  },

  logout: async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(204); // Sem conteúdo, sem problema

    const hashedToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    await prisma.refreshToken.updateMany({
      where: { hashedToken },
      data: { revoked: true },
    });
    res.sendStatus(204);
  },

  // TODO: Implemente /refresh e /logout
};
