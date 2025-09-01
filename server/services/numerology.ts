export interface NumerologyCalculation {
  lifePathNumber: number;
  expressionNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  birthdayNumber: number;
  maturityNumber: number;
  loShuGrid: number[][];
  pinnacles: number[];
  challenges: number[];
}

// Pythagorean letter values
const letterValues: { [key: string]: number } = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
};

const vowels = ['A', 'E', 'I', 'O', 'U'];

function reduceToSingleDigit(num: number, keepMasterNumbers: boolean = true): number {
  if (keepMasterNumbers && (num === 11 || num === 22 || num === 33)) {
    return num;
  }
  
  while (num > 9) {
    num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    if (keepMasterNumbers && (num === 11 || num === 22 || num === 33)) {
      return num;
    }
  }
  return num;
}

function calculateNameNumber(name: string, vowelsOnly: boolean = false, consonantsOnly: boolean = false): number {
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
  let sum = 0;
  
  for (const letter of cleanName) {
    const isVowel = vowels.includes(letter);
    
    if (vowelsOnly && !isVowel) continue;
    if (consonantsOnly && isVowel) continue;
    
    sum += letterValues[letter] || 0;
  }
  
  return sum;
}

export function calculateLifePathNumber(day: number, month: number, year: number): number {
  const reducedDay = reduceToSingleDigit(day);
  const reducedMonth = reduceToSingleDigit(month);
  const reducedYear = reduceToSingleDigit(year);
  
  const sum = reducedDay + reducedMonth + reducedYear;
  return reduceToSingleDigit(sum);
}

export function calculateExpressionNumber(fullName: string): number {
  const names = fullName.trim().split(/\s+/);
  let totalSum = 0;
  
  for (const name of names) {
    const nameSum = calculateNameNumber(name);
    const reducedNameSum = reduceToSingleDigit(nameSum);
    totalSum += reducedNameSum;
  }
  
  return reduceToSingleDigit(totalSum);
}

export function calculateSoulUrgeNumber(fullName: string): number {
  const sum = calculateNameNumber(fullName, true);
  return reduceToSingleDigit(sum);
}

export function calculatePersonalityNumber(fullName: string): number {
  const sum = calculateNameNumber(fullName, false, true);
  return reduceToSingleDigit(sum);
}

export function calculateBirthdayNumber(day: number): number {
  return reduceToSingleDigit(day);
}

export function calculateMaturityNumber(lifePathNumber: number, expressionNumber: number): number {
  const sum = lifePathNumber + expressionNumber;
  return reduceToSingleDigit(sum, false); // No master numbers for maturity
}

export function generateLoShuGrid(day: number, month: number, year: number): number[][] {
  // Get all digits from birth date
  const digits: number[] = [];
  
  // Add day digits
  day.toString().split('').forEach(d => digits.push(parseInt(d)));
  
  // Add month digits
  month.toString().split('').forEach(d => digits.push(parseInt(d)));
  
  // Add year digits
  year.toString().split('').forEach(d => digits.push(parseInt(d)));
  
  // Add driver (birthday number)
  const driver = calculateBirthdayNumber(day);
  digits.push(driver);
  
  // Add conductor (life path number)
  const conductor = calculateLifePathNumber(day, month, year);
  digits.push(conductor);
  
  // Create 3x3 grid with Lo Shu positions
  // Traditional Lo Shu square positions:
  // 4 9 2
  // 3 5 7  
  // 8 1 6
  const loShuPositions = [
    [4, 9, 2],
    [3, 5, 7],
    [8, 1, 6]
  ];
  
  // Count occurrences of each digit 1-9
  const digitCounts: { [key: number]: number } = {};
  for (let i = 1; i <= 9; i++) {
    digitCounts[i] = 0;
  }
  
  digits.forEach(digit => {
    if (digit >= 1 && digit <= 9) {
      digitCounts[digit]++;
    }
  });
  
  // Create grid showing presence/absence
  const grid: number[][] = [];
  for (let row = 0; row < 3; row++) {
    grid[row] = [];
    for (let col = 0; col < 3; col++) {
      const number = loShuPositions[row][col];
      grid[row][col] = digitCounts[number] > 0 ? number : 0;
    }
  }
  
  return grid;
}

export function calculatePinnacles(day: number, month: number, year: number): number[] {
  const reducedDay = reduceToSingleDigit(day);
  const reducedMonth = reduceToSingleDigit(month);
  const reducedYear = reduceToSingleDigit(year);
  
  const first = reduceToSingleDigit(reducedMonth + reducedDay);
  const second = reduceToSingleDigit(reducedDay + reducedYear);
  const third = reduceToSingleDigit(first + second);
  const fourth = reduceToSingleDigit(reducedMonth + reducedYear);
  
  return [first, second, third, fourth];
}

