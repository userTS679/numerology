import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateNumerology, calculateCompatibilityScore, calculateAdvancedCompatibility, type AdvancedCompatibilityResult } from "./services/numerology";
import { generateNumerologyInsight, generateCompatibilityInsight, chatWithNumenCoach } from "./services/groq";
import { insertNumerologyReadingSchema, insertCompatibilityAnalysisSchema, insertChatSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Calculate numerology reading
  app.post("/api/numerology/calculate", async (req, res) => {
    try {
      const { fullName, birthDate, birthTime, birthPlace } = req.body;
      
      if (!fullName || !birthDate) {
        return res.status(400).json({ message: "Full name and birth date are required" });
      }
      
      const [year, month, day] = birthDate.split('-').map(Number);
      const calculation = calculateNumerology(fullName, day, month, year);
      
      // Generate AI insights
      const insight = await generateNumerologyInsight(
        calculation.lifePathNumber,
        calculation.expressionNumber,
        calculation.soulUrgeNumber,
        calculation.personalityNumber,
        fullName
      );
      
      // Save reading to storage
      const reading = await storage.createNumerologyReading({
        fullName,
        birthDate,
        birthTime: birthTime || null,
        birthPlace: birthPlace || null,
        lifePathNumber: calculation.lifePathNumber,
        expressionNumber: calculation.expressionNumber,
        soulUrgeNumber: calculation.soulUrgeNumber,
        personalityNumber: calculation.personalityNumber,
        birthdayNumber: calculation.birthdayNumber,
        maturityNumber: calculation.maturityNumber,
        loShuGrid: calculation.loShuGrid,
        pinnacles: calculation.pinnacles,
        challenges: calculation.challenges
      });
      
      res.json({
        reading,
        calculation,
        insight
      });
    } catch (error) {
      console.error("Numerology calculation error:", error);
      res.status(500).json({ message: "Failed to calculate numerology reading" });
    }
  });
  
  // Calculate compatibility
  app.post("/api/compatibility/calculate", async (req, res) => {
    try {
      const { partner1Name, partner1BirthDate, partner2Name, partner2BirthDate } = req.body;
      
      if (!partner1Name || !partner1BirthDate || !partner2Name || !partner2BirthDate) {
        return res.status(400).json({ message: "All partner details are required" });
      }
      
      // Calculate numerology for both partners
      const [year1, month1, day1] = partner1BirthDate.split('-').map(Number);
      const [year2, month2, day2] = partner2BirthDate.split('-').map(Number);
      
      const partner1Calc = calculateNumerology(partner1Name, day1, month1, year1);
      const partner2Calc = calculateNumerology(partner2Name, day2, month2, year2);
      
      // Use advanced compatibility calculation
      const advancedResult = calculateAdvancedCompatibility(
        { ...partner1Calc, name: partner1Name, day: day1, month: month1, year: year1 },
        { ...partner2Calc, name: partner2Name, day: day2, month: month2, year: year2 }
      );
      
      // Generate enhanced AI insights with detailed context
      const detailsContext = Object.values(advancedResult.details).join('. ');
      const insight = await generateCompatibilityInsight(
        { name: partner1Name, lifePathNumber: partner1Calc.lifePathNumber },
        { name: partner2Name, lifePathNumber: partner2Calc.lifePathNumber },
        advancedResult.score,
        detailsContext
      );
      
      const analysis = {
        partner1: partner1Calc,
        partner2: partner2Calc,
        advanced: advancedResult,
        strengths: advancedResult.score > 80 ? 
          ["Deep emotional alignment", "Shared life vision", "Strong compatibility across all areas"] : 
          advancedResult.score > 65 ?
          ["Good foundation for relationship", "Compatible core values", "Growth potential together"] :
          ["Complementary differences", "Learning opportunities", "Conscious effort needed"],
        challenges: advancedResult.score < 70 ? 
          ["Different life approaches", "Need patience and understanding", "Communication key to success"] : 
          ["Minor adjustments in daily habits", "Align long-term goals"],
        insight,
        detailedInsights: advancedResult.details
      };
      
      // Save analysis to storage
      const savedAnalysis = await storage.createCompatibilityAnalysis({
        partner1Name,
        partner1BirthDate,
        partner2Name,
        partner2BirthDate,
        compatibilityScore: advancedResult.score,
        analysis
      });
      
      res.json({
        compatibilityScore: advancedResult.score,
        category: advancedResult.category,
        summary: advancedResult.summary,
        analysis,
        savedAnalysis
      });
    } catch (error) {
      console.error("Compatibility calculation error:", error);
      res.status(500).json({ message: "Failed to calculate compatibility" });
    }
  });
  
  // Chat with NumenCoach
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Get or create chat session
      let session = sessionId ? await storage.getChatSession(sessionId) : null;
      let messages: any[] = [];
      
      if (session) {
        messages = Array.isArray(session.messages) ? session.messages : [];
      }
      
      // Add user message
      messages.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      });
      
      // Get AI response
      const aiResponse = await chatWithNumenCoach(message);
      
      // Add AI response
      messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
      
      // Save or update session
      if (session) {
        session = await storage.updateChatSession(session.id, messages);
      } else {
        session = await storage.createChatSession({ messages });
      }
      
      res.json({
        response: aiResponse,
        sessionId: session?.id,
        messages
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });
  
  // Get numerology reading
  app.get("/api/numerology/:id", async (req, res) => {
    try {
      const reading = await storage.getNumerologyReading(req.params.id);
      if (!reading) {
        return res.status(404).json({ message: "Reading not found" });
      }
      res.json(reading);
    } catch (error) {
      console.error("Get reading error:", error);
      res.status(500).json({ message: "Failed to get reading" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
