import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes";
import { chatController } from "./controllers/chatControllers";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.json());
app.use("/api/chat", chatRoutes);

chatController(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Chat service running on http://localhost:${PORT}`);
});
