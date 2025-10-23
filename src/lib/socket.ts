// src/lib/socket.ts

import { Server, Socket } from "socket.io";

export const setupSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Quando um cliente entra na página de um ticket, ele se junta a uma "sala"
    socket.on("joinTicketRoom", (ticketId: string) => {
      socket.join(ticketId);
      console.log(`Cliente ${socket.id} entrou na sala do ticket ${ticketId}`);
    });

    // Quando o cliente sai da página, ele sai da sala
    socket.on("leaveTicketRoom", (ticketId: string) => {
      socket.leave(ticketId);
      console.log(`Cliente ${socket.id} saiu da sala do ticket ${ticketId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });
};
