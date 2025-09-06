import { computeNatalChart, computeVargas, computeVimshottariDasa, validateBirthData } from './ephemeris';
import { generateVedicInterpretation } from './interpretation';
import { generateKundliInsight } from './llm-service';
import { db } from '../config/database';
import { kundliCharts, astroReadings } from '@shared/production-schema';
import { logAuditEvent } from './auth-service';

export interface KundliGenerationRequest {
  userId: string;
  profileId: string;
  name: string;
  dateOfBirth: string;
  timeOfBirth?: string;
  placeOfBirth: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender?: string;
}

export interface GeneratedKundli {
  chartId: string;
  natalChart: any;
  vargaCharts: any;
  dashaData: any;
  yogas: any[];
  reading: {
    summary: string;
    details: string;
    confidence: string;
    predictions: any[];
    remedies: any[];
  };
  hasVedicChart: boolean;
}

/**
 * Generate complete Kundli chart and reading
 */
export async function generateKundli(request: KundliGenerationRequest): Promise<GeneratedKundli> {
  try {
    // Validate birth data
    if (!validateBirthData(request.latitude, request.longitude, request.dateOfBirth, request.timeOfBirth || '')) {
      throw new Error('Invalid birth data provided');
    }

    let hasVedicChart = false;
    let natalChart = null;
    let vargaCharts = null;
    let dashaData = null;
    let confidence = 'medium';

    // Generate Vedic chart if time of birth is available
    if (request.timeOfBirth) {
      try {
        natalChart = await computeNatalChart(
          request.latitude,
          request.longitude,
          request.dateOfBirth,
          request.timeOfBirth,
          request.timezone
        );
        
        vargaCharts = computeVargas(natalChart);
        dashaData = computeVimshottariDasa(natalChart.planets.moon.longitude);
        hasVedicChart = true;
        confidence = 'high';
      } catch (error) {
        console.warn('Vedic chart generation failed, using numerology only:', error);
      }
    }

    // Detect yogas (simplified implementation)
    const yogas = detectYogas(natalChart);

    // Generate interpretation
    const interpretation = generateVedicInterpretation(natalChart, vargaCharts, dashaData, {
      name: request.name,
      gender: request.gender,
      hasTimeOfBirth: !!request.timeOfBirth
    });

    // Enhance with AI insights
    let aiEnhancedReading;
    try {
      aiEnhancedReading = await generateKundliInsight(
        interpretation,
        request.name,
        natalChart?.planets?.moon?.nakshatra || 'Unknown'
      );
    } catch (error) {
      console.warn('AI enhancement failed, using rule-based reading:', error);
      aiEnhancedReading = interpretation;
    }

    // Generate chart ID
    const chartId = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, save to database
    console.log('Generated chart for user:', request.userId);

    return {
      chartId,
      natalChart: natalChart || {},
      vargaCharts: vargaCharts || {},
      dashaData: dashaData || {},
      yogas,
      reading: {
        summary: aiEnhancedReading.summary,
        details: aiEnhancedReading.details,
        confidence,
        predictions: aiEnhancedReading.predictions || [],
        remedies: aiEnhancedReading.remedies || [],
      },
      hasVedicChart
    };

  } catch (error) {
    console.error('Kundli generation error:', error);
    throw error;
  }
}

/**
 * Get existing Kundli for user
 */
export async function getUserKundli(userId: string): Promise<GeneratedKundli | null> {
  try {
    // Mock implementation - in production, fetch from database
    const mockKundli: GeneratedKundli = {
      chartId: `chart_${userId}`,
      natalChart: {},
      vargaCharts: {},
      dashaData: {},
      yogas: [],
      reading: {
        summary: 'Your chart shows balanced planetary positions',
        details: 'Strong Jupiter placement indicates good fortune in career',
        confidence: 'high',
        predictions: [],
        remedies: []
      },
      hasVedicChart: true
    };

    return mockKundli;

  } catch (error) {
    console.error('Get Kundli error:', error);
    throw error;
  }
}

/**
 * Detect yogas in natal chart (simplified implementation)
 */
function detectYogas(natalChart: any): any[] {
  if (!natalChart || !natalChart.planets) {
    return [];
  }

  const yogas = [];
  const planets = natalChart.planets;

  // Raj Yoga detection (simplified)
  if (planets.jupiter && planets.venus) {
    const jupiterHouse = Math.floor(planets.jupiter.longitude / 30);
    const venusHouse = Math.floor(planets.venus.longitude / 30);
    
    if (Math.abs(jupiterHouse - venusHouse) <= 1) {
      yogas.push({
        name: 'Gaja Kesari Yoga',
        description: 'Jupiter और Venus का शुभ योग - wealth और wisdom का combination',
        strength: 'medium',
        effects: ['Financial prosperity', 'Good education', 'Respected position']
      });
    }
  }

  // Dhana Yoga detection
  if (planets.sun && planets.mercury) {
    const sunMercuryDistance = Math.abs(planets.sun.longitude - planets.mercury.longitude);
    if (sunMercuryDistance <= 10) {
      yogas.push({
        name: 'Budhaditya Yoga',
        description: 'Sun-Mercury conjunction - intelligence और communication skills',
        strength: 'strong',
        effects: ['Sharp intellect', 'Good communication', 'Leadership abilities']
      });
    }
  }

  return yogas;
}

/**
 * Generate detailed report (premium feature)
 */
export async function generateDetailedReport(
  chartId: string,
  userId: string,
  reportType: 'complete' | 'career' | 'relationship' | 'health' = 'complete'
): Promise<any> {
  try {
    // Mock detailed analysis
    const detailedAnalysis = {
      chartId,
      reportType,
      generatedAt: new Date(),
      sections: {
        personalityAnalysis: {
          title: 'व्यक्तित्व विश्लेषण',
          content: 'Your personality traits based on planetary positions...',
          keyTraits: ['Leadership', 'Creativity', 'Compassion'],
          challenges: ['Impatience', 'Overthinking'],
          recommendations: ['Practice meditation', 'Develop patience']
        },
        careerGuidance: {
          title: 'करियर मार्गदर्शन',
          content: 'Career guidance based on 10th house and D10 chart...',
          suitableCareers: ['Technology', 'Education', 'Healthcare'],
          careerTimings: ['2025-2027: Growth period', '2028-2030: Leadership roles'],
          recommendations: ['Skill development', 'Networking']
        },
        relationshipInsights: {
          title: 'रिश्ते की अंतर्दृष्टि',
          content: 'Relationship patterns based on Venus and 7th house...',
          compatibility: 'High compatibility with earth signs',
          marriageTiming: '2025-2026 favorable for marriage',
          recommendations: ['Open communication', 'Mutual respect']
        }
      }
    };

    console.log('Generated detailed report for user:', userId);
    return detailedAnalysis;

  } catch (error) {
    console.error('Detailed report generation error:', error);
    throw error;
  }
}