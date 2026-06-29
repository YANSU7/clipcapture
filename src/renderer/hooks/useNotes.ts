import { useState, useEffect, useCallback } from 'react'
import type { Note, NoteFilters, CreateNoteInput, UpdateNoteInput } from '../types'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<NoteFilters>({})

  const loadNotes = useCallback(async (f?: NoteFilters) => {
    setLoading(true)
    try {
      const result = await window.clipCaptureAPI.notes.list(f ?? filters)
      setNotes(result.notes)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const createNote = async (input: CreateNoteInput): Promise<Note> => {
    const note = await window.clipCaptureAPI.notes.create(input)
    await loadNotes()
    return note
  }

  const updateNote = async (id: string, input: UpdateNoteInput): Promise<Note> => {
    const note = await window.clipCaptureAPI.notes.update(id, input)
    await loadNotes()
    return note
  }

  const deleteNote = async (id: string): Promise<void> => {
    await window.clipCaptureAPI.notes.delete(id)
    await loadNotes()
  }

  const search = (search: string) => {
    const newFilters = { ...filters, search }
    setFilters(newFilters)
  }

  const setCategoryFilter = (category: string) => {
    const newFilters = { ...filters, category }
    setFilters(newFilters)
  }

  const refresh = useCallback(() => {
    loadNotes(filters)
  }, [loadNotes, filters])

  const batchCategorize = async (): Promise<void> => {
    // Get all notes without a category
    const allNotes = await window.clipCaptureAPI.notes.list({ limit: 999 })
    const uncategorized = allNotes.notes.filter((n) => !n.category)

    if (uncategorized.length === 0) return

    const ids = uncategorized.map((n) => n.id)
    await window.clipCaptureAPI.ai.batchCategorize(ids)
    await loadNotes()
  }

  const getCategories = (): string[] => {
    const cats = new Set(notes.map((n) => n.category).filter(Boolean))
    return Array.from(cats).sort()
  }

  return {
    notes,
    total,
    loading,
    filters,
    search,
    setCategoryFilter,
    createNote,
    updateNote,
    deleteNote,
    refresh,
    batchCategorize,
    getCategories
  }
}
