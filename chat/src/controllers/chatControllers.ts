import { Server, Socket } from "socket.io";
import { saveMessage, getMessages } from "../services/firestoreServices";

export const chatController = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    socket.on("sendMessage", async (data) => {
      const { roomId, senderId, message } = data;
      const newMessage = await saveMessage(roomId, senderId, message);

      io.to(roomId).emit("receiveMessage", newMessage);
    });

    socket.on("fetchMessages", async (roomId: string, callback: (messages: any[]) => void) => {
      const messages = await getMessages(roomId);
      callback(messages);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
