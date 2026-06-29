import React from 'react'
import type { Note, Block } from '../types'

interface NoteListProps {
  notes: Note[]
  loading: boolean
  total: number
  selectedId: string | null
  onSelect: (note: Note) => void
  onDelete: (id: string) => void
  search: string
  onSearchChange: (value: string) => void
  onOpenSettings: () => void
  onBatchCategorize: () => void
  categorizing: boolean
  categories: string[]
  activeCategory: string
  onCategoryFilter: (category: string) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'

  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getPreview(content: string, blocks?: Block[], maxLength = 80): string {
  const source = blocks && blocks.length > 0
    ? blocks.map(b => b.content).join(' ')
    : content
  const text = source.replace(/\n/g, ' ').replace(/!\[image\]\(id:[^)]+\)/g, '[图片]')
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

const CATEGORY_COLORS: Record<string, string> = {
  '工作': '#e74c6f',
  '技术': '#7c5cfc',
  '学习': '#2ecc71',
  '生活': '#f39c12',
  '灵感': '#3498db',
  '其他': '#6a6a8a'
}

export default function NoteList({
  notes,
  loading,
  total,
  selectedId,
  onSelect,
  onDelete,
  search,
  onSearchChange,
  onOpenSettings,
  onBatchCategorize,
  categorizing,
  categories,
  activeCategory,
  onCategoryFilter
}: NoteListProps) {
  return (
    <div className="note-list">
      <div className="note-list-header">
        <h1 className="note-list-title">ClipCapture</h1>
        <div className="note-list-header-actions">
          <span className="note-list-count">{total} 条笔记</span>
          <button className="note-list-settings-btn" onClick={onOpenSettings} title="设置">
            &#9881;
          </button>
        </div>
      </div>

      <div className="note-list-search">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索笔记..."
          className="search-input"
        />
      </div>

      {categories.length > 0 && (
        <div className="note-list-categories">
          <button
            className={'category-tag' + (!activeCategory ? ' category-tag-active' : '')}
            onClick={() => onCategoryFilter('')}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={'category-tag' + (activeCategory === cat ? ' category-tag-active' : '')}
              style={CATEGORY_COLORS[cat] ? { '--cat-color': CATEGORY_COLORS[cat] } as React.CSSProperties : undefined}
              onClick={() => onCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="note-list-items">
        {loading && notes.length === 0 && (
          <div className="note-list-empty">加载中...</div>
        )}

        {!loading && notes.length === 0 && (
          <div className="note-list-empty">
            {search ? '没有找到匹配的笔记' : '还没有笔记，使用快捷键 Ctrl+Shift+C 快速捕获'}
          </div>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className={'note-item' + (note.id === selectedId ? ' note-item-active' : '')}
            onClick={() => onSelect(note)}
          >
            <div className="note-item-header">
              <span className="note-item-title">
                {note.title || '无标题'}
              </span>
              <button
                className="note-item-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(note.id)
                }}
                title="删除"
              >
                &#10005;
              </button>
            </div>
            <p className="note-item-preview">{getPreview(note.content, note.blocks)}</p>
            <div className="note-item-meta">
              <span>{formatDate(note.created_at)}</span>
              {note.category && (
                <span
                  className="note-item-category"
                  style={CATEGORY_COLORS[note.category] ? { color: CATEGORY_COLORS[note.category] } : undefined}
                >
                  {note.category}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="note-list-footer">
        <button
          className="toolbar-btn batch-btn"
          onClick={onBatchCategorize}
          disabled={categorizing}
        >
          {categorizing ? '整理中...' : '整理全部'}
        </button>
      </div>
    </div>
  )
}
