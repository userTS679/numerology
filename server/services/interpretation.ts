/**
 * Vedic Astrology Interpretation Engine
 * Converts raw chart data into meaningful insights
 */

export interface InterpretationContext {
  name: string;
  gender?: string;
  hasTimeOfBirth: boolean;
  userAge?: number;
}

export interface VedicReading {
  summary: string;
  details: string;
  confidence: 'high' | 'medium' | 'low';
  predictions: any[];
  remedies: any[];
  basis: string;
}

/**
 * Generate Vedic interpretation from chart data
 */
export function generateVedicInterpretation(
  natalChart: any,
  vargaCharts: any,
  dashaData: any,
  context: InterpretationContext
): VedicReading {
  try {
    if (!natalChart) {
      return generateNumerologyOnlyReading(context);
    }

    const { planets, ascendant, houses } = natalChart;
    
    // Analyze key planetary positions
    const moonSign = planets.moon ? Math.floor(planets.moon.longitude / 30) : 0;
    const sunSign = planets.sun ? Math.floor(planets.sun.longitude / 30) : 0;
    const ascendantSign = Math.floor(ascendant / 30);

    // Generate summary based on key factors
    const summary = generateSummary(moonSign, sunSign, ascendantSign, context);
    
    // Generate detailed analysis
    const details = generateDetailedAnalysis(planets, houses, vargaCharts, context);
    
    // Generate predictions
    const predictions = generatePredictions(dashaData, planets, context);
    
    // Generate remedies
    const remedies = generateRemedies(planets, moonSign, context);

    return {
      summary,
      details,
      confidence: context.hasTimeOfBirth ? 'high' : 'medium',
      predictions,
      remedies,
      basis: 'Vedic Astrology + Numerology'
    };

  } catch (error) {
    console.error('Interpretation generation error:', error);
    return generateFallbackReading(context);
  }
}

/**
 * Generate summary based on key chart factors
 */
function generateSummary(moonSign: number, sunSign: number, ascendant: number, context: InterpretationContext): string {
  const signNames = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const moonSignName = signNames[moonSign];
  const traits = getSignTraits(moonSign);

  return `${context.name}, aapka Moon ${moonSignName} mein hai - ${traits.primary}. ${traits.strength} aur ${traits.guidance}.`;
}

/**
 * Get personality traits for zodiac signs
 */
function getSignTraits(signIndex: number): { primary: string; strength: string; guidance: string } {
  const traits = [
    { primary: 'energetic aur leadership qualities', strength: 'quick decisions', guidance: 'patience develop karein' },
    { primary: 'stable aur practical nature', strength: 'reliability', guidance: 'flexibility badhayein' },
    { primary: 'communicative aur versatile', strength: 'adaptability', guidance: 'focus maintain karein' },
    { primary: 'emotional aur caring', strength: 'intuition', guidance: 'boundaries set karein' },
    { primary: 'confident aur creative', strength: 'leadership', guidance: 'ego control karein' },
    { primary: 'analytical aur perfectionist', strength: 'attention to detail', guidance: 'criticism kam karein' },
    { primary: 'balanced aur diplomatic', strength: 'harmony', guidance: 'decisions jaldi lein' },
    { primary: 'intense aur transformative', strength: 'determination', guidance: 'trust issues resolve karein' },
    { primary: 'optimistic aur philosophical', strength: 'wisdom', guidance: 'commitment improve karein' },
    { primary: 'ambitious aur disciplined', strength: 'perseverance', guidance: 'flexibility add karein' },
    { primary: 'innovative aur independent', strength: 'originality', guidance: 'emotional connection badhayein' },
    { primary: 'intuitive aur compassionate', strength: 'empathy', guidance: 'practical approach lein' }
  ];

  return traits[signIndex] || traits[0];
}

/**
 * Generate detailed analysis
 */
function generateDetailedAnalysis(planets: any, houses: any, vargaCharts: any, context: InterpretationContext): string {
  const analyses = [];

  // Career analysis (10th house)
  if (planets.jupiter) {
    const jupiterHouse = Math.floor(planets.jupiter.longitude / 30);
    if (jupiterHouse === 9 || jupiterHouse === 4) { // 10th or 5th house
      analyses.push('Career mein growth expected hai - Jupiter favorable position mein hai');
    }
  }

  // Relationship analysis (7th house)
  if (planets.venus) {
    const venusHouse = Math.floor(planets.venus.longitude / 30);
    if (venusHouse === 6 || venusHouse === 11) { // 7th or 12th house
      analyses.push('Love life mein positive changes aane wale hain');
    }
  }

  // Health analysis (6th house)
  if (planets.mars) {
    const marsHouse = Math.floor(planets.mars.longitude / 30);
    if (marsHouse === 5) { // 6th house
      analyses.push('Health par dhyan dein - regular exercise beneficial hai');
    }
  }

  return analyses.length > 0 ? analyses.join('. ') : 'Aapka chart balanced hai - steady progress expected.';
}

