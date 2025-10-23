import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const createTicketSchema = z.object({
  platformName: z.string().min(1),
  requesterName: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["ATUALIZACAO", "BUG", "URGENTE", "DUVIDA", "OUTRO"]),
  description: z.string().min(1),
  contact: z.string().min(1),
});

export const ticketController = {
  create: async (req: Request, res: Response) => {
    try {
      const ticketData = createTicketSchema.parse(req.body);
      const ticket = await prisma.ticket.create({
        data: {
          ...ticketData,
          userId: req.user?.userId, // Associa o ticket ao usuário logado, se houver
        },
      });
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Dados inválidos", issues: error.format() });
      }
      res.status(500).json({ message: "Erro ao criar ticket." });
    }
  },

  createWithApiKey: async (req: Request, res: Response) => {
    try {
      const ticketData = createTicketSchema.parse(req.body);
      const ticket = await prisma.ticket.create({ data: ticketData });
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Dados inválidos", issues: error.format() });
      }
      res.status(500).json({ message: "Erro ao criar ticket." });
    }
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: parseInt(id) },
        // 👇 A MÁGICA ESTÁ NESTE BLOCO 'INCLUDE' 👇
        include: {
          messages: {
            include: {
              user: {
                // Para cada mensagem, inclua os dados do usuário que a enviou
                select: {
                  id: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc", // Ordena as mensagens da mais antiga para a mais nova
            },
          },
        },
      });

      if (!ticket) {
        return res.status(404).json({ message: "Ticket não encontrado." });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ticket." });
    }
  },

  addMessage: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?.userId;

    if (!text || !userId) {
      return res.status(400).json({
        message: "Texto da mensagem e autenticação são obrigatórios.",
      });
    }

    try {
      const newMessage = await prisma.message.create({
        data: {
          text,
          ticketId: parseInt(id),
          userId,
        },
        include: {
          // Incluímos o usuário para saber quem enviou
          user: {
            select: { id: true, email: true },
          },
        },
      });

      // A MÁGICA ACONTECE AQUI!
      // Emita o evento 'newMessage' para todos na sala daquele ticket
      req.io.to(id).emit("newMessage", newMessage);

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Erro ao adicionar mensagem:", error);
      res.status(500).json({ message: "Erro ao salvar a mensagem." });
    }
  },

  getAll: async (req: Request, res: Response) => {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(tickets);
  },
};
