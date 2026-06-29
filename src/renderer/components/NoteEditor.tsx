import React, { useState, useEffect, useRef } from 'react'
import type { Note, NoteImage } from '../types'

interface NoteEditorProps {
  note: Note
  onUpdate: (id: string, data: { title?: string; content?: string; summary?: string | null; images?: NoteImage[] }) => Promise<void>
  onClose: () => void
}

export default function NoteEditor({ note, onUpdate, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState(note.summary)
  const [summarizing, setSummarizing] = useState(false)
  const [images, setImages] = useState<NoteImage[]>(note.images ?? [])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setSummary(note.summary)
    setImages(note.images ?? [])
  }, [note.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(note.id, { title, content, images })
    } finally {
      setSaving(false)
    }
  }

  const handleSummarize = async () => {
    setSummarizing(true)
    try {
      const result = await window.clipCaptureAPI.ai.summarize(content)
      setSummary(result)
      await onUpdate(note.id, { summary: result })
    } catch (error) {
      console.error('Failed to summarize:', error)
    } finally {
      setSummarizing(false)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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

  const handleRemoveImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
    const placeholderRegex = new RegExp(`!\\[image\\]\\(id:${imageId}\\)`, 'g')
    setContent(prev => prev.replace(placeholderRegex, ''))
  }

  // Parse content to find referenced image IDs
  const imagePlaceholderRegex = /!\[image\]\(id:([^)]+)\)/g
  const contentImageIds = new Set(
    Array.from(content.matchAll(imagePlaceholderRegex)).map(m => m[1])
  )
  const activeImages = images.filter(img => contentImageIds.has(img.id))

  return (
    <div className="note-editor">
      <div className="note-editor-toolbar">
        <button className="toolbar-btn" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
        <button
          className="toolbar-btn"
          onClick={handleSummarize}
          disabled={summarizing || !content.trim()}
        >
          {summarizing ? '生成中...' : 'AI 摘要'}
        </button>
        <button className="toolbar-btn toolbar-btn-secondary" onClick={onClose}>
          返回
        </button>
      </div>

      <div className="note-editor-body">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题"
          className="editor-title"
        />

        {summary && (
          <div className="editor-summary">
            <strong>摘要：</strong> {summary}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          placeholder="开始写笔记...（支持粘贴图片）"
          className="editor-content"
        />

        {activeImages.length > 0 && (
          <div className="editor-images">
            {activeImages.map((img) => (
              <div key={img.id} className="editor-image-item">
                <img src={img.data} alt="" className="editor-image" />
                <button
                  className="editor-image-remove"
                  onClick={() => handleRemoveImage(img.id)}
                  title="删除图片"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
