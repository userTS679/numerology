import { db } from '../config/database';
import { compatibilityAnalysis, kundliCharts, userProfiles } from '@shared/production-schema';
import { eq } from 'drizzle-orm';
import { calculateAdvancedCompatibility } from './numerology';
import { generateCompatibilityInsight } from './groq';
import { logAuditEvent } from './auth-service';
import { encryptPII, decryptPII } from './security';

export interface CompatibilityRequest {
  user1Id: string;
  partner2Name: string;
  partner2DateOfBirth: string;
  partner2TimeOfBirth?: string;
  partner2PlaceOfBirth: string;
  partner2Latitude?: number;
  partner2Longitude?: number;
  partner2Gender?: string;
}

export interface CompatibilityResult {
  analysisId: string;
  overallScore: number;
  category: string;
  summary: string;
  categoryScores: {
    love: number;
    marriage: number;
    career: number;
    family: number;
    financial: number;
    spiritual: number;
    communication: number;
    lifestyle: number;
  };
  detailedAnalysis: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
    timing: any;
  };
  aiInsight: string;
}

/**
 * Analyze compatibility between two people
 */
export async function analyzeCompatibility(request: CompatibilityRequest): Promise<CompatibilityResult> {
  try {
    // Get user1's profile and chart
    const [user1Profile] = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, request.user1Id))
      .limit(1);

    if (!user1Profile) {
      throw new Error('User profile not found');
    }

    const [user1Chart] = await db.select()
      .from(kundliCharts)
      .where(eq(kundliCharts.userId, request.user1Id))
      .limit(1);

    // Decrypt user1's birth data
    const user1BirthData = {
      name: user1Profile.userId, // Would get from users table
      dateOfBirth: decryptPII(user1Profile.dateOfBirth),
      timeOfBirth: user1Profile.timeOfBirth ? decryptPII(user1Profile.timeOfBirth) : null,
      placeOfBirth: decryptPII(user1Profile.placeOfBirth),
    };

    // Parse birth dates
    const [year1, month1, day1] = user1BirthData.dateOfBirth.split('-').map(Number);
    const [year2, month2, day2] = request.partner2DateOfBirth.split('-').map(Number);

    // Calculate numerology for both
    const { calculateNumerology } = await import('./numerology');
    
    const person1Calc = calculateNumerology(user1BirthData.name, day1, month1, year1);
    const person2Calc = calculateNumerology(request.partner2Name, day2, month2, year2);

    // Advanced compatibility analysis
    const advancedResult = calculateAdvancedCompatibility(
      { ...person1Calc, name: user1BirthData.name, day: day1, month: month1, year: year1 },
      { ...person2Calc, name: request.partner2Name, day: day2, month: month2, year: year2 }
    );

    // Generate category-wise scores
    const categoryScores = generateCategoryScores(person1Calc, person2Calc, user1Chart?.natalChart);

    // Generate detailed analysis
    const detailedAnalysis = generateDetailedCompatibilityAnalysis(
      person1Calc,
      person2Calc,
      categoryScores,
      user1Chart?.natalChart
    );

    // Get AI-enhanced insights
    let aiInsight = '';
    try {
      aiInsight = await generateCompatibilityInsight(
        { name: user1BirthData.name, lifePathNumber: person1Calc.lifePathNumber },
        { name: request.partner2Name, lifePathNumber: person2Calc.lifePathNumber },
        advancedResult.score,
        advancedResult.summary
      );
    } catch (error) {
      console.warn('AI insight generation failed:', error);
      aiInsight = generateFallbackInsight(advancedResult.score);
    }

    // Save analysis to database
    const [savedAnalysis] = await db.insert(compatibilityAnalysis).values({
      user1Id: request.user1Id,
      chart1Id: user1Chart?.id,
      partner2Name: request.partner2Name,
      partner2BirthData: {
        dateOfBirth: encryptPII(request.partner2DateOfBirth),
        timeOfBirth: request.partner2TimeOfBirth ? encryptPII(request.partner2TimeOfBirth) : null,
        placeOfBirth: encryptPII(request.partner2PlaceOfBirth),
        latitude: request.partner2Latitude,
        longitude: request.partner2Longitude,
        gender: request.partner2Gender,
      },
      overallScore: advancedResult.score,
      categoryScores,
      detailedAnalysis,
      analysisType: 'comprehensive',
      methodUsed: 'vedic_numerology_combined',
    }).returning();

    // Log compatibility analysis
    await logAuditEvent(
      request.user1Id,
      'compatibility_analyzed',
      'compatibility_analysis',
      savedAnalysis.id,
      true,
      { score: advancedResult.score, method: 'comprehensive' }
    );

    return {
      analysisId: savedAnalysis.id,
      overallScore: advancedResult.score,
      category: advancedResult.category,
      summary: advancedResult.summary,
      categoryScores,
      detailedAnalysis,
      aiInsight
    };

  } catch (error) {
    console.error('Compatibility analysis error:', error);
    
    // Log failed analysis
    await logAuditEvent(
      request.user1Id,
      'compatibility_analysis_failed',
      'compatibility_analysis',
      '',
      false,
      { error: error.message }
    );
    
    throw error;
  }
}

