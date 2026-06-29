import React, { useState, useCallback, useEffect } from 'react'
import type { Note, NoteImage } from './types'
import { useNotes } from './hooks/useNotes'
import QuickCapture from './components/QuickCapture'
import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import Settings from './components/Settings'

function getRoute(): 'capture' | 'main' {
  return window.location.hash === '#/capture' ? 'capture' : 'main'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [categorizing, setCategorizing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const {
    notes, total, loading, search, setCategoryFilter,
    createNote, updateNote, deleteNote, refresh,
    batchCategorize, getCategories
  } = useNotes()

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Refresh notes when window gains focus (e.g. after QuickCapture saves a note)
  useEffect(() => {
    const handleFocus = () => {
      if (getRoute() === 'main') {
        refresh()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh])

  // Listen for notes:changed IPC from main process (e.g. QuickCapture saved)
  useEffect(() => {
    window.clipCaptureAPI.notes.onChanged(() => {
      if (getRoute() === 'main') {
        refresh()
      }
    })
  }, [refresh])

  const handleSelectNote = useCallback((note: Note) => {
    setSelectedNote(note)
  }, [])

  const handleUpdateNote = useCallback(
    async (id: string, data: { title?: string; content?: string; summary?: string | null; images?: NoteImage[] }) => {
      await updateNote(id, data)
    },
    [updateNote]
  )

  const handleDeleteNote = useCallback(
    async (id: string) => {
      await deleteNote(id)
      if (selectedNote?.id === id) {
        setSelectedNote(null)
      }
    },
    [deleteNote, selectedNote]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      search(value)
    },
    [search]
  )

  const handleCategoryFilter = useCallback(
    (category: string) => {
      setActiveCategory(category)
      setCategoryFilter(category)
    },
    [setCategoryFilter]
  )

  const handleBatchCategorize = useCallback(async () => {
    setCategorizing(true)
    try {
      await batchCategorize()
    } finally {
      setCategorizing(false)
    }
  }, [batchCategorize])

  if (route === 'capture') {
    return <QuickCapture onSave={refresh} />
  }

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />
  }

  if (selectedNote) {
    return (
      <div className="app-layout">
        <NoteEditor
          note={selectedNote}
          onUpdate={handleUpdateNote}
          onClose={() => setSelectedNote(null)}
        />
      </div>
    )
  }

  const selectedId = (selectedNote as Note | null)?.id ?? null

  return (
    <div className="app-layout">
      <NoteList
        notes={notes}
        loading={loading}
        total={total}
        selectedId={selectedId}
        onSelect={handleSelectNote}
        onDelete={handleDeleteNote}
        search={searchValue}
        onSearchChange={handleSearchChange}
        onOpenSettings={() => setShowSettings(true)}
        onBatchCategorize={handleBatchCategorize}
        categorizing={categorizing}
        categories={getCategories()}
        activeCategory={activeCategory}
        onCategoryFilter={handleCategoryFilter}
      />
    </div>
  )
}
