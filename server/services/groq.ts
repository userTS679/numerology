import Groq from "groq-sdk";
// ...existing code...

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR;

if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY not set. Groq client will be disabled until a valid key is provided.");
}

const groqClient: Groq | null = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// ...existing code...
export async function generateNumerologyInsight(
  lifePathNumber: number,
  expressionNumber: number,
  soulUrgeNumber: number,
  personalityNumber: number,
  name: string
): Promise<string> {
  if (!groqClient) return "Sorry, insight generation is temporarily unavailable. Admin: GROQ_API_KEY not configured.";

  const prompt = `You are NumenCoach, a warm numerology guide for Indian users 40+. 
Explain in simple Hinglish (Hindi + English mix) what Life Path ${lifePathNumber}, Expression ${expressionNumber}, Soul Urge ${soulUrgeNumber}, and Personality ${personalityNumber} means for ${name}.
Keep response under 70 words, be encouraging, use cultural examples.`;

  try {
    const completion = await groqClient.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || "Unable to generate insight at this time.";
  } catch (error: any) {
    if (error?.status === 401) {
      console.error("Groq API AuthenticationError: Invalid API Key (check GROQ_API_KEY).");
      return "Sorry, insight generation is temporarily unavailable. Admin: invalid Groq API key.";
    }
    console.error("Groq API error:", error);
    return "Sorry, insight generation is temporarily unavailable. Please try again later.";
  }
}

// ...existing code...
export async function generateCompatibilityInsight(
  partner1: { name: string; lifePathNumber: number },
  partner2: { name: string; lifePathNumber: number },
  compatibilityScore: number,
  detailedContext?: string
): Promise<string> {
  if (!groqClient) return "Sorry, compatibility analysis is temporarily unavailable. Admin: GROQ_API_KEY not configured.";

  const prompt = `You are NumenCoach, expert in numerology for Indian couples aged 40+. 

${partner1.name} (Life Path ${partner1.lifePathNumber}) and ${partner2.name} (Life Path ${partner2.lifePathNumber}) have ${compatibilityScore}% compatibility.

Context: ${detailedContext || 'Based on life path numbers'}

Provide specific advice in warm Hinglish focusing on:
- Marriage/relationship harmony 
- Family life और kids
- Financial partnership
- Social compatibility

Keep under 70 words, be encouraging but realistic.`;

  try {
    const completion = await groqClient.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 180,
    });

    return completion.choices[0]?.message?.content || "Unable to generate compatibility insight.";
  } catch (error: any) {
    if (error?.status === 401) {
      console.error("Groq API AuthenticationError: Invalid API Key (check GROQ_API_KEY).");
      return "Sorry, compatibility analysis is temporarily unavailable. Admin: invalid Groq API key.";
    }
    console.error("Groq API error:", error);
    return "Sorry, compatibility analysis is temporarily unavailable.";
  }
}

// ...existing code...
export async function chatWithNumenCoach(message: string, context?: any): Promise<string> {
  if (!groqClient) return "Sorry, chat is temporarily unavailable. Admin: GROQ_API_KEY not configured.";

  const systemPrompt = `You are NumenCoach, a warm and friendly Numerology + Vedic Astrology guide for Indian users (mostly above 40 years). 
You explain numerology and relationships in simple Hinglish (mix of Hindi + English), avoiding jargon. 
You ALWAYS keep answers short, clear, and engaging: no response should exceed 70 words.
Be culturally sensitive and use Indian examples when appropriate.`;

  try {
    const completion = await groqClient.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || "मुझे समझने में थोड़ी difficulty हुई। कृपया दोबारा पूछें।";
  } catch (error: any) {
    if (error?.status === 401) {
      console.error("Groq API AuthenticationError: Invalid API Key (check GROQ_API_KEY).");
      return "Sorry, मैं अभी available नहीं हूं। Admin: invalid Groq API key.";
    }
    console.error("Groq API error:", error);
    return "Sorry, मैं अभी available नहीं हूं। कुछ देर बाद try करें।";
  }
}
