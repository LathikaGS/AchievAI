import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertHabitSchema, insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Auth middleware
interface AuthRequest extends Request {
  userId?: string;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Signup route
  app.post("/api/signup", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({ ...data, password: hashedPassword });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          focusXp: user.focusXp,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login route
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          focusXp: user.focusXp,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user
  app.get("/api/user/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      if (req.userId !== userId) return res.status(403).json({ message: "Forbidden" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        focusXp: user.focusXp,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------------- Habits routes ----------------
  app.get("/api/habits", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const habits = await storage.getHabitsByUserId(req.userId!);
      res.json(habits);
    } catch (error) {
      console.error("getHabits error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/habits", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const data = insertHabitSchema.parse(req.body);

      // Map UI fields to DB columns
      const habit = await storage.createHabit({
        userId: req.userId!,
        habit_name: data.title,
        frequency: data.description || "", // description goes into frequency for now
      });

      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0].message });
      console.error("createHabit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.patch("/api/habits/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const habit = await storage.getHabit(id);
      if (!habit) return res.status(404).json({ message: "Habit not found" });
      if (habit.userId !== req.userId) return res.status(403).json({ message: "Forbidden" });

      const updated = await storage.updateHabit(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("updateHabit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/habits/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const habit = await storage.getHabit(id);
      if (!habit) return res.status(404).json({ message: "Habit not found" });
      if (habit.userId !== req.userId) return res.status(403).json({ message: "Forbidden" });

      await storage.deleteHabit(id);
      res.status(204).send();
    } catch (error) {
      console.error("deleteHabit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/habits/:id/complete", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const habit = await storage.getHabit(id);
    if (!habit) return res.status(404).json({ message: "Habit not found" });
    if (habit.userId !== req.userId) return res.status(403).json({ message: "Forbidden" });

    const updatedHabit = await storage.completeHabit(id);
    if (!updatedHabit) return res.status(500).json({ message: "Failed to complete habit" });

    res.json({ message: "Habit completed", habit: updatedHabit });
  } catch (error) {
    console.error("completeHabit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



  // Focus XP
  app.post("/api/focus-xp", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { xp } = req.body;
      if (!xp || typeof xp !== "number") return res.status(400).json({ message: "Valid XP amount required" });

      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      await storage.updateUser(req.userId!, { focusXp: user.focusXp + xp });
      res.json({ message: "Focus XP awarded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Feedback
  app.post("/api/feedback", async (req: Request, res: Response) => {
    try {
      const data = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(data);
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Complete a habit



  const httpServer = createServer(app);
  return httpServer;
}
