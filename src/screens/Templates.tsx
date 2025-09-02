import { useState, useEffect } from 'react'
import { db } from '../lib/database'
import { Template, Exercise } from '../types/database'
import { 
  PlusIcon, 
  PlayIcon, 
  TrashIcon,
  PencilIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
    loadExercises()
  }, [])

  const loadTemplates = async () => {
    try {
      const templateList = await db.templates.toArray()
      setTemplates(templateList)
    } catch (error) {
      console.error('Failed to load templates:', error)
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

  const createTemplate = async (templateData: Omit<Template, 'id'>) => {
    try {
      const id = await db.templates.add(templateData)
      const newTemplate = { ...templateData, id: id as number }
      setTemplates(prev => [...prev, newTemplate])
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  const updateTemplate = async (templateId: number, templateData: Partial<Template>) => {
    try {
      await db.templates.update(templateId, {
        ...templateData,
        updatedAt: new Date()
      })
      
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, ...templateData, updatedAt: new Date() }
          : t
      ))
      setEditingTemplate(null)
    } catch (error) {
      console.error('Failed to update template:', error)
    }
  }

  const deleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    try {
      await db.templates.delete(templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const useTemplate = async (_template: Template) => {
    try {
      // For now, redirect to Today screen where they can select muscle group
      // The old template system is being replaced with muscle group templates
      alert('Template system has been updated! Please use the new muscle group workout system on the Today screen.')
      window.location.hash = '#/'
    } catch (error) {
      console.error('Failed to use template:', error)
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
        <div className="medieval-title">Workout Templates</div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="medieval-subtitle">{template.name}</h3>
                  <div className="text-sm text-gray-400">
                    {template.orderedExerciseList.length} exercises
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id!)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* Exercise List */}
              <div className="space-y-2 mb-4">
                {template.orderedExerciseList.map((item, index) => {
                  const exercise = exercises.find(e => e.id === item.exerciseId)
                  if (!exercise) return null

                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{exercise.name}</div>
                        <div className="text-xs text-gray-400">{exercise.muscleGroup}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-medieval-400">
                          {item.defaultSets} × {item.defaultReps}
                        </div>
                        {item.defaultWeight && item.defaultWeight > 0 && (
                          <div className="text-xs text-gray-400">
                            {item.defaultWeight} lbs
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action Button */}
              <button
                onClick={() => useTemplate(template)}
                className="btn-primary w-full"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Templates Message */}
      {templates.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <BookOpenIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <div className="medieval-subtitle mb-2">No Templates Yet</div>
            <p className="text-gray-400 mb-6">
              Create workout templates to quickly start your training sessions
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Template
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {(isCreating || editingTemplate) && (
        <TemplateForm
          exercises={exercises}
          template={editingTemplate}
          onCreate={createTemplate}
          onUpdate={updateTemplate}
          onCancel={() => {
            setIsCreating(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </div>
  )
}

interface TemplateFormProps {
  exercises: Exercise[]
  template: Template | null
  onCreate: (template: Omit<Template, 'id'>) => void
  onUpdate: (templateId: number, template: Partial<Template>) => void
  onCancel: () => void
}

function TemplateForm({ exercises, template, onCreate, onUpdate, onCancel }: TemplateFormProps) {
  const [name, setName] = useState(template?.name || '')
  const [selectedExercises, setSelectedExercises] = useState<Array<{
    exerciseId: number
    defaultSets: number
    defaultReps: number
    defaultWeight?: number
  }>>(template?.orderedExerciseList || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (name.trim() && selectedExercises.length > 0) {
      const templateData = {
        name: name.trim(),
        orderedExerciseList: selectedExercises,
        createdAt: template?.createdAt || new Date(),
        updatedAt: new Date()
      }

      if (template) {
        onUpdate(template.id!, templateData)
      } else {
        onCreate(templateData)
      }
    }
  }

  const addExercise = () => {
    if (exercises.length > 0) {
      setSelectedExercises(prev => [
        ...prev,
        {
          exerciseId: exercises[0].id!,
          defaultSets: 3,
          defaultReps: 8,
          defaultWeight: 0
        }
      ])
    }
  }

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: string, value: number) => {
    setSelectedExercises(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setSelectedExercises(prev => {
        const newList = [...prev]
        const temp = newList[index]
        newList[index] = newList[index - 1]
        newList[index - 1] = temp
        return newList
      })
    } else if (direction === 'down' && index < selectedExercises.length - 1) {
      setSelectedExercises(prev => {
        const newList = [...prev]
        const temp = newList[index]
        newList[index] = newList[index + 1]
        newList[index + 1] = temp
        return newList
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="medieval-subtitle">
            {template ? 'Edit Template' : 'Create Template'}
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Push Day, Leg Day"
                required
              />
            </div>

            {/* Exercise List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Exercises
                </label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="btn-secondary text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Exercise
                </button>
              </div>

              {selectedExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No exercises added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedExercises.map((item, index) => {
                    const exercise = exercises.find(e => e.id === item.exerciseId)
                    if (!exercise) return null

                    return (
                      <div key={index} className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <select
                              value={item.exerciseId}
                              onChange={(e) => updateExercise(index, 'exerciseId', Number(e.target.value))}
                              className="input-field w-full"
                            >
                              {exercises.map((ex) => (
                                <option key={ex.id} value={ex.id}>
                                  {ex.name} ({ex.muscleGroup})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            <button
                              type="button"
                              onClick={() => moveExercise(index, 'up')}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-white disabled:opacity-50 p-1"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveExercise(index, 'down')}
                              disabled={index === selectedExercises.length - 1}
                              className="text-gray-400 hover:text-white disabled:opacity-50 p-1"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExercise(index)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Sets</label>
                            <input
                              type="number"
                              value={item.defaultSets}
                              onChange={(e) => updateExercise(index, 'defaultSets', Number(e.target.value))}
                              className="input-field w-full"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Reps</label>
                            <input
                              type="number"
                              value={item.defaultReps}
                              onChange={(e) => updateExercise(index, 'defaultReps', Number(e.target.value))}
                              className="input-field w-full"
                              min="1"
                              max="50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Weight (lbs)</label>
                            <input
                              type="number"
                              value={item.defaultWeight}
                              onChange={(e) => updateExercise(index, 'defaultWeight', Number(e.target.value))}
                              className="input-field w-full"
                              min="0"
                              step="0.5"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={!name.trim() || selectedExercises.length === 0}
              >
                {template ? 'Update Template' : 'Create Template'}
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
