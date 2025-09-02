import { useState, useEffect } from 'react'
import { db } from '../lib/database'
import { Workout, Set, Exercise } from '../types/database'
import { formatDate, getDateRange, calculate1RM, formatDuration } from '../lib/utils'
import { 
  CalendarIcon, 
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function History() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [workoutSets, setWorkoutSets] = useState<Set[]>([])
  const [dateRange, setDateRange] = useState(30) // days
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWorkouts()
    loadExercises()
  }, [dateRange])

  const loadWorkouts = async () => {
    try {
      setIsLoading(true)
      const { start, end } = getDateRange(dateRange)
      const workoutList = await db.getWorkoutsByDateRange(start, end)
      setWorkouts(workoutList)
    } catch (error) {
      console.error('Failed to load workouts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExercises = async () => {
    try {
      const exerciseList = await db.exercises.toArray()
      setExercises(exerciseList)
    } catch (error) {
      console.error('Failed to load exercises:', error)
    }
  }

  const loadWorkoutDetails = async (workout: Workout) => {
    try {
      const sets = await db.sets
        .where('workoutId')
        .equals(workout.id!)
        .toArray()
      setWorkoutSets(sets)
      setSelectedWorkout(workout)
    } catch (error) {
      console.error('Failed to load workout details:', error)
    }
  }

  const deleteWorkout = async (workoutId: number) => {
    if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      return
    }

    try {
      // Delete all sets first
      await db.sets.where('workoutId').equals(workoutId).delete()
      // Delete the workout
      await db.workouts.delete(workoutId)
      
      // Reload workouts
      loadWorkouts()
      
      // Clear selected workout if it was deleted
      if (selectedWorkout?.id === workoutId) {
        setSelectedWorkout(null)
        setWorkoutSets([])
      }
    } catch (error) {
      console.error('Failed to delete workout:', error)
    }
  }

  // Removed unused functions

  const groupedSets = workoutSets.reduce((acc, set) => {
    const exerciseId = set.exerciseId
    if (!acc[exerciseId]) {
      acc[exerciseId] = []
    }
    acc[exerciseId].push(set)
    return acc
  }, {} as Record<number, Set[]>)

  const calculateTotalVolume = (sets: Set[]) => {
    return sets.reduce((total, set) => total + (set.weight * set.reps), 0)
  }

  const calculateMaxWeight = (sets: Set[]) => {
    return Math.max(...sets.map(set => set.weight))
  }

  const calculateMaxReps = (sets: Set[]) => {
    return Math.max(...sets.map(set => set.reps))
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="medieval-title mb-4">Loading History</div>
        <div className="text-gray-400">Gathering your training records...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="medieval-title">Training History</div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="input-field"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workout List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="medieval-subtitle">Workouts ({workouts.length})</h3>
            </div>
            <div className="card-body">
              {workouts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p>No workouts found in this time period</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workouts.map((workout) => (
                    <div
                      key={workout.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedWorkout?.id === workout.id
                          ? 'border-medieval-500 bg-medieval-900/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => loadWorkoutDetails(workout)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">
                            {formatDate(workout.date)}
                          </div>
                          {workout.notes && (
                            <div className="text-sm text-gray-400 truncate">
                              {workout.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {workout.duration && (
                            <div className="text-xs text-gray-400">
                              {formatDuration(workout.duration)}
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteWorkout(workout.id!)
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workout Details */}
        <div className="lg:col-span-2">
          {selectedWorkout ? (
            <div className="space-y-4">
              {/* Workout Header */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="medieval-subtitle">
                        {formatDate(selectedWorkout.date)}
                      </h3>
                      {selectedWorkout.notes && (
                        <p className="text-gray-400 mt-1">{selectedWorkout.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {selectedWorkout.duration && (
                        <div className="text-sm text-gray-400">
                          Duration: {formatDuration(selectedWorkout.duration)}
                        </div>
                      )}
                      <div className="text-sm text-gray-400">
                        {workoutSets.length} sets
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercise Summary */}
              {Object.entries(groupedSets).map(([exerciseId, sets]) => {
                const exercise = exercises.find(e => e.id === Number(exerciseId))
                if (!exercise) return null

                const totalVolume = calculateTotalVolume(sets)
                const maxWeight = calculateMaxWeight(sets)
                const maxReps = calculateMaxReps(sets)

                return (
                  <div key={exerciseId} className="card">
                    <div className="card-header">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{exercise.name}</div>
                          <div className="text-sm text-gray-400">{exercise.muscleGroup}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-400">{sets.length} sets</div>
                          <div className="text-medieval-400 font-medium">
                            {totalVolume.toLocaleString()} lbs total
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-medieval-400">
                            {maxWeight}
                          </div>
                          <div className="text-xs text-gray-400">Max Weight</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-medieval-400">
                            {maxReps}
                          </div>
                          <div className="text-xs text-gray-400">Max Reps</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-medieval-400">
                            {Math.round(totalVolume / sets.length)}
                          </div>
                          <div className="text-xs text-gray-400">Avg Volume</div>
                        </div>
                      </div>

                      {/* Sets */}
                      <div className="space-y-2">
                        {sets.map((set) => (
                          <div key={set.id} className="set-row">
                            <div className="flex-1">
                              <div className="text-sm text-gray-400">
                                {new Date(set.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <div className="text-white font-medium">{set.weight}</div>
                                <div className="text-xs text-gray-400">lbs</div>
                              </div>
                              <div className="text-center">
                                <div className="text-white font-medium">{set.reps}</div>
                                <div className="text-xs text-gray-400">reps</div>
                              </div>
                              {set.rpe && (
                                <div className="text-center">
                                  <div className="text-white font-medium">{set.rpe}</div>
                                  <div className="text-xs text-gray-400">RPE</div>
                                </div>
                              )}
                              <div className="text-center">
                                <div className="text-medieval-400 font-medium">
                                  {calculate1RM(set.weight, set.reps)}
                                </div>
                                <div className="text-xs text-gray-400">1RM</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-12">
                <EyeIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Select a workout to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