export function calculateChallenges(day: number, month: number, year: number): number[] {
  const reducedDay = reduceToSingleDigit(day, false);
  const reducedMonth = reduceToSingleDigit(month, false);
  const reducedYear = reduceToSingleDigit(year, false);
  
  const first = Math.abs(reducedMonth - reducedDay);
  const second = Math.abs(reducedDay - reducedYear);
  const third = Math.abs(first - second);
  const fourth = Math.abs(reducedMonth - reducedYear);
  
  return [first, second, third, fourth];
}

function getHiddenPassionNumber(name: string): number {
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
  const digitCounts: { [key: number]: number } = {};
  
  // Count frequency of each letter value
  for (const letter of cleanName) {
    const value = letterValues[letter] || 0;
    if (value >= 1 && value <= 9) {
      digitCounts[value] = (digitCounts[value] || 0) + 1;
    }
  }
  
  // Find most frequent digit
  let maxCount = 0;
  let hiddenPassion = 1;
  
  for (let digit = 1; digit <= 9; digit++) {
    if ((digitCounts[digit] || 0) > maxCount) {
      maxCount = digitCounts[digit] || 0;
      hiddenPassion = digit;
    }
  }
  
  return hiddenPassion;
}

function getLoShuGridDigits(day: number, month: number, year: number): Set<number> {
  const digits = new Set<number>();
  
  // Add all birth date digits
  [day, month, year].forEach(num => {
    num.toString().split('').forEach(d => {
      const digit = parseInt(d);
      if (digit >= 1 && digit <= 9) digits.add(digit);
    });
  });
  
  // Add driver and conductor
  const driver = calculateBirthdayNumber(day);
  const conductor = calculateLifePathNumber(day, month, year);
  if (driver >= 1 && driver <= 9) digits.add(driver);
  if (conductor >= 1 && conductor <= 9) digits.add(conductor);
  
  return digits;
}

export interface AdvancedCompatibilityResult {
  score: number;
  category: string;
  summary: string;
  details: {
    lifePath: string;
    expression: string;
    soulUrge: string;
    personality: string;
    birthday: string;
    hiddenPassion: string;
    loShu: string;
    pinnacles: string;
  };
}

