import { useState, useEffect } from 'react'
import { db } from '../lib/database'
import { MuscleGroup, Exercise } from '../types/database'
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function Templates() {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await db.seedInitialData()
      
      const [muscleGroupList, exerciseList] = await Promise.all([
        db.getMuscleGroups(),
        db.exercises.toArray()
      ])
      
      setMuscleGroups(muscleGroupList)
      setExercises(exerciseList)
      
      // Expand all groups by default
      const allIdentifiers = new Set(muscleGroupList.map(g => g.identifier))
      setExpandedGroups(allIdentifiers)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGroup = (identifier: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(identifier)) {
        newSet.delete(identifier)
      } else {
        newSet.add(identifier)
      }
      return newSet
    })
  }

  const getExercisesForGroup = (muscleGroupIdentifier: string) => {
    return exercises.filter(exercise => exercise.muscleGroup === muscleGroupIdentifier)
  }

  const createExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    try {
      const id = await db.exercises.add(exerciseData)
      const newExercise = { ...exerciseData, id: id as number }
      setExercises(prev => [...prev, newExercise])
      setIsCreating(false)
      setSelectedMuscleGroup(null)
    } catch (error) {
      console.error('Failed to create exercise:', error)
      alert('Failed to create exercise. Please try again.')
    }
  }

  const updateExercise = async (exerciseId: number, exerciseData: Partial<Exercise>) => {
    try {
      await db.exercises.update(exerciseId, {
        ...exerciseData,
        updatedAt: new Date()
      })
      
      setExercises(prev => prev.map(e => 
        e.id === exerciseId 
          ? { ...e, ...exerciseData, updatedAt: new Date() }
          : e
      ))
      setEditingExercise(null)
    } catch (error) {
      console.error('Failed to update exercise:', error)
      alert('Failed to update exercise. Please try again.')
    }
  }

  const deleteExercise = async (exerciseId: number, exerciseName: string) => {
    if (!confirm(`Are you sure you want to delete "${exerciseName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await db.exercises.delete(exerciseId)
      setExercises(prev => prev.filter(e => e.id !== exerciseId))
    } catch (error) {
      console.error('Failed to delete exercise:', error)
      alert('Failed to delete exercise. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="medieval-title mb-4">Loading Templates</div>
        <div className="text-gray-400">Preparing your training plans...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="medieval-title">Workout Templates</div>
          <div className="text-gray-400 mt-1">Manage exercises by muscle group</div>
        </div>
      </div>

      {/* Muscle Group Templates */}
      <div className="space-y-4">
        {muscleGroups.map((muscleGroup) => {
          const groupExercises = getExercisesForGroup(muscleGroup.identifier)
          const isExpanded = expandedGroups.has(muscleGroup.identifier)
          
          return (
            <div key={muscleGroup.identifier + muscleGroup.id} className="card">
              {/* Muscle Group Header */}
              <div 
                className="card-header cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => toggleGroup(muscleGroup.identifier)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-2xl">{muscleGroup.icon}</span>
                      <div>
                        <h3 className="medieval-subtitle">{muscleGroup.name}</h3>
                        <div className="text-sm text-gray-400">
                          {groupExercises.length} exercises
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMuscleGroup(muscleGroup.identifier)
                        setIsCreating(true)
                      }}
                      className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-gray-600"
                      title="Add Exercise"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Exercises List */}
              {isExpanded && (
                <div className="card-body">
                  {groupExercises.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No exercises in this muscle group yet</p>
                      <button 
                        className="btn-secondary mt-4"
                        onClick={() => {
                          setSelectedMuscleGroup(muscleGroup.identifier)
                          setIsCreating(true)
                        }}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add First Exercise
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupExercises.map((exercise) => (
                        <div 
                          key={exercise.id} 
                          className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600 hover:border-gray-500 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <div className="text-sm font-medium text-white">{exercise.name}</div>
                                {exercise.aliases && exercise.aliases.length > 0 && (
                                  <div className="text-xs text-gray-400">
                                    Also known as: {exercise.aliases.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {exercise.videoUrl && (
                              <a
                                href={exercise.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 p-1 rounded"
                                title="Watch Demo"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingExercise(exercise)
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded"
                              title="Edit Exercise"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteExercise(exercise.id!, exercise.name)
                              }}
                              className="text-red-400 hover:text-red-300 p-1 rounded"
                              title="Remove Exercise"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* No Muscle Groups Message */}
      {muscleGroups.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <BookOpenIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <div className="medieval-subtitle mb-2">No Muscle Groups Found</div>
            <p className="text-gray-400">
              No muscle groups are configured. Please check your database setup.
            </p>
          </div>
        </div>
      )}

      {/* Create/Edit Exercise Modal */}
      {(isCreating || editingExercise) && (
        <ExerciseForm
          exercise={editingExercise}
          muscleGroup={selectedMuscleGroup || editingExercise?.muscleGroup || ''}
          muscleGroups={muscleGroups}
          onCreate={createExercise}
          onUpdate={updateExercise}
          onCancel={() => {
            setIsCreating(false)
            setEditingExercise(null)
            setSelectedMuscleGroup(null)
          }}
        />
      )}
    </div>
  )
}

interface ExerciseFormProps {
  exercise: Exercise | null
  muscleGroup: string
  muscleGroups: MuscleGroup[]
  onCreate: (exercise: Omit<Exercise, 'id'>) => void
  onUpdate: (exerciseId: number, exercise: Partial<Exercise>) => void
  onCancel: () => void
}

function ExerciseForm({ exercise, muscleGroup, muscleGroups, onCreate, onUpdate, onCancel }: ExerciseFormProps) {
  const [name, setName] = useState(exercise?.name || '')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(exercise?.muscleGroup || muscleGroup)
  const [aliases, setAliases] = useState(exercise?.aliases?.join(', ') || '')
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl || '')
  const [unitPreference, setUnitPreference] = useState<'lbs' | 'kg'>(exercise?.unitPreference || 'lbs')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (name.trim() && selectedMuscleGroup) {
      const exerciseData = {
        name: name.trim(),
        muscleGroup: selectedMuscleGroup,
        aliases: aliases.split(',').map(a => a.trim()).filter(a => a.length > 0),
        videoUrl: videoUrl.trim() || undefined,
        unitPreference,
        createdAt: exercise?.createdAt || new Date(),
        updatedAt: new Date()
      }

      if (exercise) {
        onUpdate(exercise.id!, exerciseData)
      } else {
        onCreate(exerciseData)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="medieval-subtitle">
            {exercise ? 'Edit Exercise' : 'Add New Exercise'}
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Exercise Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Exercise Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Bench Press, Squats"
                required
              />
            </div>

            {/* Muscle Group */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Muscle Group *
              </label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="input-field w-full"
                required
              >
                <option value="">Select a muscle group</option>
                {muscleGroups.map((group) => (
                  <option key={group.id} value={group.identifier}>
                    {group.icon} {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Aliases */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Aliases (optional)
              </label>
              <input
                type="text"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                className="input-field w-full"
                placeholder="Alternative names, separated by commas"
              />
              <p className="text-xs text-gray-400 mt-1">
                Example: DB Bench, Dumbbell Press, Chest Press
              </p>
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Demo Video URL (optional)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="input-field w-full"
                placeholder="https://youtube.com/..."
              />
            </div>

            {/* Unit Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unit Preference
              </label>
              <select
                value={unitPreference}
                onChange={(e) => setUnitPreference(e.target.value as 'lbs' | 'kg')}
                className="input-field w-full"
              >
                <option value="lbs">Pounds (lbs)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={!name.trim() || !selectedMuscleGroup}
              >
                {exercise ? 'Update Exercise' : 'Add Exercise'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}