/**
 * Generate category-wise compatibility scores
 */
function generateCategoryScores(person1: any, person2: any, vedicChart?: any): any {
  const baseScore = 1 - Math.abs(person1.lifePathNumber - person2.lifePathNumber) / 8;
  
  return {
    love: Math.round((baseScore + (1 - Math.abs(person1.soulUrgeNumber - person2.soulUrgeNumber) / 8)) * 50),
    marriage: Math.round((baseScore + (1 - Math.abs(person1.expressionNumber - person2.expressionNumber) / 8)) * 50),
    career: Math.round((1 - Math.abs(person1.expressionNumber - person2.expressionNumber) / 8) * 100),
    family: Math.round((1 - Math.abs(person1.personalityNumber - person2.personalityNumber) / 8) * 100),
    financial: Math.round((baseScore + 0.1) * 100),
    spiritual: Math.round((1 - Math.abs(person1.soulUrgeNumber - person2.soulUrgeNumber) / 8) * 100),
    communication: Math.round((1 - Math.abs(person1.personalityNumber - person2.personalityNumber) / 8) * 100),
    lifestyle: Math.round((1 - Math.abs(person1.birthdayNumber - person2.birthdayNumber) / 8) * 100)
  };
}

/**
 * Generate detailed compatibility analysis
 */
function generateDetailedCompatibilityAnalysis(person1: any, person2: any, categoryScores: any, vedicChart?: any): any {
  const strengths = [];
  const challenges = [];
  const recommendations = [];

  // Analyze strengths
  if (categoryScores.love > 80) {
    strengths.push('Deep emotional connection और mutual understanding');
  }
  if (categoryScores.marriage > 75) {
    strengths.push('Strong foundation for long-term commitment');
  }
  if (categoryScores.communication > 70) {
    strengths.push('Excellent communication और shared interests');
  }

  // Analyze challenges
  if (categoryScores.career < 60) {
    challenges.push('Different career priorities - compromise जरूरी है');
  }
  if (categoryScores.financial < 65) {
    challenges.push('Money management पर अलग views - planning करें');
  }
  if (categoryScores.lifestyle < 70) {
    challenges.push('Lifestyle preferences में difference - balance बनाएं');
  }

  // Generate recommendations
  recommendations.push('Regular communication और mutual respect maintain करें');
  recommendations.push('Shared goals बनाएं और together work करें');
  
  if (categoryScores.spiritual > 75) {
    recommendations.push('Spiritual practices together करें - meditation या prayer');
  }

  return {
    strengths: strengths.length > 0 ? strengths : ['Unique compatibility pattern - conscious effort से strong bond बना सकते हैं'],
    challenges: challenges.length > 0 ? challenges : ['Minor adjustments needed for perfect harmony'],
    recommendations,
    timing: {
      favorablePeriods: ['2025 Q2', '2025 Q4'],
      cautionPeriods: ['2025 Q3'],
      bestDaysForImportantDecisions: ['Thursdays', 'Fridays']
    }
  };
}

/**
 * Get user's compatibility history
 */
export async function getCompatibilityHistory(userId: string): Promise<any[]> {
  try {
    const analyses = await db.select()
      .from(compatibilityAnalysis)
      .where(eq(compatibilityAnalysis.user1Id, userId))
      .orderBy(desc(compatibilityAnalysis.createdAt))
      .limit(10);

    return analyses.map(analysis => ({
      id: analysis.id,
      partnerName: analysis.partner2Name,
      score: analysis.overallScore,
      category: getCategoryFromScore(analysis.overallScore),
      analyzedAt: analysis.createdAt,
      summary: `${analysis.overallScore}% compatibility`
    }));

  } catch (error) {
    console.error('Get compatibility history error:', error);
    throw error;
  }
}

/**
 * Generate fallback insight when AI fails
 */
function generateFallbackInsight(score: number): string {
  if (score >= 85) {
    return 'Excellent match! आप दोनों के stars perfectly aligned हैं। Marriage के लिए very auspicious time है।';
  } else if (score >= 70) {
    return 'Good compatibility! थोड़ी understanding और patience से perfect relationship बन सकती है।';
  } else if (score >= 55) {
    return 'Average match. Communication और mutual respect से relationship को improve कर सकते हैं।';
  } else {
    return 'Challenging compatibility. Extra effort और understanding की जरूरत है successful relationship के लिए।';
  }
}

/**
 * Get category from compatibility score
 */
function getCategoryFromScore(score: number): string {
  if (score >= 85) return 'Excellent Match ❤️';
  if (score >= 70) return 'Good Match 💕';
  if (score >= 55) return 'Average Match 🤝';
  return 'Challenging Match ⚠️';
}