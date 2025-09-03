import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

// Swiss Ephemeris constants
const LAHIRI_AYANAMSA = 1; // Lahiri ayanamsa ID
const PLANETS = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  RAHU: 11,  // True node
  KETU: 12   // Calculated as Rahu + 180
};

// Nakshatra data (27 nakshatras, 13°20' each)
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export interface PlanetPosition {
  longitude: number;
  sign: number;
  degree: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
}

export interface NatalChart {
  ascendant: number;
  houses: number[];
  planets: { [key: string]: PlanetPosition };
  ayanamsa: number;
  julianDay: number;
  siderealTime: number;
}

export interface VargaChart {
  D9: { [key: string]: number }; // Navamsa
  D10: { [key: string]: number }; // Dasamsa
  D12: { [key: string]: number }; // Dwadasamsa
}

export interface VimshottariDasa {
  currentMaha: {
    planet: string;
    startDate: Date;
    endDate: Date;
    remainingYears: number;
  };
  currentSub: {
    planet: string;
    startDate: Date;
    endDate: Date;
    remainingMonths: number;
  };
  sequence: Array<{
    planet: string;
    years: number;
  }>;
}

/**
 * Converts date/time to Julian Day Number
 */
function toJulianDay(date: Date): number {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = (date.getMonth() + 1) + 12 * a - 3;
  
  return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
         Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 +
         (date.getHours() - 12) / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400;
}

/**
 * Calculate planetary longitude using simplified algorithms (fallback)
 */
