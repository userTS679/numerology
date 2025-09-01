import { type User, type InsertUser, type NumerologyReading, type InsertNumerologyReading, type CompatibilityAnalysis, type InsertCompatibilityAnalysis, type ChatSession, type InsertChatSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createNumerologyReading(reading: InsertNumerologyReading): Promise<NumerologyReading>;
  getNumerologyReading(id: string): Promise<NumerologyReading | undefined>;
  
  createCompatibilityAnalysis(analysis: InsertCompatibilityAnalysis): Promise<CompatibilityAnalysis>;
  getCompatibilityAnalysis(id: string): Promise<CompatibilityAnalysis | undefined>;
  
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  updateChatSession(id: string, messages: any[]): Promise<ChatSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private numerologyReadings: Map<string, NumerologyReading>;
  private compatibilityAnalyses: Map<string, CompatibilityAnalysis>;
  private chatSessions: Map<string, ChatSession>;

  constructor() {
    this.users = new Map();
    this.numerologyReadings = new Map();
    this.compatibilityAnalyses = new Map();
    this.chatSessions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createNumerologyReading(insertReading: InsertNumerologyReading): Promise<NumerologyReading> {
    const id = randomUUID();
    const reading: NumerologyReading = { 
      ...insertReading,
      birthTime: insertReading.birthTime || null,
      birthPlace: insertReading.birthPlace || null,
      id, 
      createdAt: new Date() 
    };
    this.numerologyReadings.set(id, reading);
    return reading;
  }

  async getNumerologyReading(id: string): Promise<NumerologyReading | undefined> {
    return this.numerologyReadings.get(id);
  }

  async createCompatibilityAnalysis(insertAnalysis: InsertCompatibilityAnalysis): Promise<CompatibilityAnalysis> {
    const id = randomUUID();
    const analysis: CompatibilityAnalysis = { 
      ...insertAnalysis, 
      id, 
      createdAt: new Date() 
    };
    this.compatibilityAnalyses.set(id, analysis);
    return analysis;
  }

  async getCompatibilityAnalysis(id: string): Promise<CompatibilityAnalysis | undefined> {
    return this.compatibilityAnalyses.get(id);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = { 
      ...insertSession, 
      id, 
      createdAt: new Date() 
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async updateChatSession(id: string, messages: any[]): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(id);
    if (session) {
      session.messages = messages;
      this.chatSessions.set(id, session);
      return session;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