/**
 * Generate predictions based on dasha periods
 */
function generatePredictions(dashaData: any, planets: any, context: InterpretationContext): any[] {
  const predictions = [];

  if (dashaData?.currentMaha) {
    const currentPlanet = dashaData.currentMaha.planet;
    const remainingYears = dashaData.currentMaha.remainingYears;

    predictions.push({
      period: `${currentPlanet} Mahadasha`,
      duration: `${Math.round(remainingYears)} years remaining`,
      prediction: getPlanetaryPrediction(currentPlanet),
      timing: 'Current period',
      probability: 'high'
    });
  }

  // Add general predictions
  predictions.push({
    period: '2025 Q2',
    prediction: 'Career advancement opportunities',
    timing: 'April-June 2025',
    probability: 'medium'
  });

  return predictions;
}

/**
 * Get prediction for planetary period
 */
function getPlanetaryPrediction(planet: string): string {
  const predictions: { [key: string]: string } = {
    'Sun': 'Leadership roles aur recognition milega',
    'Moon': 'Emotional stability aur family happiness',
    'Mars': 'Energy aur courage badhega, property gains possible',
    'Mercury': 'Communication skills improve, business growth',
    'Jupiter': 'Wisdom, wealth aur spiritual growth',
    'Venus': 'Love, creativity aur luxury items',
    'Saturn': 'Hard work se slow but steady progress',
    'Rahu': 'Unexpected opportunities, foreign connections',
    'Ketu': 'Spiritual awakening, detachment from materialism'
  };

  return predictions[planet] || 'Mixed results expected - patience required';
}

/**
 * Generate remedies based on chart
 */
function generateRemedies(planets: any, moonSign: number, context: InterpretationContext): any[] {
  const remedies = [];

  // General remedies based on moon sign
  const moonRemedies = [
    'Surya Namaskar daily - energy boost ke liye',
    'Hanuman Chalisa Tuesday ko - Mars ki strength ke liye',
    'White clothes Monday ko - Moon ki peace ke liye',
    'Donation Thursday ko - Jupiter ki blessings ke liye'
  ];

  remedies.push({
    type: 'Daily Practice',
    remedy: moonRemedies[moonSign % 4],
    duration: 'Daily for 40 days',
    benefit: 'Overall life improvement'
  });

  // Gemstone recommendation
  const gemstones = ['Ruby', 'Pearl', 'Red Coral', 'Emerald', 'Yellow Sapphire', 'Diamond', 'Blue Sapphire'];
  remedies.push({
    type: 'Gemstone',
    remedy: `${gemstones[moonSign % 7]} wear करें`,
    duration: 'After astrological consultation',
    benefit: 'Planetary strength enhancement'
  });

  return remedies;
}

/**
 * Generate reading when only numerology is available
 */
function generateNumerologyOnlyReading(context: InterpretationContext): VedicReading {
  return {
    summary: `${context.name}, time of birth ke bina basic analysis. Complete Kundli ke liye exact time chahiye.`,
    details: 'Numerology-based insights available. Vedic chart ke liye birth time add karein.',
    confidence: 'medium',
    predictions: [{
      period: 'General',
      prediction: 'Name-based energy analysis shows positive traits',
      timing: 'Ongoing',
      probability: 'medium'
    }],
    remedies: [{
      type: 'General',
      remedy: 'Daily meditation aur positive thinking',
      duration: 'Daily practice',
      benefit: 'Mental peace and clarity'
    }],
    basis: 'Numerology Only'
  };
}

/**
 * Generate fallback reading when interpretation fails
 */
function generateFallbackReading(context: InterpretationContext): VedicReading {
  return {
    summary: `${context.name}, aapka chart unique hai. Personal consultation recommended.`,
    details: 'Chart analysis mein technical issue. Manual review required for accurate insights.',
    confidence: 'low',
    predictions: [],
    remedies: [{
      type: 'General',
      remedy: 'Om Gam Ganapataye Namaha - obstacles removal ke liye',
      duration: '108 times daily',
      benefit: 'General protection and success'
    }],
    basis: 'Fallback Analysis'
  };
}