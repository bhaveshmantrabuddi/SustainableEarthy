import { 
  users, 
  type User, 
  type InsertUser, 
  transactions,
  type Transaction,
  type InsertTransaction,
  sustainabilityScores,
  type SustainabilityScore,
  type InsertSustainabilityScore,
  categoryBreakdowns,
  type CategoryBreakdown,
  type InsertCategoryBreakdown,
  recommendations,
  type Recommendation,
  type InsertRecommendation
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  getTransactions(userId?: number): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  getTransactionsByCategory(category: string, userId?: number): Promise<Transaction[]>;
  getTransactionsByEcoScore(minScore: number, maxScore: number, userId?: number): Promise<Transaction[]>;
  
  // Sustainability score methods
  getSustainabilityScores(userId?: number): Promise<SustainabilityScore[]>;
  getLatestSustainabilityScore(userId?: number): Promise<SustainabilityScore | undefined>;
  createSustainabilityScore(score: InsertSustainabilityScore): Promise<SustainabilityScore>;
  
  // Category breakdown methods
  getCategoryBreakdowns(userId?: number): Promise<CategoryBreakdown[]>;
  createCategoryBreakdown(breakdown: InsertCategoryBreakdown): Promise<CategoryBreakdown>;
  createCategoryBreakdowns(breakdowns: InsertCategoryBreakdown[]): Promise<CategoryBreakdown[]>;
  
  // Recommendation methods
  getRecommendations(userId?: number): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private sustainabilityScores: Map<number, SustainabilityScore>;
  private categoryBreakdowns: Map<number, CategoryBreakdown>;
  private recommendations: Map<number, Recommendation>;
  
  currentUserId: number;
  currentTransactionId: number;
  currentScoreId: number;
  currentBreakdownId: number;
  currentRecommendationId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.sustainabilityScores = new Map();
    this.categoryBreakdowns = new Map();
    this.recommendations = new Map();
    
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentScoreId = 1;
    this.currentBreakdownId = 1;
    this.currentRecommendationId = 1;
    
    // Initialize with a default user
    this.createUser({
      username: "alex@example.com",
      password: "password123"
    });
    
    // Initialize with some default recommendations
    this.createRecommendation({
      userId: 1,
      title: "Switch to Local Farmers Market",
      description: "Based on your Whole Foods purchases, switching to a local farmers market could significantly reduce your carbon footprint.",
      icon: "ri-recycle-line",
      potentialImpact: "High",
      category: "Groceries"
    });
    
    this.createRecommendation({
      userId: 1,
      title: "Try Public Transportation",
      description: "Your Uber trips could be replaced with public transit options that significantly reduce your transportation footprint.",
      icon: "ri-car-line",
      potentialImpact: "High",
      category: "Transportation"
    });
    
    this.createRecommendation({
      userId: 1,
      title: "Sustainable Fashion Brands",
      description: "Consider these sustainable clothing brands instead of H&M to reduce your fashion carbon footprint by up to 70%.",
      icon: "ri-t-shirt-line",
      potentialImpact: "High",
      category: "Shopping"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Transaction methods
  async getTransactions(userId?: number): Promise<Transaction[]> {
    if (userId) {
      return Array.from(this.transactions.values()).filter(
        (tx) => tx.userId === userId,
      );
    }
    return Array.from(this.transactions.values());
  }
  
  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { ...insertTransaction, id };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async createTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    return Promise.all(insertTransactions.map(tx => this.createTransaction(tx)));
  }
  
  async getTransactionsByCategory(category: string, userId?: number): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(
      (tx) => tx.category === category,
    );
    
    if (userId) {
      transactions = transactions.filter(tx => tx.userId === userId);
    }
    
    return transactions;
  }
  
  async getTransactionsByEcoScore(minScore: number, maxScore: number, userId?: number): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(
      (tx) => tx.ecoScore >= minScore && tx.ecoScore <= maxScore,
    );
    
    if (userId) {
      transactions = transactions.filter(tx => tx.userId === userId);
    }
    
    return transactions;
  }
  
  // Sustainability score methods
  async getSustainabilityScores(userId?: number): Promise<SustainabilityScore[]> {
    if (userId) {
      return Array.from(this.sustainabilityScores.values()).filter(
        (score) => score.userId === userId,
      );
    }
    return Array.from(this.sustainabilityScores.values());
  }
  
  async getLatestSustainabilityScore(userId?: number): Promise<SustainabilityScore | undefined> {
    const scores = await this.getSustainabilityScores(userId);
    if (scores.length === 0) return undefined;
    
    return scores.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
  }
  
  async createSustainabilityScore(insertScore: InsertSustainabilityScore): Promise<SustainabilityScore> {
    const id = this.currentScoreId++;
    const score: SustainabilityScore = { ...insertScore, id };
    this.sustainabilityScores.set(id, score);
    return score;
  }
  
  // Category breakdown methods
  async getCategoryBreakdowns(userId?: number): Promise<CategoryBreakdown[]> {
    if (userId) {
      return Array.from(this.categoryBreakdowns.values()).filter(
        (bd) => bd.userId === userId,
      );
    }
    return Array.from(this.categoryBreakdowns.values());
  }
  
  async createCategoryBreakdown(insertBreakdown: InsertCategoryBreakdown): Promise<CategoryBreakdown> {
    const id = this.currentBreakdownId++;
    const breakdown: CategoryBreakdown = { ...insertBreakdown, id };
    this.categoryBreakdowns.set(id, breakdown);
    return breakdown;
  }
  
  async createCategoryBreakdowns(insertBreakdowns: InsertCategoryBreakdown[]): Promise<CategoryBreakdown[]> {
    return Promise.all(insertBreakdowns.map(bd => this.createCategoryBreakdown(bd)));
  }
  
  // Recommendation methods
  async getRecommendations(userId?: number): Promise<Recommendation[]> {
    if (userId) {
      return Array.from(this.recommendations.values()).filter(
        (rec) => rec.userId === userId,
      );
    }
    return Array.from(this.recommendations.values());
  }
  
  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const id = this.currentRecommendationId++;
    const recommendation: Recommendation = { ...insertRecommendation, id };
    this.recommendations.set(id, recommendation);
    return recommendation;
  }
}

export const storage = new MemStorage();
