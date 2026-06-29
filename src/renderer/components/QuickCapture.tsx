import React, { useState, useEffect, useRef } from 'react'
import type { NoteImage } from '../types'

interface QuickCaptureProps {
  onSave?: () => void
}

export default function QuickCapture({ onSave }: QuickCaptureProps) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [images, setImages] = useState<NoteImage[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handleFocus = () => {
      inputRef.current?.focus()
    }

    window.addEventListener('capture:focus', handleFocus)
    inputRef.current?.focus()

    return () => {
      window.removeEventListener('capture:focus', handleFocus)
    }
  }, [])

  const handleSave = async () => {
    const text = content.trim()
    if (!text && images.length === 0) return

    setSaving(true)
    try {
      const note = await window.clipCaptureAPI.notes.create({
        content: text,
        source: 'quick_capture',
        images: images.length > 0 ? images : undefined
      })

      // AI auto-analyze in background (only for text content)
      if (text) {
        window.clipCaptureAPI.ai.analyze(text).then((result) => {
          window.clipCaptureAPI.notes.update(note.id, {
            title: result.title,
            category: result.category,
            summary: result.summary || null
          }).catch(() => {})
        }).catch(() => {})
      }

      setContent('')
      setImages([])
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      onSave?.()

      setTimeout(() => {
        window.clipCaptureAPI.window.hideQuickCapture()
      }, 300)
    } catch (error) {
      console.error('Failed to save note:', error)
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
      <textarea
        ref={inputRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder="输入笔记... (Cmd+Enter 保存, Esc 关闭，支持粘贴图片)"
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
  )
}
