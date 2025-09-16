import { useState, useEffect } from 'react'
import { db } from '../lib/database'
import { Exercise, WorkoutSession } from '../types/database'
import { 
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

const MUSCLE_GROUPS = [
  { id: 'Chest', name: 'Tiddies & Tris', color: 'bg-red-600', icon: '🍈' },
  { id: 'Back', name: 'Back & Bis', color: 'bg-blue-600', icon: '🦾' },
  { id: 'Legs', name: 'Leg Circuit', color: 'bg-green-600', icon: '🦵' },
  { id: 'Shoulders', name: 'Shoulder & Traps', color: 'bg-purple-600', icon: '💪' }
]

export default function Today() {
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set())
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    loadTodayStatus()
  }, [])

  const loadTodayStatus = async () => {
    try {
      const session = await db.getTodayWorkoutSession()
      if (session) {
        setCurrentSession(session)
        setSelectedMuscleGroup(session.muscleGroup)
        await loadExercises(session.muscleGroup)
        await loadCompletedExercises()
      }
    } catch (error) {
      console.error('Failed to load today status:', error)
    }
  }

  const loadExercises = async (muscleGroup: string) => {
    try {
      const exerciseList = await db.getExercisesByMuscleGroup(muscleGroup)
      setExercises(exerciseList)
    } catch (error) {
      console.error('Failed to load exercises:', error)
    }
  }

  const loadCompletedExercises = async () => {
    try {
      const completed = await db.getTodayCompletedExercises()
      const completedIds = new Set(completed.map(c => c.exerciseId))
      setCompletedExercises(completedIds)
    } catch (error) {
      console.error('Failed to load completed exercises:', error)
    }
  }

  const selectMuscleGroup = async (muscleGroup: string) => {
    try {
      setIsLoading(true)
      const session = await db.getOrCreateTodayWorkoutSession(muscleGroup)
      setCurrentSession(session)
      setSelectedMuscleGroup(muscleGroup)
      await loadExercises(muscleGroup)
      await loadCompletedExercises()
    } catch (error) {
      console.error('Failed to select muscle group:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetWorkout = () => {
    setSelectedMuscleGroup(null)
    setSelectedExercise(null)
    setCompletedExercises(new Set())
    setCurrentSession(null)
  }

  const completeWorkout = async () => {
    if (!currentSession || completedExercises.size === 0) return
    
    try {
      setIsCompleting(true)
      await db.completeWorkoutSession(currentSession.id!)
      alert('Workout completed! Check your history to see the results.')
      resetWorkout()
    } catch (error) {
      console.error('Failed to complete workout:', error)
      alert('Failed to complete workout. Please try again.')
    } finally {
      setIsCompleting(false)
    }
  }

  if (!selectedMuscleGroup) {
    return (
      <div className="space-y-6">
        <div className="medieval-title">Today's Workout</div>
        
        <div className="text-center py-8">
          <div className="text-xl text-gray-300 mb-6">Select today's workout</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => selectMuscleGroup(group.id)}
                disabled={isLoading}
                className={`${group.color} hover:opacity-90 transition-all duration-200 p-6 rounded-lg text-white text-center group`}
              >
                <div className="text-4xl mb-2">{group.icon}</div>
                <div className="text-lg font-semibold">{group.name}</div>
                <div className="text-sm opacity-80">Let's get it!</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (selectedExercise) {
    return (
      <ExerciseInputForm
        exercise={selectedExercise}
        onComplete={async (sets) => {
          try {
            await db.completeExerciseToday(selectedExercise.id!, sets)
            await loadCompletedExercises()
            setSelectedExercise(null)
          } catch (error) {
            console.error('Failed to complete exercise:', error)
            alert('Failed to save exercise. Please try again.')
          }
        }}
        onBack={() => setSelectedExercise(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="medieval-title">{MUSCLE_GROUPS.find(g => g.id === selectedMuscleGroup)?.name}</div>
          <div className="text-gray-400">Select exercises to complete</div>
        </div>
        <button
          onClick={resetWorkout}
          className="btn-secondary"
        >
          <XMarkIcon className="h-4 w-4 mr-2" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className={`card cursor-pointer transition-all duration-200 hover:scale-105 ${
              completedExercises.has(exercise.id!)
                ? 'border-green-500 bg-green-900/20'
                : 'hover:border-medieval-500'
            }`}
            onClick={() => setSelectedExercise(exercise)}
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="medieval-subtitle">{exercise.name}</h3>
                  <p className="text-sm text-gray-400">{exercise.muscleGroup}</p>
                </div>
                {completedExercises.has(exercise.id!) && (
                  <CheckIcon className="h-6 w-6 text-green-400" />
                )}
              </div>
              
              {completedExercises.has(exercise.id!) ? (
                <div className="text-green-400 text-sm mt-2">✓ Completed today</div>
              ) : (
                <div className="text-gray-400 text-sm mt-2">Click to start</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {completedExercises.size > 0 && (
        <div className="text-center space-y-4">
          <div className="text-lg text-gray-300 mb-2">
            {completedExercises.size} of {exercises.length} exercises completed
          </div>
          <div className="text-sm text-gray-400">
            Great work! Keep going or complete your workout
          </div>
          <button
            onClick={completeWorkout}
            disabled={isCompleting}
            className="btn-primary px-6 py-3 text-lg"
          >
            {isCompleting ? (
              'Completing...'
            ) : (
              <>
                <TrophyIcon className="h-5 w-5 mr-2" />
                Complete Workout
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// Exercise input form component
function ExerciseInputForm({ 
  exercise, 
  onComplete, 
  onBack 
}: { 
  exercise: Exercise
  onComplete: (sets: { weight: number; reps: number }[]) => void
  onBack: () => void
}) {
  const [sets, setSets] = useState([
    { weight: 0, reps: 10 },
    { weight: 0, reps: 10 },
    { weight: 0, reps: 10 },
    { weight: 0, reps: 10 }
  ])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadLastUsedDefaults()
  }, [exercise.id])

  const loadLastUsedDefaults = async () => {
    try {
      const defaults = await db.getLastUsedDefaults(exercise.id!)
      if (defaults) {
        setSets(prev => prev.map(set => ({
          ...set,
          weight: defaults.weight || 0
        })))
      }
    } catch (error) {
      console.error('Failed to load defaults:', error)
    }
  }

  const updateSet = (index: number, field: 'weight' | 'reps', value: number) => {
    setSets(prev => {
      if (field === 'weight' && index === 0) {
        // When updating the first set's weight, auto-fill all sets with the same weight
        return prev.map((set) => ({
          ...set,
          weight: value
        }))
      } else {
        // Normal update for other fields or non-first sets
        return prev.map((set, i) => 
          i === index ? { ...set, [field]: value } : set
        )
      }
    })
  }

  const handleSubmit = async () => {
    if (sets.some(set => !set.weight || set.weight <= 0)) {
      alert('Please enter weight for all sets')
      return
    }

    if (sets.some(set => !set.reps || set.reps <= 0)) {
      alert('Please enter reps for all sets')
      return
    }

    setIsLoading(true)
    try {
      await onComplete(sets)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="btn-secondary mr-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>
        <div className="flex-1">
          <div className="medieval-title">{exercise.name}</div>
          <div className="text-gray-400">Enter your sets (4 × 10 reps)</div>
          {exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-medieval-400 hover:text-medieval-300 text-sm mt-2 transition-colors"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-1a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Exercise Demo
            </a>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="medieval-subtitle">Sets</h3>
          <p className="text-sm text-gray-400 mt-1">
            💡 Tip: Enter weight for Set #1 and it will auto-fill all sets
          </p>
        </div>
        <div className="card-body space-y-4">
          {sets.map((set, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="text-lg font-medium text-gray-300 w-8">#{index + 1}</div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">
                  Weight {index === 0 && <span className="text-medieval-400 text-xs">(auto-fills all sets)</span>}
                </label>
                <input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => updateSet(index, 'weight', Number(e.target.value) || 0)}
                  className="input-field w-full"
                  placeholder="Enter weight"
                  min="0"
                  step="0.5"
                  inputMode="numeric"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Reps</label>
                <input
                  type="number"
                  value={set.reps || ''}
                  onChange={(e) => updateSet(index, 'reps', Number(e.target.value) || 1)}
                  className="input-field w-full"
                  placeholder="Enter reps"
                  min="1"
                  inputMode="numeric"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="btn-primary px-8 py-3 text-lg"
        >
          {isLoading ? 'Saving...' : 'Save Exercise'}
        </button>
      </div>
    </div>
  )
}
