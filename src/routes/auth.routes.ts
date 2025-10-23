// src/routes/auth.routes.ts (DEPOIS - A VERSÃO CORRETA)

import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware"; // <-- PASSO 1: Importe o middleware

const router = Router();

router.post("/register", authenticateToken, authController.register); // <-- PASSO 2: Adicione o middleware aqui

router.post("/login", authController.login);

router.post("/refresh", authController.refresh);

router.post("/logout", authController.logout);

export default router;
