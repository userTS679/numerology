import Groq from "groq-sdk";
import { readFileSync } from 'fs';
import { join } from 'path';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY not set. LLM features will use fallback responses.");
}

const groqClient: Groq | null = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Response cache to reduce API costs
const responseCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 5 requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

export interface LLMResponse {
  summary: string;
  details: string;
  confidence: string;
  basis: string;
  cta: string;
  disclaimer: string;
}

/**
 * Generate Kundli insight using LLM
 */
export async function generateKundliInsight(
  interpretation: any,
  userName: string,
  moonNakshatra: string,
  userId?: string
): Promise<LLMResponse> {
  try {
    // Check rate limit
    if (userId && !checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Check cache
    const cacheKey = `kundli_${userName}_${moonNakshatra}_${JSON.stringify(interpretation)}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.response;
    }

    if (!groqClient) {
      return generateFallbackResponse(interpretation, userName);
    }

    // Load prompt template
    const promptTemplate = loadPromptTemplate();
    
    // Prepare context
    const context = {
      name: userName,
      nakshatra: moonNakshatra,
      summary: interpretation.summary || 'Balanced chart',
      details: interpretation.details || 'Good planetary positions'
    };

    const prompt = formatPrompt(promptTemplate, context);

    const completion = await groqClient.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    
    // Parse and validate response
    const response = parseAndValidateResponse(rawResponse, userName);
    
    // Cache the response
    responseCache.set(cacheKey, { response, timestamp: Date.now() });
    
    // Update rate limit
    if (userId) {
      updateRateLimit(userId);
    }

    return response;

  } catch (error) {
    console.error('LLM insight generation error:', error);
    return generateFallbackResponse(interpretation, userName);
  }
}

/**
 * Load prompt template from file
 */
function loadPromptTemplate(): string {
  try {
    return readFileSync(join(process.cwd(), 'llm/prompt_templates/groq_kundli_prompt.txt'), 'utf-8');
  } catch (error) {
    console.warn('Prompt template not found, using default');
    return `You are NumenCoach, a warm Vedic astrology guide for Indian users 40+.
Given: Name: {name}, Nakshatra: {nakshatra}, Chart: {summary}
Respond in Hinglish (Hindi+English mix) with exactly this JSON:
{
  "summary": "2-line insight about their life (max 25 words)",
  "details": "Specific guidance with 1 action item (max 20 words)", 
  "confidence": "high/medium/low",
  "basis": "Moon Nakshatra + chart analysis",
  "cta": "Agar detailed report chahiye, ₹299 mein full analysis milega",
  "disclaimer": "Guidance hai, professional advice nahin"
}
Keep total under 50 words. Be encouraging, use cultural examples.`;
  }
}

/**
 * Format prompt with context variables
 */
function formatPrompt(template: string, context: any): string {
  let formatted = template;
  
  Object.entries(context).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), String(value));
  });
  
  return formatted;
}

/**
 * Parse and validate LLM response
 */
function parseAndValidateResponse(rawResponse: string, userName: string): LLMResponse {
  try {
    // Try to extract JSON from response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    const required = ['summary', 'details', 'confidence', 'basis', 'cta', 'disclaimer'];
    for (const field of required) {
      if (!parsed[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate word count (≤50 words total)
    const totalWords = Object.values(parsed).join(' ').split(/\s+/).length;
    if (totalWords > 50) {
      console.warn(`Response too long: ${totalWords} words, truncating`);
      // Truncate details if too long
      parsed.details = parsed.details.split(' ').slice(0, 15).join(' ') + '...';
    }

    // Ensure confidence is valid
    if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
      parsed.confidence = 'medium';
    }

    return parsed as LLMResponse;

  } catch (error) {
    console.error('Response parsing error:', error);
    return generateFallbackResponse({ summary: 'Chart analysis', details: 'Positive indicators' }, userName);
  }
}

/**
 * Generate fallback response when LLM fails
 */
function generateFallbackResponse(interpretation: any, userName: string): LLMResponse {
  return {
    summary: `${userName}, aapka chart mein positive energy hai.`,
    details: 'Patience aur hard work se success milegi. Family support strong hai.',
    confidence: 'medium',
    basis: 'Traditional Vedic principles',
    cta: 'Detailed analysis ke liye ₹299 mein full report available hai',
    disclaimer: 'Ye guidance hai, professional advice nahin'
  };
}

/**
 * Check rate limit for user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = userRequestCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    userRequestCounts.set(userId, { count: 0, resetTime: now + RATE_WINDOW });
    return true;
  }

  return userLimit.count < RATE_LIMIT;
}

/**
 * Update rate limit counter
 */
function updateRateLimit(userId: string): void {
  const userLimit = userRequestCounts.get(userId);
  if (userLimit) {
    userLimit.count++;
  }
}

/**
 * Generate numerology-only reading
 */
function generateNumerologyOnlyReading(context: InterpretationContext): any {
  return {
    summary: `${context.name}, numerology-based analysis available`,
    details: 'Birth time add karke complete Vedic chart banwa sakte hain',
    confidence: 'medium',
    predictions: [],
    remedies: []
  };
}