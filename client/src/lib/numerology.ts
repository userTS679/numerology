// Client-side numerology utilities for validation and display

export function isValidDate(day: number, month: number, year: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  
  // Check for valid day based on month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Handle leap year
  if (month === 2 && isLeapYear(year)) {
    return day <= 29;
  }
  
  return day <= daysInMonth[month - 1];
}

export function isLeapYear(year: number): boolean {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

export function formatBirthDate(day: number, month: number, year: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function getNumberMeaning(number: number, type: 'lifePathNumber' | 'expressionNumber' | 'soulUrgeNumber' | 'personalityNumber'): string {
  const meanings = {
    lifePathNumber: {
      1: "The Leader - Independence और leadership आपकी strength है",
      2: "The Cooperator - Teamwork और diplomacy में आप excel करते हैं",
      3: "The Creative - Expression और communication आपका gift है",
      4: "The Builder - Hard work और practical approach आपकी specialty है",
      5: "The Adventurer - Freedom और variety आपको attract करती है",
      6: "The Nurturer - Family और service आपकी priority है",
      7: "The Seeker - Spirituality और wisdom आपका path है",
      8: "The Achiever - Material success और business acumen आपकी strength है",
      9: "The Humanitarian - Service और compassion आपका purpose है"
    },
    expressionNumber: {
      1: "Innovation और original thinking express करते हैं",
      2: "Cooperation और peaceful solutions के through shine करते हैं",
      3: "Creativity और joy के through connect करते हैं",
      4: "Reliability और systematic approach demonstrate करते हैं",
      5: "Freedom और versatility के through express करते हैं",
      6: "Care और responsibility के through service करते हैं",
      7: "Wisdom और analysis के through contribute करते हैं",
      8: "Authority और material mastery demonstrate करते हैं",
      9: "Universal love और humanitarian service express करते हैं"
    },
    soulUrgeNumber: {
      1: "Leadership लेने की inner desire है",
      2: "Partnership और cooperation की deep need है",
      3: "Creative expression की soul में burning desire है",
      4: "Stability और security की inner craving है",
      5: "Freedom और adventure की deep longing है",
      6: "Service और nurturing की soul calling है",
      7: "Truth और spiritual understanding की quest है",
      8: "Material success और recognition की inner drive है",
      9: "Humanity की service करने की soul purpose है"
    },
    personalityNumber: {
      1: "Confident और independent appear करते हैं",
      2: "Gentle और cooperative personality project करते हैं",
      3: "Charming और expressive outer image है",
      4: "Reliable और trustworthy impression देते हैं",
      5: "Dynamic और versatile personality show करते हैं",
      6: "Caring और responsible image project करते हैं",
      7: "Mysterious और intellectual aura है",
      8: "Authoritative और successful image present करते हैं",
      9: "Wise और compassionate personality display करते हैं"
    }
  };
  
  return meanings[type][number as keyof typeof meanings[typeof type]] || `Number ${number} की unique energy है`;
}

export function getCompatibilityDescription(score: number): string {
  if (score >= 90) return "Perfect match! आप दोनों के stars completely aligned हैं।";
  if (score >= 80) return "Excellent compatibility! Strong relationship potential है।";
  if (score >= 70) return "Good match! Little effort से great relationship बन सकती है।";
  if (score >= 60) return "Decent compatibility! Communication important होगी।";
  return "Challenging match! Understanding और patience की जरूरत है।";
}

export function getMissingNumberMeaning(number: number): string {
  const meanings: { [key: number]: string } = {
    1: "Leadership qualities develop करने की जरूरत है",
    2: "Patience और cooperation बढ़ाना beneficial होगा",
    3: "Creative expression को encourage करें",
    4: "Discipline और organization improve करना चाहिए",
    5: "Flexibility और adaptability develop करें",
    6: "Caring nature को और nurture करें",
    7: "Spiritual practices और introspection को बढ़ावा दें",
    8: "Material goals और business skills पर focus करें",
    9: "Humanitarian values और service mindset develop करें"
  };
  
  return meanings[number] || `Number ${number} की energy को strengthen करना beneficial है`;
}
