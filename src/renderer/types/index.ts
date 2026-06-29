export interface NoteImage {
  id: string
  data: string
}

export type BlockType = 'text' | 'bullet' | 'numbered' | 'todo' | 'heading1' | 'heading2' | 'heading3'

export interface Block {
  id: string
  type: BlockType
  content: string
  checked?: boolean
  indent: number
}

export interface Note {
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

export interface CreateNoteInput {
  title?: string
  content: string
  tags?: string[]
  source?: Note['source']
  category?: string
  images?: NoteImage[]
  blocks?: Block[]
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  tags?: string[]
  summary?: string | null
  category?: string
  images?: NoteImage[]
  blocks?: Block[]
}

export interface NoteFilters {
  search?: string
  tag?: string
  source?: Note['source']
  category?: string
  limit?: number
  offset?: number
}

export interface ClipCaptureAPI {
  notes: {
    list: (filters?: NoteFilters) => Promise<{ notes: Note[]; total: number }>
    get: (id: string) => Promise<Note | null>
    create: (input: CreateNoteInput) => Promise<Note>
    update: (id: string, input: UpdateNoteInput) => Promise<Note>
    delete: (id: string) => Promise<void>
    saveImage: (dataUrl: string) => Promise<NoteImage>
    onChanged: (callback: () => void) => void
  }
  ai: {
    generateTitle: (content: string) => Promise<string>
    summarize: (content: string) => Promise<string>
    analyze: (content: string) => Promise<{ title: string; category: string; summary: string }>
    batchCategorize: (ids: string[]) => Promise<Array<{ id: string; title: string; category: string; summary: string | null }>>
  }
  config: {
    getApiKey: () => Promise<string>
    setApiKey: (key: string) => Promise<void>
    getApiBaseUrl: () => Promise<string>
    setApiBaseUrl: (url: string) => Promise<void>
    getModel: () => Promise<string>
    setModel: (model: string) => Promise<void>
  }
  window: {
    hideQuickCapture: () => void
    showMainWindow: () => void
    resizeQuickCapture: (height: number) => void
  }
}

export interface TrayState {
  isOpen: boolean
}
