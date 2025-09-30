import Dexie, { Table } from 'dexie';
import { MuscleGroup } from '../types/database';


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

export class WorkoutDatabase extends Dexie {
  exercises!: Table<Exercise>;
  sets!: Table<Set>;
  templates!: Table<Template>;
  settings!: Table<Settings>;
  workoutSessions!: Table<WorkoutSession>;
  exerciseCompletions!: Table<ExerciseCompletion>;
  muscleGroups!: Table<MuscleGroup>;

  constructor() {
    super('WorkoutTrackerDB');
    
    this.version(1).stores({
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

    // Add video URL support for exercises
    this.version(4).stores({
      exercises: '++id, name, muscleGroup, createdAt, videoUrl'
    });

    // Add muscle groups table
    this.version(5).stores({
      muscleGroups: '++id, identifier, name, isActive, sortOrder, createdAt'
    });

    // Remove timestamp field from sets table (cleanup)
    this.version(6).stores({
      sets: '++id, workoutId, exerciseId, [workoutId+exerciseId]'
    });

    // Remove old workouts table (system consolidation)
    this.version(7).stores({
      workouts: null // Remove the workouts table
    });
  }

  // Helper methods for common operations

  async getExerciseHistory(exerciseId: number, limit = 50) {
    return await this.sets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('createdAt')
      .then(sets => sets.slice(0, limit));
  }

  async getLastUsedDefaults(exerciseId: number) {
    const lastSet = await this.sets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('createdAt')
      .then(sets => sets[0]);

    return lastSet ? {
      weight: lastSet.weight,
      reps: lastSet.reps,
      rpe: lastSet.rpe
    } : null;
  }


  // Muscle group methods
  async getMuscleGroups(): Promise<MuscleGroup[]> {
    const allGroups = await this.muscleGroups.toArray();    
    // Filter active groups in memory for now since dexie doesn't support boolean whereClause.
    return allGroups
      .filter(group => group.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getAllMuscleGroups(): Promise<MuscleGroup[]> {
    return await this.muscleGroups
      .orderBy('sortOrder')
      .toArray();
  }

  async getMuscleGroupByIdentifier(identifier: string): Promise<MuscleGroup | null> {
    return await this.muscleGroups
      .where('identifier')
      .equals(identifier)
      .first() || null;
  }

  async createMuscleGroup(muscleGroup: Omit<MuscleGroup, 'id'>): Promise<MuscleGroup> {
    const id = await this.muscleGroups.add(muscleGroup);
    const newMuscleGroup = await this.muscleGroups.get(id);
    if (!newMuscleGroup) throw new Error('Failed to create muscle group');
    return newMuscleGroup;
  }

  async updateMuscleGroup(id: number, updates: Partial<MuscleGroup>): Promise<void> {
    await this.muscleGroups.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteMuscleGroup(id: number): Promise<void> {
    await this.muscleGroups.delete(id);
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

  // Methods for History screen - get workout sessions for display
  async getWorkoutSessionsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    return await this.workoutSessions
      .where('date')
      .between(startDate, endDate)
      .reverse()
      .sortBy('date');
  }

  async getCompletedWorkoutSessions(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    const sessions = await this.getWorkoutSessionsByDateRange(startDate, endDate);
    return sessions.filter(session => session.status === 'completed'); // TODO: Include any in-progress session from past days too.
  }

  // Include sessions marked completed OR past in-progress sessions that have any completions
  async getCompletedOrWithCompletions(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    const sessions = await this.getWorkoutSessionsByDateRange(startDate, endDate);
    const today = new Date().toISOString().split('T')[0];

    const results: WorkoutSession[] = [];
    for (const s of sessions) {
      if (s.status === 'completed') {
        results.push(s);
        continue;
      }
      if (s.date < today) {
        const count = await this.exerciseCompletions
          .where('workoutSessionId')
          .equals(s.id!)
          .count();
        if (count > 0) {
          results.push(s);
        }
      }
    }
    return results;
  }

  async getWorkoutSessionWithExercises(sessionId: number): Promise<{
    session: WorkoutSession;
    completions: ExerciseCompletion[];
  } | null> {
    const session = await this.workoutSessions.get(sessionId);
    if (!session) return null;

    const completions = await this.exerciseCompletions
      .where('workoutSessionId')
      .equals(sessionId)
      .toArray();

    return { session, completions };
  }

  // Complete workout functionality
  async completeWorkoutSession(sessionId: number): Promise<void> {
    const session = await this.workoutSessions.get(sessionId);
    if (!session) throw new Error('Workout session not found');

    // Mark session as completed
    await this.workoutSessions.update(sessionId, {
      status: 'completed',
      updatedAt: new Date()
    });
  }

  // Migration helper
  async seedInitialData() {
    const exerciseCount = await this.exercises.count();
    if (exerciseCount === 0) {
      await this.exercises.bulkAdd([    
        {name: 'Cable Chest Fly',
        muscleGroup: 'Chest',
        aliases: ['Chest Cable Fly', 'Cable Flyes', 'Cable Flies'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/M97ra0UR-40',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Incline Dumbbell Hex Press',
        muscleGroup: 'Chest',
        aliases: ['Incline Hex Press', 'Incline DB Hex Press'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/FnMg43TQNa8',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dips',
        muscleGroup: 'Chest',
        aliases: ['Chest Dips', 'Parallel Bar Dips'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/Gz8NkGoNPkc',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Cable Triceps Pushdown (Bar)',
        muscleGroup: 'Chest',
        aliases: ['Tricep Pushdowns', 'Straight-Bar Pushdown', 'Cable Pushdown (Bar)'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/uHv7uy0FLTM',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Cable Overhead Triceps Extension (Rope)',
        muscleGroup: 'Chest',
        aliases: ['Overhead Rope Extension', 'Cable Overhead Extension'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/b5le--KkyH0',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        
        {
        name: 'Back Squat',
        muscleGroup: 'Legs',
        aliases: ['Barbell Back Squat', 'Squat'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/PKBg7KUMgMU',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Leg Curl',
        muscleGroup: 'Legs',
        aliases: ['Hamstring Curl', 'Seated Leg Curl', 'Lying Leg Curl'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/eKGgmvTVHDg',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Weighted Lunge',
        muscleGroup: 'Legs',
        aliases: ['Dumbbell Lunge', 'Walking Lunge'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/XvD0fvjWs-4',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Barbell Glute Bridge',
        muscleGroup: 'Legs',
        aliases: ['Weighted Glute Bridge', 'Glute Bridge (Weighted)'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/qCbDBGf8fe0',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Leg Extension',
        muscleGroup: 'Legs',
        aliases: ['Quad Extension', 'Knee Extension'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/fj80Tj0Lrho',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Leg Press',
        muscleGroup: 'Legs',
        aliases: ['45° Leg Press', 'Machine Leg Press'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/1tmd1sRjOiU',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Calf Raise (Leg Press Machine)',
        muscleGroup: 'Legs',
        aliases: ['Leg Press Calf Raise', 'Calf Raises on Leg Press'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/FsqE-g1C5fk',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Standing Calf Raise',
        muscleGroup: 'Legs',
        aliases: ['Standing Weighted Calf Raise', 'Smith Machine Calf Raise'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/O82Nr6GMAvk',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        
        {
        name: 'Overhead Press',
        muscleGroup: 'Shoulders',
        aliases: ['Military Press', 'OHP'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/0YYeELi896g',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dumbbell Shoulder Press',
        muscleGroup: 'Shoulders',
        aliases: ['DB Shoulder Press', 'Seated Dumbbell Press'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/osEKVtXBLlU',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dumbbell Upright Row',
        muscleGroup: 'Shoulders',
        aliases: ['Upright DB Row', 'Upright Row (DB)'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/PIC0MTxojZk',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dumbbell Front Raise',
        muscleGroup: 'Shoulders',
        aliases: ['Standing DB Front Raise', 'Front Raise (DB)'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/h9xfpTrAvkE',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Face Pull',
        muscleGroup: 'Shoulders',
        aliases: ['Cable Face Pull', 'Rope Face Pull'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/qEyoBOpvqR4',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Rear Delt Swing',
        muscleGroup: 'Shoulders',
        aliases: ['Rear Delt Dumbbell Swing', 'Rear Delt Raise (Swing)'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/O2J8Qs7Wl3U',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Wide-Grip Barbell Shrug',
        muscleGroup: 'Shoulders',
        aliases: ['Barbell Shrug (Wide Grip)', 'BB Shrugs Wide'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/0Jmi-byV8ns',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Dumbbell Lateral Raise',
        muscleGroup: 'Shoulders',
        aliases: ['Side Lateral Raise', 'DB Lateral Raise'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/JMt_uxE8bBc',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        
        {
        name: 'Deadlift',
        muscleGroup: 'Back',
        aliases: ['Conventional Deadlift', 'Barbell Deadlift'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/9x66V6NbxZ0',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Bent-Over Barbell Row',
        muscleGroup: 'Back',
        aliases: ['Barbell Row', 'BOBB Row'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/W0ZVYijgv2o',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Wide-Grip Lat Pulldown',
        muscleGroup: 'Back',
        aliases: ['Wide-Grip Pulldown', 'Lat Pulldown (Wide)'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/HWGntttgJQw',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Bent-Over Dumbbell Row',
        muscleGroup: 'Back',
        aliases: ['DB Row', 'Single-Arm Dumbbell Row'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/qN54-QNO1eQ',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Single-Arm Seated Cable Row',
        muscleGroup: 'Back',
        aliases: ['One-Arm Seated Row', 'Single-Arm Cable Row'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/yIvvQc2Z6uM',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        
        {
        name: 'Alternating Dumbbell Curl',
        muscleGroup: 'Back',
        aliases: ['Alt DB Curl', 'Alternating Biceps Curl'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/MfW-dMRkOgY',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Rope Hammer Curl',
        muscleGroup: 'Back',
        aliases: ['Cable Hammer Curl (Rope)', 'Hammer Curl (Cable Rope)'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/y0XVyp2OYA8',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Cable Curl (Bar)',
        muscleGroup: 'Back',
        aliases: ['Straight-Bar Cable Curl', 'Cable Bar Curl'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/_23URhwXxQc',
        createdAt: new Date(),
        updatedAt: new Date()
        },
        {
        name: 'Reverse Curl',
        muscleGroup: 'Back',
        aliases: ['Pronated Curl', 'EZ-Bar Reverse Curl'],
        unitPreference: 'lbs',
        videoUrl: 'https://www.youtube.com/shorts/ZG2n5IcYIcY',
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

    // Templates are now muscle group based, no need for seeded templates

    // Seed muscle groups
    const muscleGroupCount = await this.muscleGroups.count();
    if (muscleGroupCount === 0) {
      await this.muscleGroups.bulkAdd([
        {
          name: 'Tiddies & Tris',
          identifier: 'Chest',
          color: 'bg-red-600',
          icon: '🍈',
          description: "Let's get it!",
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Back & Bis',
          identifier: 'Back',
          color: 'bg-blue-600',
          icon: '🦾',
          description: "Let's get it!",
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Leg Circuit',
          identifier: 'Legs',
          color: 'bg-green-600',
          icon: '🦵',
          description: "Let's get it!",
          isActive: true,
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Shoulder & Traps',
          identifier: 'Shoulders',
          color: 'bg-purple-600',
          icon: '💪',
          description: "Let's get it!",
          isActive: true,
          sortOrder: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }
  }

  // Export/Import functionality
  async exportData(): Promise<string> {
    const data = {
      exercises: await this.exercises.toArray(),
      sets: await this.sets.toArray(),
      templates: await this.templates.toArray(),
      settings: await this.settings.toArray(),
      workoutSessions: await this.workoutSessions.toArray(),
      exerciseCompletions: await this.exerciseCompletions.toArray(),
      muscleGroups: await this.muscleGroups.toArray(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    // Clear existing data
    await this.exercises.clear();
    await this.sets.clear();
    await this.templates.clear();
    await this.settings.clear();
    await this.workoutSessions.clear();
    await this.exerciseCompletions.clear();
    await this.muscleGroups.clear();

    // Import new data
    if (data.exercises) await this.exercises.bulkAdd(data.exercises);
    if (data.sets) await this.sets.bulkAdd(data.sets);
    if (data.templates) await this.templates.bulkAdd(data.templates);
    if (data.settings) await this.settings.bulkAdd(data.settings);
    if (data.workoutSessions) await this.workoutSessions.bulkAdd(data.workoutSessions);
    if (data.exerciseCompletions) await this.exerciseCompletions.bulkAdd(data.exerciseCompletions);
    if (data.muscleGroups) await this.muscleGroups.bulkAdd(data.muscleGroups);
  }

  // Video URL management
  async updateExerciseVideoUrl(exerciseId: number, videoUrl: string): Promise<void> {
    await this.exercises.update(exerciseId, { 
      videoUrl: videoUrl,
      updatedAt: new Date()
    });
  }

  async removeExerciseVideoUrl(exerciseId: number): Promise<void> {
    await this.exercises.update(exerciseId, { 
      videoUrl: undefined,
      updatedAt: new Date()
    });
  }

  // Database maintenance
  async clearAllData(): Promise<void> {
    await this.exercises.clear();
    await this.sets.clear();
    await this.templates.clear();
    await this.settings.clear();
    await this.workoutSessions.clear();
    await this.exerciseCompletions.clear();
    await this.muscleGroups.clear();
  }
}

export const db = new WorkoutDatabase();