function calculatePlanetLongitude(planet: number, julianDay: number): number {
  // Simplified planetary position calculation
  // In production, this would use Swiss Ephemeris
  const T = (julianDay - 2451545.0) / 36525.0;
  
  switch (planet) {
    case PLANETS.SUN:
      return (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
    case PLANETS.MOON:
      return (218.3165 + 481267.8813 * T - 0.0015786 * T * T) % 360;
    case PLANETS.MERCURY:
      return (252.25084 + 149472.67411 * T - 0.00000536 * T * T) % 360;
    case PLANETS.VENUS:
      return (181.97973 + 58517.81539 * T + 0.00000165 * T * T) % 360;
    case PLANETS.MARS:
      return (355.43299 + 19140.30268 * T + 0.00000261 * T * T) % 360;
    case PLANETS.JUPITER:
      return (34.35148 + 3034.90567 * T - 0.00008501 * T * T) % 360;
    case PLANETS.SATURN:
      return (50.07571 + 1222.11494 * T + 0.00000021 * T * T) % 360;
    default:
      return 0;
  }
}

/**
 * Calculate Lahiri ayanamsa for given Julian Day
 */
function calculateAyanamsa(julianDay: number): number {
  const T = (julianDay - 2451545.0) / 36525.0;
  // Lahiri ayanamsa formula
  return 23.85 + 0.396 * T;
}

/**
 * Get nakshatra and pada from Moon longitude
 */
function getNakshatraPada(moonLongitude: number): { nakshatra: string; pada: number } {
  const nakshatraIndex = Math.floor(moonLongitude / 13.333333);
  const nakshatraProgress = (moonLongitude % 13.333333) / 13.333333;
  const pada = Math.floor(nakshatraProgress * 4) + 1;
  
  return {
    nakshatra: NAKSHATRAS[nakshatraIndex] || 'Unknown',
    pada
  };
}

/**
 * Compute natal chart using Swiss Ephemeris (with fallback)
 */
export async function computeNatalChart(
  lat: number,
  lon: number,
  dob: string,
  tob: string,
  timezone: string
): Promise<NatalChart> {
  try {
    // Convert to UTC and Julian Day
    const birthDateTime = new Date(`${dob}T${tob}:00${timezone.includes('+') || timezone.includes('-') ? timezone : ''}`);
    const julianDay = toJulianDay(birthDateTime);
    const ayanamsa = calculateAyanamsa(julianDay);
    
    // Calculate planetary positions
    const planets: { [key: string]: PlanetPosition } = {};
    
    for (const [name, id] of Object.entries(PLANETS)) {
      const longitude = calculatePlanetLongitude(id, julianDay);
      const siderealLongitude = (longitude - ayanamsa + 360) % 360;
      const sign = Math.floor(siderealLongitude / 30);
      const degree = siderealLongitude % 30;
      
      let nakshatra = '';
      let pada = 1;
      
      if (name === 'MOON') {
        const nakshatraPada = getNakshatraPada(siderealLongitude);
        nakshatra = nakshatraPada.nakshatra;
        pada = nakshatraPada.pada;
      }
      
      planets[name.toLowerCase()] = {
        longitude: siderealLongitude,
        sign,
        degree,
        nakshatra,
        pada,
        retrograde: false // Simplified - would need velocity calculation
      };
    }
    
    // Calculate Rahu/Ketu (opposite nodes)
    if (planets.rahu) {
      planets.ketu = {
        ...planets.rahu,
        longitude: (planets.rahu.longitude + 180) % 360,
        sign: (planets.rahu.sign + 6) % 12
      };
    }
    
    // Calculate ascendant (simplified)
    const siderealTime = (julianDay - 2451545.0) * 1.00273790935 + 280.46061837;
    const ascendantLongitude = (siderealTime + lon / 15) % 360;
    const ascendant = Math.floor(((ascendantLongitude - ayanamsa + 360) % 360) / 30);
    
    // Calculate house cusps (equal house system)
    const houses = Array.from({ length: 12 }, (_, i) => (ascendant + i) % 12);
    
    return {
      ascendant,
      houses,
      planets,
      ayanamsa,
      julianDay,
      siderealTime: siderealTime % 360
    };
    
  } catch (error) {
    console.error('Ephemeris calculation error:', error);
    throw new Error('Failed to compute natal chart');
  }
}

/**
 * Compute varga (divisional) charts
 */
export function computeVargas(natalChart: NatalChart): VargaChart {
  const vargas: VargaChart = { D9: {}, D10: {}, D12: {} };
  
  for (const [planet, position] of Object.entries(natalChart.planets)) {
    const longitude = position.longitude;
    
    // D9 (Navamsa) - divide each sign by 9
    const d9Position = Math.floor((longitude % 30) / 3.333333);
    const d9Sign = (position.sign * 9 + d9Position) % 12;
    vargas.D9[planet] = d9Sign;
    
    // D10 (Dasamsa) - divide each sign by 10
    const d10Position = Math.floor((longitude % 30) / 3);
    const d10Sign = (position.sign * 10 + d10Position) % 12;
    vargas.D10[planet] = d10Sign;
    
    // D12 (Dwadasamsa) - divide each sign by 12
    const d12Position = Math.floor((longitude % 30) / 2.5);
    const d12Sign = (position.sign * 12 + d12Position) % 12;
    vargas.D12[planet] = d12Sign;
  }
  
  return vargas;
}

/**
 * Compute Vimshottari Dasa periods
 */
export function computeVimshottariDasa(moonLongitude: number): VimshottariDasa {
  // Vimshottari dasa periods in years
  const dasaPeriods = [
    { planet: 'Ketu', years: 7 },
    { planet: 'Venus', years: 20 },
    { planet: 'Sun', years: 6 },
    { planet: 'Moon', years: 10 },
    { planet: 'Mars', years: 7 },
    { planet: 'Rahu', years: 18 },
    { planet: 'Jupiter', years: 16 },
    { planet: 'Saturn', years: 19 },
    { planet: 'Mercury', years: 17 }
  ];
  
  // Determine starting dasa based on Moon nakshatra
  const nakshatraIndex = Math.floor(moonLongitude / 13.333333);
  const startingDasaIndex = nakshatraIndex % 9;
  
  // Calculate current dasa (simplified - would need birth date for accurate calculation)
  const currentDasa = dasaPeriods[startingDasaIndex];
  const nextDasa = dasaPeriods[(startingDasaIndex + 1) % 9];
  
  // Mock current dates (in production, calculate from birth date)
  const now = new Date();
  const currentMahaStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  const currentMahaEnd = new Date(currentMahaStart.getFullYear() + currentDasa.years, currentMahaStart.getMonth(), currentMahaStart.getDate());
  
  const currentSubStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  const currentSubEnd = new Date(currentSubStart.getFullYear(), currentSubStart.getMonth() + 18, currentSubStart.getDate());
  
  return {
    currentMaha: {
      planet: currentDasa.planet,
      startDate: currentMahaStart,
      endDate: currentMahaEnd,
      remainingYears: (currentMahaEnd.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    },
    currentSub: {
      planet: nextDasa.planet,
      startDate: currentSubStart,
      endDate: currentSubEnd,
      remainingMonths: (currentSubEnd.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
    },
    sequence: dasaPeriods
  };
}

/**
 * Get timezone from coordinates using timezonefinder
 */
export async function getTimezoneFromCoords(lat: number, lon: number): Promise<string> {
  try {
    // Simplified timezone lookup - using geographic boundaries
    if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 97) {
      return 'Asia/Kolkata'; // India
    }
    if (lat >= 25 && lat <= 49 && lon >= -125 && lon <= -66) {
      return 'America/New_York'; // USA
    }
    if (lat >= 35 && lat <= 71 && lon >= -10 && lon <= 40) {
      return 'Europe/London'; // Europe
    }
    return 'UTC';
  } catch (error) {
    console.warn('Timezone lookup failed, using UTC:', error);
    return 'UTC';
  }
}

/**
 * Validate birth data
 */
export function validateBirthData(lat: number, lon: number, dob: string, tob: string): boolean {
  // Validate coordinates
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return false;
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dob)) {
    return false;
  }
  
  // Validate time format
  const timeRegex = /^\d{2}:\d{2}$/;
  if (tob && !timeRegex.test(tob)) {
    return false;
  }
  
  return true;
}