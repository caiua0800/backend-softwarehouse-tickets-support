// src/server.ts

import express from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from 'cors';
import http from "http"; // 1. Importe o módulo http
import { Server } from "socket.io"; // 2. Importe o Server do socket.io
import { setupSocket } from "./lib/socket"; // 3. Importe nosso futuro setup de socket

import authRoutes from "./routes/auth.routes";
import ticketRoutes from "./routes/ticket.routes";

dotenv.config();

const app = express();
const server = http.createServer(app); // 4. Crie um servidor http usando o app Express

// 5. Crie a instância do Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Em produção, restrinja para o seu domínio do frontend
    methods: ["GET", "POST"],
  },
});

// Adiciona a instância do 'io' em todas as requisições para usarmos nos controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

setupSocket(io); // 6. Chame a função que vai configurar a lógica do socket

const PORT = process.env.PORT || 3333;

const whitelist = [
  'http://localhost:5173', 
];

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permite requisições sem 'origin' (como apps mobile, Postman, ou o nosso Electron em produção)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Acesso negado pelo CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

app.get("/", (req, res) => {
  res.send("API Nobel OS está no ar! 🚀");
});

// 7. Use o 'server' para ouvir, não mais o 'app'
server.listen(PORT, () => {
  console.log(`🚀 Servidor e Socket.IO rodando na porta ${PORT}`);
});

// Adicione a propriedade 'io' ao objeto Request do Express
declare global {
  namespace Express {
    export interface Request {
      io: Server;
    }
  }
}
