import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  merchant: text("merchant").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  ecoScore: integer("eco_score").notNull(),
  hasAlternatives: boolean("has_alternatives").notNull().default(false),
  userId: integer("user_id").references(() => users.id)
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Sustainability score schema
export const sustainabilityScores = pgTable("sustainability_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  overallScore: integer("overall_score").notNull(),
  carbonFootprint: real("carbon_footprint").notNull(),
  sustainablePurchases: integer("sustainable_purchases").notNull(),
  waterUsage: real("water_usage").notNull(),
  date: timestamp("date").notNull(),
});

export const insertSustainabilityScoreSchema = createInsertSchema(sustainabilityScores).omit({
  id: true,
});

export type InsertSustainabilityScore = z.infer<typeof insertSustainabilityScoreSchema>;
export type SustainabilityScore = typeof sustainabilityScores.$inferSelect;

// Category breakdown schema
export const categoryBreakdowns = pgTable("category_breakdowns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  ecoScore: integer("eco_score").notNull(),
});

export const insertCategoryBreakdownSchema = createInsertSchema(categoryBreakdowns).omit({
  id: true,
});

export type InsertCategoryBreakdown = z.infer<typeof insertCategoryBreakdownSchema>;
export type CategoryBreakdown = typeof categoryBreakdowns.$inferSelect;

// Recommendation schema
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  potentialImpact: text("potential_impact").notNull(),
  category: text("category").notNull(),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
});

export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;

// CSV upload schema
export const csvUploadSchema = z.object({
  date: z.string(),
  merchant: z.string(),
  category: z.string(),
  amount: z.string()
});

export type CSVRow = z.infer<typeof csvUploadSchema>;
