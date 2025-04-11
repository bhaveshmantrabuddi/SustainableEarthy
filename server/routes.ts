import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  csvUploadSchema, 
  insertTransactionSchema, 
  insertSustainabilityScoreSchema 
} from "@shared/schema";
import { parseCSV, CSVParseError } from "./utils/csvParser";
import { processTransactions } from "./utils/sustainabilityCalculator";
import { ZodError } from "zod";

// Default user ID for now (since we're not implementing auth)
const DEFAULT_USER_ID = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  // CSV Upload endpoint
  app.post("/api/upload-csv", async (req: Request, res: Response) => {
    try {
      if (!req.body.csvData) {
        return res.status(400).json({ message: "No CSV data provided" });
      }
      
      // Parse CSV data
      const csvRows = parseCSV(req.body.csvData);
      
      // Process CSV into transactions and calculate sustainability metrics
      const { 
        transactions, 
        sustainabilityScore, 
        categoryBreakdowns 
      } = processTransactions(csvRows, DEFAULT_USER_ID);
      
      // Store transactions
      const savedTransactions = await storage.createTransactions(transactions);
      
      // Store sustainability score
      const savedScore = await storage.createSustainabilityScore(sustainabilityScore);
      
      // Store category breakdowns
      const savedBreakdowns = await storage.createCategoryBreakdowns(categoryBreakdowns);
      
      res.status(200).json({
        message: "CSV data processed successfully",
        transactionsCount: savedTransactions.length,
        sustainabilityScore: savedScore
      });
    } catch (error) {
      if (error instanceof CSVParseError) {
        return res.status(400).json({ 
          message: `CSV parsing error: ${error.message}`, 
          lineNumber: error.lineNumber 
        });
      }
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: `Validation error: ${error.message}`
        });
      }
      
      console.error("Error processing CSV:", error);
      res.status(500).json({ message: "Failed to process CSV data" });
    }
  });
  
  // Get sustainability score
  app.get("/api/sustainability-score", async (req: Request, res: Response) => {
    try {
      const score = await storage.getLatestSustainabilityScore(DEFAULT_USER_ID);
      
      if (!score) {
        return res.status(404).json({ message: "No sustainability score found" });
      }
      
      res.status(200).json(score);
    } catch (error) {
      console.error("Error fetching sustainability score:", error);
      res.status(500).json({ message: "Failed to fetch sustainability score" });
    }
  });
  
  // Get transactions
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      const { category, minScore, maxScore } = req.query;
      let transactions;
      
      if (category) {
        transactions = await storage.getTransactionsByCategory(
          category as string, 
          DEFAULT_USER_ID
        );
      } else if (minScore && maxScore) {
        transactions = await storage.getTransactionsByEcoScore(
          parseInt(minScore as string),
          parseInt(maxScore as string),
          DEFAULT_USER_ID
        );
      } else {
        transactions = await storage.getTransactions(DEFAULT_USER_ID);
      }
      
      res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // Get category breakdowns
  app.get("/api/category-breakdowns", async (req: Request, res: Response) => {
    try {
      const breakdowns = await storage.getCategoryBreakdowns(DEFAULT_USER_ID);
      res.status(200).json(breakdowns);
    } catch (error) {
      console.error("Error fetching category breakdowns:", error);
      res.status(500).json({ message: "Failed to fetch category breakdowns" });
    }
  });
  
  // Get recommendations
  app.get("/api/recommendations", async (req: Request, res: Response) => {
    try {
      const recommendations = await storage.getRecommendations(DEFAULT_USER_ID);
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  
  // Get user info (for profile display)
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(DEFAULT_USER_ID);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userInfo } = user;
      
      res.status(200).json({
        ...userInfo,
        name: "Alex Morgan" // Hardcoded for this example
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ message: "Failed to fetch user info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
