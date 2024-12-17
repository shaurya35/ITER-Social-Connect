import { Router } from "express";
import { getMessages } from "../services/firestoreServices";

const router = Router();

router.get("/rooms/:roomId/messages", async (req, res) => {
  try {
    const messages = await getMessages(req.params.roomId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
