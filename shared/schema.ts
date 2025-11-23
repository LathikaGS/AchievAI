import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  focusXp: integer("focus_xp").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  completedDates: text("completed_dates").array().notNull().default(sql`ARRAY[]::text[]`),
  xpReward: integer("xp_reward").notNull().default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  username: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(2, "Username must be at least 2 characters"),
});

export const insertHabitSchema = z.object({
  title: z.string().min(1, "Habit title is required"),
  description: z.string().optional(), // optional field for description
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  name: true,
  message: true,
  rating: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  message: z.string().min(1, "Message is required"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// Badge types
export type BadgeType = "bronze" | "silver" | "gold";

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  xpRequired: number;
  earned: boolean;
}

// Chatbot message type
export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}
