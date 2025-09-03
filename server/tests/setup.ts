import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock external services for testing
beforeAll(() => {
  // Mock Groq API
  global.fetch = async (url: string, options?: any) => {
    if (url.includes('groq')) {
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: "Test summary",
                details: "Test details",
                confidence: "high",
                basis: "Test basis",
                cta: "Test CTA",
                disclaimer: "Test disclaimer"
              })
            }
          }]
        })
      } as Response;
    }
    
    // Mock other APIs
    return {
      ok: true,
      json: async () => ({}),
      text: async () => ''
    } as Response;
  };
  
  // Mock console methods to reduce test noise
  global.console = {
    ...console,
    log: () => {},
    warn: () => {},
    error: console.error // Keep error messages for debugging
  };
});

afterAll(() => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
});

afterEach(() => {
  // Cleanup after each test
});

// Test utilities
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  username: 'testuser'
};

export const mockChartRequest = {
  name: 'Test User',
  dob: '1990-01-01',
  tob: '12:00',
  place: 'Delhi, India',
  lat: 28.6139,
  lon: 77.2090,
  timezone: 'Asia/Kolkata',
  gender: 'male' as const,
  consent: true
};

export const mockNatalChart = {
  ascendant: 0,
  houses: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  planets: {
    sun: { longitude: 280, sign: 9, degree: 10, nakshatra: 'Uttara Ashadha', pada: 2, retrograde: false },
    moon: { longitude: 45, sign: 1, degree: 15, nakshatra: 'Rohini', pada: 1, retrograde: false },
    mercury: { longitude: 290, sign: 9, degree: 20, nakshatra: 'Uttara Ashadha', pada: 3, retrograde: false },
    venus: { longitude: 320, sign: 10, degree: 20, nakshatra: 'Uttara Ashadha', pada: 4, retrograde: false },
    mars: { longitude: 100, sign: 3, degree: 10, nakshatra: 'Punarvasu', pada: 2, retrograde: false },
    jupiter: { longitude: 200, sign: 6, degree: 20, nakshatra: 'Swati', pada: 3, retrograde: false },
    saturn: { longitude: 150, sign: 5, degree: 0, nakshatra: 'Hasta', pada: 1, retrograde: true },
    rahu: { longitude: 75, sign: 2, degree: 15, nakshatra: 'Mrigashira', pada: 4, retrograde: true },
    ketu: { longitude: 255, sign: 8, degree: 15, nakshatra: 'Jyeshtha', pada: 4, retrograde: true }
  },
  ayanamsa: 24.1,
  julianDay: 2447892.5,
  siderealTime: 100.5
};

export const mockVargas = {
  D9: {
    sun: 3, moon: 7, mercury: 4, venus: 1, mars: 9,
    jupiter: 2, saturn: 8, rahu: 5, ketu: 11
  },
  D10: {
    sun: 6, moon: 2, mercury: 7, venus: 4, mars: 1,
    jupiter: 5, saturn: 9, rahu: 8, ketu: 3
  },
  D12: {
    sun: 9, moon: 5, mercury: 1, venus: 7, mars: 3,
    jupiter: 8, saturn: 2, rahu: 11, ketu: 6
  }
};