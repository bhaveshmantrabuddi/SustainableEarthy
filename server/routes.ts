import type { Express, Request, Response, NextFunction } from "express";
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
import { setupAuth } from "./auth";

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // CSV Upload endpoint
  app.post("/api/upload-csv", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.body.csvData) {
        return res.status(400).json({ message: "No CSV data provided" });
      }
      
      // Parse CSV data
      const csvRows = parseCSV(req.body.csvData);
      
      // Get user ID from authenticated session
      const userId = req.user!.id;
      
      // Process CSV into transactions and calculate sustainability metrics
      const { 
        transactions, 
        sustainabilityScore, 
        categoryBreakdowns 
      } = processTransactions(csvRows, userId);
      
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
  app.get("/api/sustainability-score", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const score = await storage.getLatestSustainabilityScore(userId);
      
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
  app.get("/api/transactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { category, minScore, maxScore } = req.query;
      let transactions;
      
      if (category) {
        transactions = await storage.getTransactionsByCategory(
          category as string, 
          userId
        );
      } else if (minScore && maxScore) {
        transactions = await storage.getTransactionsByEcoScore(
          parseInt(minScore as string),
          parseInt(maxScore as string),
          userId
        );
      } else {
        transactions = await storage.getTransactions(userId);
      }
      
      res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // Get category breakdowns
  app.get("/api/category-breakdowns", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const breakdowns = await storage.getCategoryBreakdowns(userId);
      res.status(200).json(breakdowns);
    } catch (error) {
      console.error("Error fetching category breakdowns:", error);
      res.status(500).json({ message: "Failed to fetch category breakdowns" });
    }
  });
  
  // Get recommendations
  app.get("/api/recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const recommendations = await storage.getRecommendations(userId);
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
