// src/routes/ticket.routes.ts

import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";
// 👇 PASSO 1: Importe apenas o novo middleware 'authenticate'
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// 👇 PASSO 2: Use o middleware 'authenticate' em todas as rotas protegidas.
// A rota /public não é mais necessária, pois a / pode aceitar API Key.
// A rota createWithApiKey também se torna redundante.

// GET para listar todos os tickets (geralmente para um painel admin)
router.get("/", authenticate, ticketController.getAll);

// POST para criar um novo ticket (pode ser por um usuário logado ou via API)
router.post("/", authenticate, ticketController.create);

// GET para buscar um ticket específico por ID
router.get("/:id", authenticate, ticketController.getById);

// POST para adicionar uma mensagem a um ticket (exige um usuário logado)
router.post("/:id/messages", authenticate, ticketController.addMessage);

// GET para buscar tickets de uma plataforma específica (via API Key ou JWT)
router.get(
  "/platform/:platformName",
  authenticate,
  ticketController.getByPlatform
);

export default router;
