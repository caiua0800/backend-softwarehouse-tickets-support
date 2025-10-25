import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";
import {
  authenticateApiKey,
  authenticateToken,
} from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticateToken, ticketController.getAll);
router.post("/public", authenticateApiKey, ticketController.createWithApiKey);
router.post("/", authenticateToken, ticketController.create);
router.get("/:id", authenticateToken, ticketController.getById);
router.post('/:id/messages', authenticateToken, ticketController.addMessage);
router.get(
  "/platform/:platformName",
  authenticateApiKey,
  ticketController.getByPlatform
);

export default router;
