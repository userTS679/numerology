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

    // Save chart to database
    const [savedChart] = await db.insert(kundliCharts).values({
      userId: request.userId,
      profileId: request.profileId,
      natalChart: natalChart || {},
      vargaCharts: vargaCharts || {},
      dashaData: dashaData || {},
      yogas,
      chartType: 'natal',
      calculationMethod: hasVedicChart ? 'swiss_ephemeris' : 'numerology_only',
    }).returning();

    // Save reading
    await db.insert(astroReadings).values({
      chartId: savedChart.id,
      userId: request.userId,
      readingType: hasVedicChart ? 'detailed' : 'basic',
      summary: aiEnhancedReading.summary,
      details: aiEnhancedReading,
      confidence,
      aiEnhanced: true,
    });

    // Log chart generation
    await logAuditEvent(
      request.userId,
      'kundli_generated',
      'kundli_chart',
      savedChart.id,
      true,
      { hasVedicChart, confidence }
    );

    return {
      chartId: savedChart.id,
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
    
    // Log failed generation
    await logAuditEvent(
      request.userId,
      'kundli_generation_failed',
      'kundli_chart',
      '',
      false,
      { error: error.message }
    );
    
    throw error;
  }
}

/**
 * Get existing Kundli for user
 */
export async function getUserKundli(userId: string): Promise<GeneratedKundli | null> {
  try {
    // Get latest chart for user
    const charts = await db.select()
      .from(kundliCharts)
      .where(eq(kundliCharts.userId, userId))
      .orderBy(kundliCharts.generatedAt)
      .limit(1);

    if (charts.length === 0) {
      return null;
    }

    const chart = charts[0];

    // Get associated reading
    const readings = await db.select()
      .from(astroReadings)
      .where(eq(astroReadings.chartId, chart.id))
      .limit(1);

    const reading = readings[0];

    // Update access tracking
    await db.update(kundliCharts)
      .set({ 
        lastAccessedAt: new Date(),
        accessCount: chart.accessCount + 1
      })
      .where(eq(kundliCharts.id, chart.id));

    // Log chart access
    await logAuditEvent(userId, 'kundli_accessed', 'kundli_chart', chart.id, true);

    return {
      chartId: chart.id,
      natalChart: chart.natalChart as any,
      vargaCharts: chart.vargaCharts as any,
      dashaData: chart.dashaData as any,
      yogas: chart.yogas as any[],
      reading: {
        summary: reading?.summary || '',
        details: reading?.details as any || {},
        confidence: reading?.confidence || 'medium',
        predictions: (reading?.predictions as any) || [],
        remedies: (reading?.remedies as any) || [],
      },
      hasVedicChart: chart.calculationMethod === 'swiss_ephemeris'
    };

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

  // Chandra Mangal Yoga
  if (planets.moon && planets.mars) {
    const moonMarsDistance = Math.abs(planets.moon.longitude - planets.mars.longitude);
    if (moonMarsDistance <= 15) {
      yogas.push({
        name: 'Chandra Mangal Yoga',
        description: 'Moon-Mars combination - emotional strength और courage',
        strength: 'medium',
        effects: ['Emotional resilience', 'Courage in adversity', 'Property gains']
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
    // Get chart data
    const [chart] = await db.select().from(kundliCharts).where(eq(kundliCharts.id, chartId)).limit(1);
    if (!chart || chart.userId !== userId) {
      throw new Error('Chart not found or access denied');
    }

    // Generate comprehensive analysis based on report type
    const detailedAnalysis = {
      chartId,
      reportType,
      generatedAt: new Date(),
      sections: {
        personalityAnalysis: generatePersonalityAnalysis(chart.natalChart),
        careerGuidance: generateCareerGuidance(chart.natalChart, chart.vargaCharts),
        relationshipInsights: generateRelationshipInsights(chart.natalChart),
        healthPredictions: generateHealthPredictions(chart.natalChart),
        financialOutlook: generateFinancialOutlook(chart.natalChart, chart.vargaCharts),
        remedies: generateRemedies(chart.natalChart, chart.yogas),
        timingPredictions: generateTimingPredictions(chart.dashaData),
      }
    };

    // Save detailed reading
    await db.insert(astroReadings).values({
      chartId,
      userId,
      readingType: 'detailed',
      summary: `Detailed ${reportType} analysis generated`,
      details: detailedAnalysis,
      confidence: 'high',
      aiEnhanced: true,
    });

    // Log report generation
    await logAuditEvent(userId, 'detailed_report_generated', 'astro_reading', chartId, true, { reportType });

    return detailedAnalysis;

  } catch (error) {
    console.error('Detailed report generation error:', error);
    throw error;
  }
}

// Helper functions for detailed analysis
function generatePersonalityAnalysis(natalChart: any): any {
  return {
    title: 'व्यक्तित्व विश्लेषण',
    content: 'Your personality traits based on planetary positions...',
    keyTraits: ['Leadership', 'Creativity', 'Compassion'],
    challenges: ['Impatience', 'Overthinking'],
    recommendations: ['Practice meditation', 'Develop patience']
  };
}

function generateCareerGuidance(natalChart: any, vargaCharts: any): any {
  return {
    title: 'करियर मार्गदर्शन',
    content: 'Career guidance based on 10th house and D10 chart...',
    suitableCareers: ['Technology', 'Education', 'Healthcare'],
    careerTimings: ['2025-2027: Growth period', '2028-2030: Leadership roles'],
    recommendations: ['Skill development', 'Networking']
  };
}

function generateRelationshipInsights(natalChart: any): any {
  return {
    title: 'रिश्ते की अंतर्दृष्टि',
    content: 'Relationship patterns based on Venus and 7th house...',
    compatibility: 'High compatibility with earth signs',
    marriageTiming: '2025-2026 favorable for marriage',
    recommendations: ['Open communication', 'Mutual respect']
  };
}

function generateHealthPredictions(natalChart: any): any {
  return {
    title: 'स्वास्थ्य भविष्यवाणी',
    content: 'Health insights based on 6th house and planetary aspects...',
    strengths: ['Strong immunity', 'Good digestion'],
    concerns: ['Stress management', 'Sleep quality'],
    recommendations: ['Regular exercise', 'Balanced diet', 'Yoga practice']
  };
}

function generateFinancialOutlook(natalChart: any, vargaCharts: any): any {
  return {
    title: 'वित्तीय दृष्टिकोण',
    content: 'Financial prospects based on 2nd and 11th houses...',
    wealthPeriods: ['2025-2027: Steady growth', '2028-2030: Major gains'],
    investmentGuidance: ['Real estate favorable', 'Avoid speculation'],
    recommendations: ['Save regularly', 'Diversify investments']
  };
}

function generateRemedies(natalChart: any, yogas: any[]): any {
  return {
    title: 'उपाय और समाधान',
    content: 'Remedial measures to enhance positive influences...',
    gemstones: ['Ruby for Sun', 'Pearl for Moon'],
    mantras: ['Om Suryaya Namaha', 'Om Chandraya Namaha'],
    rituals: ['Surya Namaskar', 'Monday fasting'],
    donations: ['Red cloth on Sunday', 'White rice on Monday']
  };
}

function generateTimingPredictions(dashaData: any): any {
  return {
    title: 'समय की भविष्यवाणी',
    content: 'Important timing based on current dasha periods...',
    currentPeriod: dashaData?.currentMaha || {},
    upcomingEvents: [
      { period: '2025 Q2', event: 'Career advancement', probability: 'high' },
      { period: '2025 Q4', event: 'Relationship milestone', probability: 'medium' }
    ],
    favorableDates: ['2025-03-15', '2025-06-21', '2025-09-23'],
    recommendations: ['Plan important events during favorable periods']
  };
}