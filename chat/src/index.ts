// --- Import Required Modules ---
import express, { Application, Request, Response } from "express"; 

// --- Initialize Express Application ---
const app: Application = express(); 
const PORT: number = 5000; 

// --- Define Routes ---
app.get("/", (req: Request, res: Response): void => { 
  res.json("Hello World!");
});

// --- Start Server ---
app.listen(PORT, (): void => { 
  console.log(`Server is running on port ${PORT}`);
});
