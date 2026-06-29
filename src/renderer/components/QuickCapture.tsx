import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { Note, NoteImage, Block } from '../types'

interface QuickCaptureProps {
  onSave?: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function QuickCapture({ onSave }: QuickCaptureProps) {
  const [mode, setMode] = useState<'new' | 'append'>('new')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [images, setImages] = useState<NoteImage[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Auto-size window to fit content exactly
  const autoResize = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.querySelector('.quick-capture')
      if (el) {
        const height = Math.ceil(el.getBoundingClientRect().height)
        window.clipCaptureAPI.window.resizeQuickCapture(height)
      }
    })
  }, [])

  // Focus input & auto-size on window show
  useEffect(() => {
    const handleFocus = () => {
      autoResize()
      if (mode === 'append') {
        setTimeout(() => searchRef.current?.focus(), 50)
      } else {
        inputRef.current?.focus()
      }
    }
    window.addEventListener('capture:focus', handleFocus)
    inputRef.current?.focus()
    return () => window.removeEventListener('capture:focus', handleFocus)
  }, [mode, autoResize])

  // Auto-size when content changes
  useEffect(() => {
    autoResize()
    if (mode === 'append') {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [mode, selectedNote, results, resultsOpen, autoResize])

  // Debounced note search
  useEffect(() => {
    if (mode !== 'append') return
    const timer = setTimeout(async () => {
      try {
        const result = await window.clipCaptureAPI.notes.list({
          search: searchQuery || undefined,
          limit: 20
        })
        setResults(result.notes)
      } catch { /* ignore */ }
    }, 150)
    return () => clearTimeout(timer)
  }, [searchQuery, mode])

  const handleSelectNote = useCallback((note: Note) => {
    setSelectedNote(note)
    setResultsOpen(false)
    setSearchQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const handleSave = async () => {
    const text = content.trim()
    if (!text && images.length === 0) return

    setSaving(true)
    try {
      if (mode === 'append' && selectedNote) {
        // Append to existing note
        const separator = selectedNote.content ? '\n\n' : ''
        const newContent = selectedNote.content + separator + text
        const newImages = [...selectedNote.images, ...images]

        // If note uses blocks, add a new text block so the editor shows it
        const newBlocks: Block[] | undefined = selectedNote.blocks && text
          ? [...selectedNote.blocks, { id: crypto.randomUUID(), type: 'text', content: text, indent: 0 }]
          : undefined

        await window.clipCaptureAPI.notes.update(selectedNote.id, {
          content: newContent,
          images: newImages,
          blocks: newBlocks
        })
      } else {
        // Create new note
        const note = await window.clipCaptureAPI.notes.create({
          content: text,
          source: 'quick_capture',
          images: images.length > 0 ? images : undefined
        })

        // AI auto-analyze in background
        if (text) {
          window.clipCaptureAPI.ai.analyze(text).then((result) => {
            window.clipCaptureAPI.notes.update(note.id, {
              title: result.title,
              category: result.category,
              summary: result.summary || null
            }).catch(() => {})
          }).catch(() => {})
        }
      }

      setContent('')
      setImages([])
      setSelectedNote(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      onSave?.()

      setTimeout(() => {
        window.clipCaptureAPI.window.hideQuickCapture()
      }, 300)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    if (!imageItem) return

    e.preventDefault()
    const file = imageItem.getAsFile()
    if (!file) return

    const textarea = e.currentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      try {
        const saved = await window.clipCaptureAPI.notes.saveImage(dataUrl)
        const placeholder = `![image](id:${saved.id})`
        const newContent = content.substring(0, start) + placeholder + content.substring(end)
        setContent(newContent)
        setImages(prev => [...prev, { id: saved.id, data: dataUrl }])
      } catch (err) {
        console.error('Failed to save image:', err)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      window.clipCaptureAPI.window.hideQuickCapture()
      return
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="quick-capture">
      {/* Mode tabs */}
      <div className="quick-capture-tabs">
        <button
          className={'quick-capture-tab' + (mode === 'new' ? ' active' : '')}
          onClick={() => setMode('new')}
        >
          ＋ 新建
        </button>
        <button
          className={'quick-capture-tab' + (mode === 'append' ? ' active' : '')}
          onClick={() => setMode('append')}
        >
          📝 追加
        </button>
      </div>

      {/* Note selector (append mode) */}
      {mode === 'append' && (
        <div className="quick-capture-selector">
          {selectedNote ? (
            <div className="quick-capture-selected">
              <span className="quick-capture-selected-title">
                {selectedNote.title || '无标题'}
              </span>
              <button
                className="quick-capture-selected-clear"
                onClick={() => { setSelectedNote(null); setResultsOpen(true); searchRef.current?.focus() }}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setResultsOpen(true) }}
                onFocus={() => setResultsOpen(true)}
                placeholder="搜索笔记..."
                className="quick-capture-search"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setResultsOpen(false)
                }}
              />
              {resultsOpen && results.length > 0 && (
                <div className="quick-capture-results">
                  {results.map(n => (
                    <div
                      key={n.id}
                      className="quick-capture-result-item"
                      onClick={() => handleSelectNote(n)}
                    >
                      <div className="quick-capture-result-title">
                        {n.title || '无标题'}
                      </div>
                      <div className="quick-capture-result-meta">
                        {formatDate(n.created_at)}
                        {n.category && <span> · {n.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {resultsOpen && searchQuery && results.length === 0 && (
                <div className="quick-capture-empty">未找到匹配的笔记</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Text input */}
      <div className="quick-capture-input-row">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'append' && selectedNote ? '输入要追加的内容...' : '输入笔记... (Cmd+Enter 保存, Esc 关闭)'}
          rows={1}
          className="quick-capture-input"
        />
        <div className="quick-capture-actions">
          {saved ? (
            <span className="quick-capture-saved">已保存</span>
          ) : (
            <button
              className="quick-capture-btn"
              onClick={handleSave}
              disabled={saving || (!content.trim() && images.length === 0)}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* Selected note indicator */}
      {mode === 'append' && selectedNote && (
        <div className="quick-capture-append-hint">
          追加到：{selectedNote.title || '无标题'}
        </div>
      )}
    </div>
  )
}
