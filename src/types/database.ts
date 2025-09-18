export interface Workout {
  id?: number;
  date: string; // ISO date string
  notes?: string;
  duration?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id?: number;
  name: string;
  muscleGroup: string;
  aliases?: string[];
  unitPreference?: 'lbs' | 'kg';
  videoUrl?: string; // Add this field for exercise demo videos
  createdAt: Date;
  updatedAt: Date;
}

export interface Set {
  id?: number;
  workoutId: number;
  exerciseId: number;
  reps: number;
  weight: number;
  rpe?: number; // Rate of Perceived Exertion 1-10
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id?: number;
  name: string;
  orderedExerciseList: {
    exerciseId: number;
    defaultSets: number;
    defaultReps: number;
    defaultWeight?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id?: number;
  units: 'lbs' | 'kg';
  theme: 'dark' | 'light';
  backupReminders: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackup?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutSession {
  id?: number;
  date: string; // ISO date string
  muscleGroup: string; // 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'
  status: 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseCompletion {
  id?: number;
  workoutSessionId: number;
  exerciseId: number;
  sets: {
    weight: number;
    reps: number;
    rpe?: number;
  }[];
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MuscleGroup {
  id?: number;
  name: string; // Display name like "Tiddies & Tris"
  identifier: string; // Internal identifier like "Chest"
  color: string; // CSS color class like "bg-red-600"
  icon: string; // Emoji icon like "🍈"
  description?: string; // Optional description like "Let's get it!"
  isActive: boolean; // Whether this muscle group is available for selection
  sortOrder: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}
