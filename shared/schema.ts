import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const numerologyReadings = pgTable("numerology_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  birthDate: text("birth_date").notNull(),
  birthTime: text("birth_time"),
  birthPlace: text("birth_place"),
  lifePathNumber: integer("life_path_number").notNull(),
  expressionNumber: integer("expression_number").notNull(),
  soulUrgeNumber: integer("soul_urge_number").notNull(),
  personalityNumber: integer("personality_number").notNull(),
  birthdayNumber: integer("birthday_number").notNull(),
  maturityNumber: integer("maturity_number").notNull(),
  loShuGrid: jsonb("lo_shu_grid").notNull(),
  pinnacles: jsonb("pinnacles").notNull(),
  challenges: jsonb("challenges").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const compatibilityAnalysis = pgTable("compatibility_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partner1Name: text("partner1_name").notNull(),
  partner1BirthDate: text("partner1_birth_date").notNull(),
  partner2Name: text("partner2_name").notNull(),
  partner2BirthDate: text("partner2_birth_date").notNull(),
  compatibilityScore: integer("compatibility_score").notNull(),
  analysis: jsonb("analysis").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messages: jsonb("messages").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertNumerologyReadingSchema = createInsertSchema(numerologyReadings).omit({
  id: true,
  createdAt: true,
});

export const insertCompatibilityAnalysisSchema = createInsertSchema(compatibilityAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type NumerologyReading = typeof numerologyReadings.$inferSelect;
export type InsertNumerologyReading = z.infer<typeof insertNumerologyReadingSchema>;
export type CompatibilityAnalysis = typeof compatibilityAnalysis.$inferSelect;
export type InsertCompatibilityAnalysis = z.infer<typeof insertCompatibilityAnalysisSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