export function calculateAdvancedCompatibility(
  person1: NumerologyCalculation & { name: string; day: number; month: number; year: number },
  person2: NumerologyCalculation & { name: string; day: number; month: number; year: number }
): AdvancedCompatibilityResult {
  // 1. Life Path Compatibility
  const scoreLp = 1 - Math.abs(person1.lifePathNumber - person2.lifePathNumber) / 8;
  const lpBonus = person1.lifePathNumber === person2.lifePathNumber ? 0.1 : 0;
  const finalLpScore = scoreLp + lpBonus;

  // 2. Expression Compatibility
  const scoreExpr = 1 - Math.abs(person1.expressionNumber - person2.expressionNumber) / 8;
  const exprBonus = person1.expressionNumber === person2.expressionNumber ? 0.1 : 0;
  const finalExprScore = scoreExpr + exprBonus;

  // 3. Soul Urge Compatibility
  const scoreSoul = 1 - Math.abs(person1.soulUrgeNumber - person2.soulUrgeNumber) / 8;
  const soulBonus = person1.soulUrgeNumber === person2.soulUrgeNumber ? 0.1 : 0;
  const finalSoulScore = scoreSoul + soulBonus;

  // 4. Personality Compatibility
  const scorePerson = 1 - Math.abs(person1.personalityNumber - person2.personalityNumber) / 8;
  const personBonus = person1.personalityNumber === person2.personalityNumber ? 0.1 : 0;
  const finalPersonScore = scorePerson + personBonus;

  // 5. Birthday Compatibility
  const scoreBday = 1 - Math.abs(person1.birthdayNumber - person2.birthdayNumber) / 8;

  // 6. Hidden Passion Compatibility
  const hidden1 = getHiddenPassionNumber(person1.name);
  const hidden2 = getHiddenPassionNumber(person2.name);
  const scoreHidden = hidden1 === hidden2 ? 1 : (1 - Math.abs(hidden1 - hidden2) / 8);

  // 7. Lo Shu Grid Compatibility  
  const loShu1 = getLoShuGridDigits(person1.day, person1.month, person1.year);
  const loShu2 = getLoShuGridDigits(person2.day, person2.month, person2.year);
  const loShu1Array = Array.from(loShu1);
  const loShu2Array = Array.from(loShu2);
  const matchingDigits = loShu1Array.filter(d => loShu2.has(d)).length;
  const completionBonus = loShu1Array.some(d => !loShu2.has(d)) && loShu2Array.some(d => !loShu1.has(d)) ? 0.05 : 0;
  const scoreLo = (matchingDigits / 9) + completionBonus;

  // 8. Pinnacle & Challenge Synergy
  let pinnacleBonus = 0;
  let challengePenalty = 0;
  
  for (let i = 0; i < 4; i++) {
    if (person1.pinnacles[i] === person2.pinnacles[i]) {
      pinnacleBonus += 0.025; // 0.1 total for all matches
    }
    if (person1.challenges[i] === person2.challenges[i]) {
      challengePenalty += 0.0125; // 0.05 total penalty
    }
  }

  // 9. Final Score Calculation
  const finalScore = Math.max(0, Math.min(1, 
    0.25 * finalLpScore + 
    0.15 * finalExprScore + 
    0.15 * finalSoulScore + 
    0.15 * finalPersonScore + 
    0.10 * scoreBday + 
    0.10 * scoreHidden + 
    0.05 * scoreLo + 
    pinnacleBonus - 
    challengePenalty
  ));

  const percentage = Math.round(finalScore * 100);

  // Categorize
  let category: string;
  if (percentage >= 80) category = "Excellent Match ❤️";
  else if (percentage >= 65) category = "Good Match 💕";
  else if (percentage >= 50) category = "Average Match 🤝";
  else category = "Challenging ⚠️";

  return {
    score: percentage,
    category,
    summary: `${percentage}% compatibility with strong ${finalLpScore > 0.8 ? 'life path' : finalSoulScore > 0.8 ? 'emotional' : 'personality'} alignment`,
    details: {
      lifePath: `Life Path harmony ${Math.round(finalLpScore * 100)}% - ${person1.lifePathNumber === person2.lifePathNumber ? 'Perfect match!' : finalLpScore > 0.7 ? 'Strong compatibility' : 'Need understanding'}`,
      expression: `Career/Goals ${Math.round(finalExprScore * 100)}% - ${finalExprScore > 0.7 ? 'Shared ambitions' : 'Different approaches to success'}`,
      soulUrge: `Emotional bond ${Math.round(finalSoulScore * 100)}% - ${finalSoulScore > 0.8 ? 'Deep connection' : finalSoulScore > 0.6 ? 'Good understanding' : 'Work on emotional sync'}`,
      personality: `Social image ${Math.round(finalPersonScore * 100)}% - ${finalPersonScore > 0.7 ? 'Great public chemistry' : 'Different social styles'}`,
      birthday: `Daily habits ${Math.round(scoreBday * 100)}% - ${scoreBday > 0.7 ? 'Easy daily flow' : 'Adjust routines'}`,
      hiddenPassion: `Inner drives ${Math.round(scoreHidden * 100)}% - Hidden passion ${hidden1} & ${hidden2}`,
      loShu: `Energy balance ${Math.round(scoreLo * 100)}% - ${matchingDigits > 5 ? 'Strong energy match' : 'Complementary energies'}`,
      pinnacles: `Future growth ${pinnacleBonus > 0.05 ? 'Aligned path' : 'Different timings'} - ${challengePenalty > 0.025 ? 'Shared struggles need care' : 'Individual growth'}`
    }
  };
}

export function calculateCompatibilityScore(
  person1LifePath: number,
  person2LifePath: number
): number {
  // Legacy function - kept for backward compatibility
  const score = 1 - Math.abs(person1LifePath - person2LifePath) / 8;
  return Math.round(score * 100);
}

export function calculateNumerology(
  fullName: string,
  day: number,
  month: number,
  year: number
): NumerologyCalculation {
  const lifePathNumber = calculateLifePathNumber(day, month, year);
  const expressionNumber = calculateExpressionNumber(fullName);
  const soulUrgeNumber = calculateSoulUrgeNumber(fullName);
  const personalityNumber = calculatePersonalityNumber(fullName);
  const birthdayNumber = calculateBirthdayNumber(day);
  const maturityNumber = calculateMaturityNumber(lifePathNumber, expressionNumber);
  const loShuGrid = generateLoShuGrid(day, month, year);
  const pinnacles = calculatePinnacles(day, month, year);
  const challenges = calculateChallenges(day, month, year);
  
  return {
    lifePathNumber,
    expressionNumber,
    soulUrgeNumber,
    personalityNumber,
    birthdayNumber,
    maturityNumber,
    loShuGrid,
    pinnacles,
    challenges
  };
}
