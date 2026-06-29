import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

interface NoteImage {
  id: string
  data: string
}

type BlockType = 'text' | 'bullet' | 'numbered' | 'todo' | 'heading1' | 'heading2' | 'heading3'

interface Block {
  id: string
  type: BlockType
  content: string
  checked?: boolean
  indent: number
  loggedAt?: string
}

interface NoteRecord {
  id: string
  title: string
  content: string
  summary: string | null
  category: string
  tags: string[]
  images: NoteImage[]
  blocks?: Block[]
  source: 'quick_capture' | 'clipboard' | 'manual'
  created_at: string
  updated_at: string
}

interface NoteFilters {
  search?: string
  tag?: string
  source?: string
  category?: string
  limit?: number
  offset?: number
}

let notes: NoteRecord[] = []
let dbPath = ''

function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'notes.json')
}

function loadFromDisk(): void {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8')
      notes = JSON.parse(data) as NoteRecord[]
    } else {
      notes = []
    }
  } catch {
    notes = []
  }
}

function saveToDisk(): void {
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(dbPath, JSON.stringify(notes, null, 2), 'utf-8')
}

export function initDatabase(): void {
  dbPath = getDbPath()
  loadFromDisk()
}

export function listNotes(filters: NoteFilters = {}): { notes: NoteRecord[]; total: number } {
  let filtered = [...notes]

  if (filters.search) {
    const term = filters.search.toLowerCase()
    filtered = filtered.filter(
      (n) => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
    )
  }

  if (filters.tag) {
    filtered = filtered.filter((n) => n.tags.includes(filters.tag!))
  }

  if (filters.source) {
    filtered = filtered.filter((n) => n.source === filters.source)
  }

  if (filters.category) {
    filtered = filtered.filter((n) => n.category === filters.category)
  }

  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const total = filtered.length
  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0
  const paginated = filtered.slice(offset, offset + limit)

  return { notes: paginated, total }
}

export function getNote(id: string): NoteRecord | null {
  return notes.find((n) => n.id === id) ?? null
}

export function createNote(data: {
  title?: string
  content: string
  tags?: string[]
  source?: string
  category?: string
  images?: NoteImage[]
  blocks?: Block[]
}): NoteRecord {
  const now = new Date().toISOString()

  const note: NoteRecord = {
    id: uuidv4(),
    title: data.title ?? '',
    content: data.content,
    summary: null,
    category: data.category ?? '',
    tags: data.tags ?? [],
    images: data.images ?? [],
    blocks: data.blocks ?? [],
    source: (data.source as NoteRecord['source']) ?? 'manual',
    created_at: now,
    updated_at: now
  }

  notes.unshift(note)
  saveToDisk()
  return note
}

export function updateNote(
  id: string,
  data: { title?: string; content?: string; tags?: string[]; summary?: string | null; category?: string; images?: NoteImage[]; blocks?: Block[] }
): NoteRecord {
  const index = notes.findIndex((n) => n.id === id)
  if (index === -1) throw new Error(`Note not found: ${id}`)

  const existing = notes[index]

  if (data.title !== undefined) existing.title = data.title
  if (data.content !== undefined) existing.content = data.content
  if (data.tags !== undefined) existing.tags = data.tags
  if (data.summary !== undefined) existing.summary = data.summary
  if (data.category !== undefined) existing.category = data.category
  if (data.images !== undefined) existing.images = data.images
  if (data.blocks !== undefined) existing.blocks = data.blocks

  existing.updated_at = new Date().toISOString()

  saveToDisk()
  return { ...existing }
}

export function deleteNote(id: string): void {
  const index = notes.findIndex((n) => n.id === id)
  if (index === -1) throw new Error(`Note not found: ${id}`)

  notes.splice(index, 1)
  saveToDisk()
}

export function saveImage(dataUrl: string): NoteImage {
  const id = uuidv4()
  return { id, data: dataUrl }
}

export function closeDatabase(): void {
  saveToDisk()
}
