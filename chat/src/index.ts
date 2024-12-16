// --- Import Required Modules ---
import express, { Application, Request, Response } from "express";

// --- Initialize Express Application ---
const app: Application = express();
const PORT: number = 5000;

// --- Define Routes ---
app.get("/", (req: Request, res: Response): void => {
  res.send("WebSocket Chat Server is running!");
});

// --- Start Server ---
app.listen(PORT, (): void => {
  console.log(`Server is running on port ${PORT}`);
});
