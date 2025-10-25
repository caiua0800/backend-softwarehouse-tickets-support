// src/routes/auth.routes.ts

import { Router } from "express";
import { authController } from "../controllers/auth.controller";
// 👇 PASSO 1: Importe o novo middleware
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// A rota de registro agora também usa o middleware unificado.
// Isso significa que um admin logado (via JWT) ou um sistema (via API key) pode registrar usuários.
router.post("/register", authenticate, authController.register);

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export default router;