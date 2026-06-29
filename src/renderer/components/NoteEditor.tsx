import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { Note, NoteImage, Block, BlockType } from '../types'
import BlockEditor, { type BlockEditorHandle } from './BlockEditor'

interface NoteEditorProps {
  note: Note
  onUpdate: (id: string, data: { title?: string; content?: string; summary?: string | null; images?: NoteImage[]; blocks?: Block[] }) => Promise<void>
  onClose: () => void
}

function genId(): string {
  return crypto.randomUUID()
}

function detectBlockType(text: string): { newType: BlockType; remaining: string } {
  const hMatch = text.match(/^(#{1,3})\s(.*)$/)
  if (hMatch) {
    const level = hMatch[1].length as 1 | 2 | 3
    return { newType: `heading${level}` as BlockType, remaining: hMatch[2] }
  }
  const todoCheckedMatch = text.match(/^-\s*\[x\]\s(.*)$/i)
  if (todoCheckedMatch) return { newType: 'todo', remaining: todoCheckedMatch[1] }
  const todoMatch = text.match(/^-\s*\[\s\]\s(.*)$/)
  if (todoMatch) return { newType: 'todo', remaining: todoMatch[1] }
  const bulletMatch = text.match(/^[-*]\s(.*)$/)
  if (bulletMatch) return { newType: 'bullet', remaining: bulletMatch[1] }
  const numMatch = text.match(/^\d+\.\s(.*)$/)
  if (numMatch) return { newType: 'numbered', remaining: numMatch[1] }
  return { newType: 'text', remaining: text }
}

function contentToBlocks(content: string): Block[] {
  if (!content) return [{ id: genId(), type: 'text', content: '', indent: 0 }]
  const lines = content.split('\n')
  return lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return { id: genId(), type: 'text', content: '', indent: 0 }
    const { newType, remaining } = detectBlockType(trimmed)
    const checked = newType === 'todo'
      ? /^-\s*\[x\]\s/i.test(trimmed)
      : undefined
    return {
      id: genId(),
      type: newType,
      content: remaining,
      checked,
      indent: 0
    }
  })
}

export default function NoteEditor({ note, onUpdate, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState(note.summary)
  const [summarizing, setSummarizing] = useState(false)
  const [images, setImages] = useState<NoteImage[]>(note.images ?? [])
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (note.blocks && note.blocks.length > 0) return note.blocks
    return contentToBlocks(note.content)
  })
  const blockEditorRef = useRef<BlockEditorHandle>(null)

  useEffect(() => {
    setTitle(note.title)
    setSummary(note.summary)
    setImages(note.images ?? [])
    if (note.blocks && note.blocks.length > 0) {
      setBlocks(note.blocks)
    } else {
      setBlocks(contentToBlocks(note.content))
    }
  }, [note.id])

  // Derive content from blocks for AI and image processing
  const allContent = blocks.map(b => b.content).join('\n')

  const handleSave = async () => {
    setSaving(true)
    try {
      const currentBlocks = blockEditorRef.current?.getBlocks() ?? blocks
      const textContent = currentBlocks.map(b => b.content).join('\n')
      const effectiveTitle = title || currentBlocks.find(b => b.content.trim())?.content.slice(0, 50) || ''
      await onUpdate(note.id, { title: effectiveTitle, content: textContent, blocks: currentBlocks, images })
    } finally {
      setSaving(false)
    }
  }

  const handleSummarize = async () => {
    setSummarizing(true)
    try {
      const result = await window.clipCaptureAPI.ai.summarize(allContent)
      setSummary(result)
      await onUpdate(note.id, { summary: result })
    } catch (error) {
      console.error('Failed to summarize:', error)
    } finally {
      setSummarizing(false)
    }
  }

  const handleBlockPaste = async (e: React.ClipboardEvent, index: number) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    if (!imageItem) return

    e.preventDefault()
    const file = imageItem.getAsFile()
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      try {
        const saved = await window.clipCaptureAPI.notes.saveImage(dataUrl)
        const placeholder = `![image](id:${saved.id})`
        document.execCommand('insertText', false, placeholder)
        // blocks state is synced from DOM on the next user input
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
    setBlocks(prev => prev.map(b => ({ ...b, content: b.content.replace(placeholderRegex, '') })))
  }

  // Parse blocks to find referenced image IDs
  const imagePlaceholderRegex = /!\[image\]\(id:([^)]+)\)/g
  const contentImageIds = new Set(
    Array.from(allContent.matchAll(imagePlaceholderRegex)).map(m => m[1])
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
          disabled={summarizing || !allContent.trim()}
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

        <BlockEditor
          ref={blockEditorRef}
          blocks={blocks}
          onChange={setBlocks}
          onPaste={handleBlockPaste}
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
