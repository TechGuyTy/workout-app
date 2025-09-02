import Dexie, { Table } from 'dexie';

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
  timestamp: Date;
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

export class WorkoutDatabase extends Dexie {
  workouts!: Table<Workout>;
  exercises!: Table<Exercise>;
  sets!: Table<Set>;
  templates!: Table<Template>;
  settings!: Table<Settings>;
  workoutSessions!: Table<WorkoutSession>;
  exerciseCompletions!: Table<ExerciseCompletion>;

  constructor() {
    super('WorkoutTrackerDB');
    
    this.version(1).stores({
      workouts: '++id, date, createdAt',
      exercises: '++id, name, muscleGroup, createdAt',
      sets: '++id, workoutId, exerciseId, timestamp, [exerciseId+timestamp]',
      templates: '++id, name, createdAt',
      settings: '++id, units, theme'
    });

    // Add indexes for better query performance
    this.version(2).stores({
      sets: '++id, workoutId, exerciseId, timestamp, [exerciseId+timestamp], [workoutId+exerciseId]'
    });

    // Add workout sessions and completion tracking
    this.version(3).stores({
      workoutSessions: '++id, date, muscleGroup, status',
      exerciseCompletions: '++id, workoutSessionId, exerciseId, completedAt'
    });
  }

  // Helper methods for common operations
  async getWorkoutWithSets(workoutId: number) {
    const workout = await this.workouts.get(workoutId);
    if (!workout) return null;

    const sets = await this.sets
      .where('workoutId')
      .equals(workoutId)
      .toArray();

    return { workout, sets };
  }

  async getExerciseHistory(exerciseId: number, limit = 50) {
    return await this.sets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('timestamp')
      .then(sets => sets.slice(0, limit));
  }

  async getLastUsedDefaults(exerciseId: number) {
    const lastSet = await this.sets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('timestamp')
      .then(sets => sets[0]);

    return lastSet ? {
      weight: lastSet.weight,
      reps: lastSet.reps,
      rpe: lastSet.rpe
    } : null;
  }

  async getWorkoutsByDateRange(startDate: string, endDate: string) {
    return await this.workouts
      .where('date')
      .between(startDate, endDate)
      .reverse()
      .sortBy('date');
  }

  // Workout session methods
  async getTodayWorkoutSession(): Promise<WorkoutSession | null> {
    const today = new Date().toISOString().split('T')[0];
    const session = await this.workoutSessions
      .where('date')
      .equals(today)
      .first();
    return session || null;
  }

