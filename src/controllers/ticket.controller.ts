import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
// 👇 CORREÇÃO 1: Importe o enum `Status` gerado pelo Prisma
import { Prisma, Status } from "@prisma/client";

const createTicketSchema = z.object({
  platformName: z.string().min(1),
  requesterName: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["ATUALIZACAO", "BUG", "URGENTE", "DUVIDA", "OUTRO"]),
  description: z.string().min(1),
  contact: z.string().min(1),
});

const getByPlatformSchema = z.object({
  params: z.object({
    platformName: z.string().min(1),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
    // 👇 CORREÇÃO 2: Use z.nativeEnum com o enum do Prisma
    status: z.nativeEnum(Status).optional(),
    searchTerm: z.string().optional(),
  }),
});

export const ticketController = {
  // ... (outros métodos como create, createWithApiKey, etc. permanecem iguais) ...

  getByPlatform: async (req: Request, res: Response) => {
    try {
      // 1. Validação dos parâmetros da URL e Query String
      const {
        params: { platformName },
        query: { page, pageSize, status, searchTerm },
      } = getByPlatformSchema.parse({
        params: req.params,
        query: req.query,
      });

      // 2. Construção dinâmica do filtro (WHERE)
      const where: Prisma.TicketWhereInput = {
        platformName: platformName, // Filtra pela plataforma informada na URL
      };

      // Se um status foi passado, adiciona ao filtro
      if (status) {
        // AGORA ISSO FUNCIONA SEM ERROS!
        // A variável 'status' agora tem o tipo 'Status | undefined'
        where.status = status;
      }

      // Se um termo de busca foi passado, pesquisa no título OU descrição
      if (searchTerm) {
        where.OR = [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ];
      }

      // 3. Executa a contagem total e a busca paginada em paralelo
      const [total, tickets] = await prisma.$transaction([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: { createdAt: "desc" }, // Mais recentes primeiro
        }),
      ]);

      // 4. Retorna os dados formatados com metadados de paginação
      return res.json({
        data: tickets,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Parâmetros de busca inválidos",
          issues: error.format(),
        });
      }
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro ao buscar tickets da plataforma." });
    }
  },

  // ... (Cole o restante dos seus métodos aqui: create, createWithApiKey, getById, addMessage, getAll) ...
  create: async (req: Request, res: Response) => {
    try {
      const ticketData = createTicketSchema.parse(req.body);
      const ticket = await prisma.ticket.create({
        data: {
          ...ticketData,
          userId: req.user?.userId,
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
        include: {
          messages: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
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
          user: {
            select: { id: true, email: true },
          },
        },
      });
      // @ts-ignore
      req.io?.to(id).emit("newMessage", newMessage);
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
