// 1RM calculation using Epley formula
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0) return 0;
  
  // Epley formula: 1RM = weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30));
}

// Alternative 1RM formulas
export function calculate1RMBrzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0) return 0;
  
  // Brzycki formula: 1RM = weight × (36 / (37 - reps))
  return Math.round(weight * (36 / (37 - reps)));
}

export function calculate1RMLombardi(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0) return 0;
  
  // Lombardi formula: 1RM = weight × (reps ^ 0.1)
  return Math.round(weight * Math.pow(reps, 0.1));
}

// Weight conversion
export function convertWeight(weight: number, fromUnit: 'lbs' | 'kg', toUnit: 'lbs' | 'kg'): number {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return Math.round(weight * 0.453592 * 100) / 100;
  } else {
    return Math.round(weight * 2.20462 * 100) / 100;
  }
}

// Date utilities
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

// RPE (Rate of Perceived Exertion) utilities
export function getRPEValue(rpe: number): string {
  const rpeMap: Record<number, string> = {
    1: 'Very Light',
    2: 'Light',
    3: 'Light',
    4: 'Moderate',
    5: 'Moderate',
    6: 'Moderate',
    7: 'Hard',
    8: 'Hard',
    9: 'Very Hard',
    10: 'Maximum'
  };
  
  return rpeMap[rpe] || 'Unknown';
}

// Exercise utilities
export function getMuscleGroupColor(muscleGroup: string): string {
  const colorMap: Record<string, string> = {
    'Chest': 'bg-red-500',
    'Back': 'bg-blue-500',
    'Shoulders': 'bg-purple-500',
    'Arms': 'bg-pink-500',
    'Legs': 'bg-green-500',
    'Core': 'bg-yellow-500',
    'Full Body': 'bg-indigo-500'
  };
  
  return colorMap[muscleGroup] || 'bg-gray-500';
}

// Validation utilities
export function validateWeight(weight: number): boolean {
  return weight >= 0 && weight <= 9999;
}

export function validateReps(reps: number): boolean {
  return reps >= 0 && reps <= 999;
}

export function validateRPE(rpe: number): boolean {
  return rpe >= 1 && rpe <= 10;
}

// Local storage utilities
export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return defaultValue;
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format duration in minutes to human readable
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// Calculate workout duration from sets
export function calculateWorkoutDuration(sets: Array<{ createdAt: Date }>): number {
  if (sets.length < 2) return 0;
  
  const sortedSets = [...sets].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  const startTime = new Date(sortedSets[0].createdAt).getTime();
  const endTime = new Date(sortedSets[sortedSets.length - 1].createdAt).getTime();
  
  return Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
}