  async getOrCreateTodayWorkoutSession(muscleGroup: string): Promise<WorkoutSession> {
    const today = new Date().toISOString().split('T')[0];
    let session = await this.getTodayWorkoutSession();
    
    if (!session) {
      const newSessionId = await this.workoutSessions.add({
        date: today,
        muscleGroup,
        status: 'in-progress',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const newSession = await this.workoutSessions.get(newSessionId);
      if (!newSession) throw new Error('Failed to create workout session');
      return newSession;
    } else if (session.muscleGroup !== muscleGroup) {
      // Update muscle group if different
      await this.workoutSessions.update(session.id!, {
        muscleGroup,
        updatedAt: new Date()
      });
      const updatedSession = await this.workoutSessions.get(session.id!);
      if (!updatedSession) throw new Error('Failed to update workout session');
      return updatedSession;
    }
    
    return session;
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return await this.exercises
      .where('muscleGroup')
      .equals(muscleGroup)
      .toArray();
  }

  async isExerciseCompletedToday(exerciseId: number): Promise<boolean> {
    // const _today = new Date().toISOString().split('T')[0];
    const session = await this.getTodayWorkoutSession();
    if (!session) return false;
    
    const completion = await this.exerciseCompletions
      .where(['workoutSessionId', 'exerciseId'])
      .equals([session.id!, exerciseId])
      .first();
    
    return !!completion;
  }

  async completeExerciseToday(exerciseId: number, sets: { weight: number; reps: number; rpe?: number }[]): Promise<void> {
    const session = await this.getTodayWorkoutSession();
    if (!session) throw new Error('No workout session for today');
    
    // Add completion record
    await this.exerciseCompletions.add({
      workoutSessionId: session.id!,
      exerciseId,
      sets,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Also add to sets table for historical tracking
    const setRecords = sets.map(set => ({
      workoutId: 0, // We'll use workoutId 0 for template-based workouts
      exerciseId,
      reps: set.reps,
      weight: set.weight,
      rpe: set.rpe,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await this.sets.bulkAdd(setRecords);
  }

  async getTodayCompletedExercises(): Promise<ExerciseCompletion[]> {
    const session = await this.getTodayWorkoutSession();
    if (!session) return [];
    
    return await this.exerciseCompletions
      .where('workoutSessionId')
      .equals(session.id!)
      .toArray();
  }

  // Migration helper
  async seedInitialData() {
    const exerciseCount = await this.exercises.count();
    if (exerciseCount === 0) {
      await this.exercises.bulkAdd([
        {
        name: 'Cable Chest Fly',
        muscleGroup: 'Chest',
        aliases: ['Chest Cable Fly', 'Cable Flyes', 'Cable Flies'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Incline Dumbbell Hex Press',
        muscleGroup: 'Chest',
        aliases: ['Incline Hex Press', 'Incline DB Hex Press'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dips',
        muscleGroup: 'Chest',
        aliases: ['Chest Dips', 'Parallel Bar Dips'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Cable Triceps Pushdown (Bar)',
        muscleGroup: 'Chest',
        aliases: ['Tricep Pushdowns', 'Straight-Bar Pushdown', 'Cable Pushdown (Bar)'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Cable Overhead Triceps Extension (Rope)',
        muscleGroup: 'Chest',
        aliases: ['Overhead Rope Extension', 'Cable Overhead Extension'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        
        {
        name: 'Back Squat',
        muscleGroup: 'Legs',
        aliases: ['Barbell Back Squat', 'Squat'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Leg Curl',
        muscleGroup: 'Legs',
        aliases: ['Hamstring Curl', 'Seated Leg Curl', 'Lying Leg Curl'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Weighted Lunge',
        muscleGroup: 'Legs',
        aliases: ['Dumbbell Lunge', 'Walking Lunge'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Barbell Glute Bridge',
        muscleGroup: 'Legs',
        aliases: ['Weighted Glute Bridge', 'Glute Bridge (Weighted)'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Leg Extension',
        muscleGroup: 'Legs',
        aliases: ['Quad Extension', 'Knee Extension'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Leg Press',
        muscleGroup: 'Legs',
        aliases: ['45° Leg Press', 'Machine Leg Press'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Calf Raise (Leg Press Machine)',
        muscleGroup: 'Legs',
        aliases: ['Leg Press Calf Raise', 'Calf Raises on Leg Press'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Standing Calf Raise',
        muscleGroup: 'Legs',
        aliases: ['Standing Weighted Calf Raise', 'Smith Machine Calf Raise'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        
        {
        name: 'Overhead Press',
        muscleGroup: 'Shoulders',
        aliases: ['Military Press', 'OHP'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dumbbell Shoulder Press',
        muscleGroup: 'Shoulders',
        aliases: ['DB Shoulder Press', 'Seated Dumbbell Press'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dumbbell Upright Row',
        muscleGroup: 'Shoulders',
        aliases: ['Upright DB Row', 'Upright Row (DB)'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dumbbell Front Raise',
        muscleGroup: 'Shoulders',
        aliases: ['Standing DB Front Raise', 'Front Raise (DB)'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Face Pull',
        muscleGroup: 'Shoulders',
        aliases: ['Cable Face Pull', 'Rope Face Pull'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Rear Delt Swing',
        muscleGroup: 'Shoulders',
        aliases: ['Rear Delt Dumbbell Swing', 'Rear Delt Raise (Swing)'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Wide-Grip Barbell Shrug',
        muscleGroup: 'Shoulders',
        aliases: ['Barbell Shrug (Wide Grip)', 'BB Shrugs Wide'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dumbbell Lateral Raise',
        muscleGroup: 'Shoulders',
        aliases: ['Side Lateral Raise', 'DB Lateral Raise'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        
        {
        name: 'Deadlift',
        muscleGroup: 'Back',
        aliases: ['Conventional Deadlift', 'Barbell Deadlift'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Bent-Over Barbell Row',
        muscleGroup: 'Back',
        aliases: ['Barbell Row', 'BOBB Row'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Wide-Grip Lat Pulldown',
        muscleGroup: 'Back',
        aliases: ['Wide-Grip Pulldown', 'Lat Pulldown (Wide)'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Bent-Over Dumbbell Row',
        muscleGroup: 'Back',
        aliases: ['DB Row', 'Single-Arm Dumbbell Row'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Single-Arm Seated Cable Row',
        muscleGroup: 'Back',
        aliases: ['One-Arm Seated Row', 'Single-Arm Cable Row'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        
        {
        name: 'Alternating Dumbbell Curl',
        muscleGroup: 'Back',
        aliases: ['Alt DB Curl', 'Alternating Biceps Curl'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Rope Hammer Curl',
        muscleGroup: 'Back',
        aliases: ['Cable Hammer Curl (Rope)', 'Hammer Curl (Cable Rope)'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Cable Curl (Bar)',
        muscleGroup: 'Back',
        aliases: ['Straight-Bar Cable Curl', 'Cable Bar Curl'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Reverse Curl',
        muscleGroup: 'Back',
        aliases: ['Pronated Curl', 'EZ-Bar Reverse Curl'],
        unitPreference: 'lbs',
        createdAt: new Date(),
        updatedAt: new Date()
        }
        ]);
    }

    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      await this.settings.add({
        units: 'lbs',
        theme: 'dark',
        backupReminders: true,
        backupFrequency: 'weekly',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const templateCount = await this.templates.count();
    if (templateCount === 0) {
      const exercises = await this.exercises.toArray();
      await this.templates.add({
        name: 'Push Day',
        orderedExerciseList: exercises
          .filter(e => ['Chest', 'Shoulders'].includes(e.muscleGroup))
          .map(e => ({
            exerciseId: e.id!,
            defaultSets: 3,
            defaultReps: 8,
            defaultWeight: 0
          })),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  // Export/Import functionality
  async exportData(): Promise<string> {
    const data = {
      workouts: await this.workouts.toArray(),
      exercises: await this.exercises.toArray(),
      sets: await this.sets.toArray(),
      templates: await this.templates.toArray(),
      settings: await this.settings.toArray(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    // Clear existing data
    await this.workouts.clear();
    await this.exercises.clear();
    await this.sets.clear();
    await this.templates.clear();
    await this.settings.clear();

    // Import new data
    if (data.exercises) await this.exercises.bulkAdd(data.exercises);
    if (data.workouts) await this.workouts.bulkAdd(data.workouts);
    if (data.sets) await this.sets.bulkAdd(data.sets);
    if (data.templates) await this.templates.bulkAdd(data.templates);
    if (data.settings) await this.settings.bulkAdd(data.settings);
  }

  // Database maintenance
  async clearAllData(): Promise<void> {
    await this.workouts.clear();
    await this.exercises.clear();
    await this.sets.clear();
    await this.templates.clear();
    await this.settings.clear();
  }
}

export const db = new WorkoutDatabase();
