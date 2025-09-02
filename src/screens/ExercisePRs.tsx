import { useState, useEffect } from 'react'
import { db } from '../lib/database'
import { Exercise, Set } from '../types/database'
import { calculate1RM, formatDate, getMuscleGroupColor } from '../lib/utils'
import { 
  TrophyIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ExercisePerformance {
  exercise: Exercise
  sets: Set[]
  maxWeight: number
  maxReps: number
  max1RM: number
  totalVolume: number
  trend: Array<{
    date: string
    weight: number
    reps: number
    oneRM: number
  }>
}

export default function ExercisePRs() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exercisePerformances, setExercisePerformances] = useState<ExercisePerformance[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExercises()
  }, [])

  useEffect(() => {
    if (exercises.length > 0) {
      loadExercisePerformances()
    }
  }, [exercises])

  const loadExercises = async () => {
    try {
      const exerciseList = await db.exercises.toArray()
      setExercises(exerciseList)
    } catch (error) {
      console.error('Failed to load exercises:', error)
    }
  }

  const loadExercisePerformances = async () => {
    try {
      setIsLoading(true)
      const performances: ExercisePerformance[] = []

      for (const exercise of exercises) {
        const sets = await db.getExerciseHistory(exercise.id!, 100)
        
        if (sets.length > 0) {
          const maxWeight = Math.max(...sets.map(s => s.weight))
          const maxReps = Math.max(...sets.map(s => s.reps))
          const max1RM = Math.max(...sets.map(s => calculate1RM(s.weight, s.reps)))
          const totalVolume = sets.reduce((sum, s) => sum + (s.weight * s.reps), 0)

          // Create trend data for chart
          const trend = sets
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(set => ({
              date: formatDate(set.timestamp),
              weight: set.weight,
              reps: set.reps,
              oneRM: calculate1RM(set.weight, set.reps)
            }))

          performances.push({
            exercise,
            sets,
            maxWeight,
            maxReps,
            max1RM,
            totalVolume,
            trend
          })
        }
      }

      // Sort by max 1RM descending
      performances.sort((a, b) => b.max1RM - a.max1RM)
      setExercisePerformances(performances)
    } catch (error) {
      console.error('Failed to load exercise performances:', error)
    } finally {
      setIsLoading(false)
    }
  }



  const getRecentProgress = (exerciseId: number) => {
    const performance = exercisePerformances.find(p => p.exercise.id === exerciseId)
    if (!performance || performance.trend.length < 2) return null

    const recent = performance.trend.slice(-5)
    const first = recent[0].oneRM
    const last = recent[recent.length - 1].oneRM
    const change = last - first
    const percentChange = (change / first) * 100

    return {
      change,
      percentChange,
      isPositive: change > 0
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="medieval-title mb-4">Loading Personal Records</div>
        <div className="text-gray-400">Calculating your achievements...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="medieval-title">Personal Records & Progress</div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercisePerformances.map((performance) => (
          <div key={performance.exercise.id} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{performance.exercise.name}</div>
                  <div className="text-sm text-gray-400">{performance.exercise.muscleGroup}</div>
                </div>
                <div className={`muscle-group-badge ${getMuscleGroupColor(performance.exercise.muscleGroup)}`}>
                  {performance.exercise.muscleGroup}
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* PR Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-medieval-400">
                    {performance.maxWeight}
                  </div>
                  <div className="text-xs text-gray-400">Max Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-medieval-400">
                    {performance.maxReps}
                  </div>
                  <div className="text-xs text-gray-400">Max Reps</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-medieval-400">
                    {performance.max1RM}
                  </div>
                  <div className="text-xs text-gray-400">1RM</div>
                </div>
              </div>

              {/* Progress Indicator */}
              {(() => {
                const progress = getRecentProgress(performance.exercise.id!)
                if (!progress) return null

                return (
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Recent Progress</span>
                      <div className={`flex items-center ${progress.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {progress.isPositive ? (
                          "PLACEHOLDER"
                        ) : (
                          "PLACEHOLDER"
                        )}
                        {progress.isPositive ? '+' : ''}{progress.change} lbs
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {progress.percentChange > 0 ? '+' : ''}{progress.percentChange.toFixed(1)}% change
                    </div>
                  </div>
                )
              })()}

              {/* Mini Chart */}
              {performance.trend.length > 1 && (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performance.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="oneRM"
                        stroke="#F2751A"
                        strokeWidth={2}
                        dot={{ fill: '#F2751A', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#F2751A', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => setSelectedExercise(performance.exercise)}
                className="btn-primary w-full mt-4"
              >
                <TrophyIcon className="h-4 w-4 mr-2" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Exercises Message */}
      {exercisePerformances.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <TrophyIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <div className="medieval-subtitle mb-2">No Personal Records Yet</div>
            <p className="text-gray-400">
              Start tracking your workouts to see your progress and personal records!
            </p>
          </div>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          performance={exercisePerformances.find(p => p.exercise.id === selectedExercise.id)!}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  )
}

interface ExerciseDetailModalProps {
  exercise: Exercise
  performance: ExercisePerformance
  onClose: () => void
}

function ExerciseDetailModal({ exercise, performance, onClose }: ExerciseDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="medieval-subtitle">{exercise.name}</h3>
              <div className="text-sm text-gray-400">{exercise.muscleGroup}</div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2"
            >
              ×
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-medieval-400">
                {performance.maxWeight}
              </div>
              <div className="text-sm text-gray-400">Max Weight (lbs)</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-medieval-400">
                {performance.maxReps}
              </div>
              <div className="text-sm text-gray-400">Max Reps</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-medieval-400">
                {performance.max1RM}
              </div>
              <div className="text-sm text-gray-400">1RM (lbs)</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-medieval-400">
                {performance.sets.length}
              </div>
              <div className="text-sm text-gray-400">Total Sets</div>
            </div>
          </div>

          {/* Progress Chart */}
          {performance.trend.length > 1 && (
            <div className="mb-6">
              <h4 className="medieval-subtitle mb-4">1RM Progress</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performance.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="oneRM"
                      stroke="#F2751A"
                      strokeWidth={3}
                      dot={{ fill: '#F2751A', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#F2751A', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Sets */}
          <div>
            <h4 className="medieval-subtitle mb-4">Recent Sets</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {performance.sets.slice(0, 20).map((set) => (
                <div key={set.id} className="set-row">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">
                      {formatDate(set.timestamp)}
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
      </div>
    </div>
  )
}
