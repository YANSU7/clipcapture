import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { Block, BlockType } from '../types'

function genId(): string {
  return crypto.randomUUID()
}

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  onPaste?: (e: React.ClipboardEvent, index: number) => void
}

export interface BlockEditorHandle {
  getBlocks: () => Block[]
}

interface SlashMenuProps {
  x: number
  y: number
  onSelect: (type: BlockType) => void
  onClose: () => void
}

interface BlockMenuProps {
  x: number
  y: number
  index: number
  blockCount: number
  onAction: (action: BlockMenuAction) => void
  onClose: () => void
}

type BlockMenuAction =
  | { type: 'delete'; index: number }
  | { type: 'duplicate'; index: number }
  | { type: 'moveUp'; index: number }
  | { type: 'moveDown'; index: number }
  | { type: 'turnInto'; index: number; blockType: BlockType }

// --- Helpers ---

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

const BLOCK_TYPE_NAMES: Record<BlockType, string> = {
  text: '正文',
  bullet: '圆点列表',
  numbered: '编号列表',
  todo: '待办清单',
  heading1: '标题 1',
  heading2: '标题 2',
  heading3: '标题 3'
}

const SLASH_ITEMS: { type: BlockType; icon: string }[] = [
  { type: 'text', icon: '¶' },
  { type: 'heading1', icon: 'H1' },
  { type: 'heading2', icon: 'H2' },
  { type: 'heading3', icon: 'H3' },
  { type: 'bullet', icon: '•' },
  { type: 'numbered', icon: '1.' },
  { type: 'todo', icon: '☐' }
]

// --- SlashMenu ---

function SlashMenu({ x, y, onSelect, onClose }: SlashMenuProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, SLASH_ITEMS.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(SLASH_ITEMS[activeIdx].type) }
      else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIdx, onSelect, onClose])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => window.addEventListener('mousedown', handler), 0)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="slash-menu" ref={menuRef} style={{ left: x, top: y }}>
      {SLASH_ITEMS.map((item, i) => (
        <div
          key={item.type}
          className={`slash-menu-item ${i === activeIdx ? 'active' : ''}`}
          onClick={() => onSelect(item.type)}
          onMouseEnter={() => setActiveIdx(i)}
        >
          <span className="slash-menu-item-icon">{item.icon}</span>
          <span>{BLOCK_TYPE_NAMES[item.type]}</span>
        </div>
      ))}
    </div>
  )
}

// --- BlockHandleMenu ---

function BlockHandleMenu({ x, y, index, blockCount, onAction, onClose }: BlockMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => window.addEventListener('mousedown', handler), 0)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="block-handle-menu" ref={menuRef} style={{ left: x, top: y }}>
      <div className="block-handle-menu-item" onClick={() => onAction({ type: 'delete', index })}>
        🗑 删除
      </div>
      <div className="block-handle-menu-item" onClick={() => onAction({ type: 'duplicate', index })}>
        📋 复制
      </div>
      <div className={`block-handle-menu-item ${index === 0 ? 'disabled' : ''}`}
        onClick={() => index > 0 && onAction({ type: 'moveUp', index })}>
        ↑ 上移
      </div>
      <div className={`block-handle-menu-item ${index === blockCount - 1 ? 'disabled' : ''}`}
        onClick={() => index < blockCount - 1 && onAction({ type: 'moveDown', index })}>
        ↓ 下移
      </div>
      <div className="block-handle-menu-separator" />
      <div className="block-handle-menu-item" onClick={() => { /* submenu could go here */ }}>
        ↔ 转换为...
      </div>
      {(['text', 'bullet', 'numbered', 'todo', 'heading1', 'heading2', 'heading3'] as BlockType[]).map(t => (
        <div key={t} className="block-handle-menu-item block-handle-menu-sub" onClick={() => onAction({ type: 'turnInto', index, blockType: t })}>
          {BLOCK_TYPE_NAMES[t]}
        </div>
      ))}
    </div>
  )
}

// --- BlockRow ---

interface BlockRowProps {
  block: Block
  index: number
  isFirst: boolean
  isLast: boolean
  numberLabel?: string | null
  onContentChange: (index: number) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  onPaste: (e: React.ClipboardEvent, index: number) => void
  onShowSlashMenu: (index: number, x: number, y: number) => void
  onToggleTodo: (index: number) => void
  onShowBlockMenu: (index: number, x: number, y: number) => void
  onRegisterBlock?: (index: number, el: HTMLDivElement | null) => void
}

const BlockRow = React.memo(function BlockRow({
  block, index, isFirst, isLast, numberLabel,
  onContentChange, onKeyDown, onPaste,
  onShowSlashMenu, onToggleTodo, onShowBlockMenu,
  onRegisterBlock
}: BlockRowProps) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const compositionRef = useRef(false)

  // Initialize textContent when block identity or type changes
  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== block.content) {
      elRef.current.textContent = block.content
    }
  }, [block.id, block.type])

  const handleInput = useCallback(() => {
    if (compositionRef.current) return
    onContentChange(index)
  }, [index, onContentChange])

  const handleCompositionStart = useCallback(() => { compositionRef.current = true }, [])
  const handleCompositionEnd = useCallback(() => {
    compositionRef.current = false
    onContentChange(index)
  }, [index, onContentChange])

  const handleKeyDownWrapper = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '/' && !e.shiftKey && e.currentTarget.textContent === '') {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        onShowSlashMenu(index, rect.left, rect.bottom + 4)
      }
    }
    onKeyDown(e, index)
  }, [index, onKeyDown, onShowSlashMenu])

  const handlePasteWrapper = useCallback((e: React.ClipboardEvent) => {
    // Only intercept if it's text paste (not image)
    const hasImage = Array.from(e.clipboardData.items).some(i => i.type.startsWith('image/'))
    if (hasImage) {
      onPaste(e, index)
      return
    }
    // Strip HTML for plain text paste
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    onContentChange(index)
  }, [index, onPaste, onContentChange])

  const handleDecoratorClick = useCallback(() => {
    if (block.type === 'todo') onToggleTodo(index)
  }, [block.type, index, onToggleTodo])

  const handleHandleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    onShowBlockMenu(index, rect.left - 4, rect.bottom + 4)
  }, [index, onShowBlockMenu])

  const indent = Math.min(block.indent, 4)

  return (
    <div
      className={`block-row block-type-${block.type}`}
      style={{ paddingLeft: indent * 24 }}
    >
      <div className="block-handle" onClick={handleHandleClick}>
        ⋮⋮
      </div>

      <div className="block-decorator" onClick={handleDecoratorClick}>
        {block.type === 'bullet' && (
          <span className="deco-bullet">
            {['•', '◦', '▪', '◦'][Math.min(indent, 3)]}
          </span>
        )}
        {block.type === 'todo' && (
          <span className={`deco-checkbox ${block.checked ? 'checked' : ''}`}>
            {block.checked ? '☑' : '☐'}
          </span>
        )}
        {block.type === 'numbered' && numberLabel != null && (
          <span className="deco-number">{numberLabel}.</span>
        )}
      </div>

      <div
        ref={(el) => {
          elRef.current = el
          onRegisterBlock?.(index, el)
        }}
        className="block-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDownWrapper}
        onPaste={handlePasteWrapper}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
    </div>
  )
})

// --- BlockEditor ---

function numberToLetter(n: number): string {
  return String.fromCharCode(96 + Math.min(n, 26))
}

function toRoman(n: number): string {
  const table: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ]
  let result = ''
  let r = n
  for (const [letter, value] of table) {
    while (r >= value) { result += letter; r -= value }
  }
  return result
}

function computeNumberedLabels(blocks: Block[]): (string | null)[] {
  const labels: (string | null)[] = []
  const counters = [0, 0, 0, 0, 0]

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type === 'numbered') {
      const indent = Math.min(blocks[i].indent, 4)
      // Reset deeper counters when a higher-level item resumes
      for (let d = indent + 1; d < counters.length; d++) counters[d] = 0

      counters[indent]++
      const n = counters[indent]

      switch (indent) {
        case 0:  labels.push(String(n)); break
        case 1:  labels.push(numberToLetter(n)); break
        case 2:  labels.push(toRoman(n).toLowerCase()); break
        default: labels.push(String(n)); break
      }
    } else {
      counters.fill(0)
      labels.push(null)
    }
  }
  return labels
}

const BlockEditor = forwardRef<BlockEditorHandle, BlockEditorProps>(
  function BlockEditor({ blocks, onChange, onPaste }: BlockEditorProps, ref) {
    const blockRefs = useRef<(HTMLDivElement | null)[]>([])
    const [slashMenu, setSlashMenu] = useState<{ index: number; x: number; y: number } | null>(null)
    const [blockMenu, setBlockMenu] = useState<{ index: number; x: number; y: number } | null>(null)
    const numberedLabels = React.useMemo(() => computeNumberedLabels(blocks), [blocks])

    // Expose getBlocks to parent
    useImperativeHandle(ref, () => ({
      getBlocks: () => {
        return blocks.map((b, i) => ({
          ...b,
          content: blockRefs.current[i]?.textContent ?? b.content
        }))
      }
    }), [blocks])

    // Register refs from BlockRow children
    const handleRegisterBlock = useCallback((index: number, el: HTMLDivElement | null) => {
      blockRefs.current[index] = el
    }, [])

    const readContents = useCallback((): string[] => {
      return blocks.map((_, i) => blockRefs.current[i]?.textContent ?? '')
    }, [blocks])

    const triggerChange = useCallback((newBlocks: Block[]) => {
      onChange(newBlocks)
    }, [onChange])

    // Content change (user typing) - check for auto-detection
    const handleContentChange = useCallback((index: number) => {
      const el = blockRefs.current[index]
      const text = el?.textContent ?? ''
      const block = blocks[index]

      // Auto-detection: only convert text type blocks
      if (block.type === 'text' && text) {
        const { newType, remaining } = detectBlockType(text)
        if (newType !== 'text') {
          const newBlocks = blocks.map((b, i) => {
            if (i === index) {
              return {
                ...b,
                type: newType,
                content: remaining,
                checked: newType === 'todo' ? (text.match(/^-\s*\[x\]\s/i) ? true : false) : b.checked,
                indent: b.indent
              }
            }
            return { ...b, content: blockRefs.current[i]?.textContent ?? b.content }
          })
          triggerChange(newBlocks)
          return
        }
      }

      // Check for slash command trigger
      if (block.type === 'text' && text === '/' && block.content === '') {
        // Show slash menu - handled in onKeyDown
      }
    }, [blocks, triggerChange])

    // --- Structural operations ---

    const getBlocksWithContent = useCallback((): Block[] => {
      return blocks.map((b, i) => ({
        ...b,
        content: blockRefs.current[i]?.textContent ?? b.content
      }))
    }, [blocks])

    const splitBlock = useCallback((index: number, cursorPos: number) => {
      const current = getBlocksWithContent()
      const block = current[index]
      const before = block.content.slice(0, cursorPos)
      const after = block.content.slice(cursorPos)
      const newBlock: Block = {
        id: genId(),
        type: block.type === 'todo' ? 'todo' : block.type,
        content: after,
        checked: block.type === 'todo' ? false : undefined,
        indent: block.indent
      }
      current[index] = { ...block, content: before }
      current.splice(index + 1, 0, newBlock)
      triggerChange(current)
      // Focus next block after render
      requestAnimationFrame(() => {
        blockRefs.current[index + 1]?.focus()
      })
    }, [getBlocksWithContent, triggerChange])

    const mergeWithPrevious = useCallback((index: number) => {
      if (index === 0) return
      const current = getBlocksWithContent()
      const prevLen = current[index - 1].content.length
      current[index - 1] = {
        ...current[index - 1],
        content: current[index - 1].content + current[index].content
      }
      current.splice(index, 1)
      triggerChange(current)
      requestAnimationFrame(() => {
        const el = blockRefs.current[index - 1]
        if (el) {
          el.focus()
          const sel = window.getSelection()
          const range = document.createRange()
          range.setStart(el.childNodes[0] || el, prevLen)
          range.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      })
    }, [getBlocksWithContent, triggerChange])

    const deleteBlock = useCallback((index: number) => {
      const current = getBlocksWithContent()
      if (current.length <= 1) {
        // Keep last block but clear it
        current[0] = { ...current[0], content: '', type: 'text', indent: 0 }
        triggerChange(current)
        requestAnimationFrame(() => blockRefs.current[0]?.focus())
        return
      }
      const focusIdx = Math.max(0, index - 1)
      current.splice(index, 1)
      triggerChange(current)
      requestAnimationFrame(() => {
        blockRefs.current[focusIdx]?.focus()
      })
    }, [getBlocksWithContent, triggerChange])

    const insertNewBlock = useCallback((index: number, type: BlockType, extra?: Partial<Block>) => {
      const current = getBlocksWithContent()
      const newBlock: Block = {
        id: genId(),
        type,
        content: '',
        indent: 0,
        ...extra
      }
      current.splice(index + 1, 0, newBlock)
      triggerChange(current)
      requestAnimationFrame(() => {
        blockRefs.current[index + 1]?.focus()
      })
    }, [getBlocksWithContent, triggerChange])

    // --- Keyboard handler ---

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      const el = e.currentTarget
      const sel = window.getSelection()
      const cursorPos = sel?.focusOffset ?? 0
      const textLen = el.textContent?.length ?? 0
      const isAtStart = cursorPos === 0
      const isAtEnd = cursorPos >= textLen
      const isEmpty = textLen === 0

      switch (e.key) {
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault()
            if (isEmpty) {
              // Empty block: create text block below (remove list continuation)
              insertNewBlock(index, 'text')
            } else {
              splitBlock(index, cursorPos)
            }
          }
          break

        case 'Backspace':
          if (isAtStart) {
            if (index > 0) {
              e.preventDefault()
              mergeWithPrevious(index)
            } else if (isEmpty) {
              e.preventDefault()
              // First block empty, keep it
            }
          }
          break

        case 'Delete':
          if (isAtEnd && index < blocks.length - 1) {
            e.preventDefault()
            const current = getBlocksWithContent()
            current[index] = {
              ...current[index],
              content: current[index].content + current[index + 1].content
            }
            current.splice(index + 1, 1)
            triggerChange(current)
          }
          break

        case 'Tab':
          e.preventDefault()
          const current = getBlocksWithContent()
          if (!e.shiftKey) {
            current[index] = { ...current[index], indent: Math.min(current[index].indent + 1, 4) }
          } else {
            current[index] = { ...current[index], indent: Math.max(current[index].indent - 1, 0) }
          }
          triggerChange(current)
          break

        case 'ArrowUp':
          if (index > 0) {
            e.preventDefault()
            const prevEl = blockRefs.current[index - 1]
            if (prevEl) {
              const len = prevEl.textContent?.length ?? 0
              prevEl.focus()
              const selection = window.getSelection()
              const range = document.createRange()
              range.setStart(prevEl.childNodes[0] || prevEl, len)
              range.collapse(true)
              selection?.removeAllRanges()
              selection?.addRange(range)
            }
          }
          break

        case 'ArrowDown':
          if (index < blocks.length - 1) {
            e.preventDefault()
            const nextEl = blockRefs.current[index + 1]
            if (nextEl) {
              nextEl.focus()
              const selection = window.getSelection()
              const range = document.createRange()
              range.setStart(nextEl.childNodes[0] || nextEl, 0)
              range.collapse(true)
              selection?.removeAllRanges()
              selection?.addRange(range)
            }
          }
          break
      }
    }, [blocks.length, getBlocksWithContent, insertNewBlock, splitBlock, mergeWithPrevious, triggerChange])

    // --- Slash menu ---

    const handleSlashSelect = useCallback((type: BlockType) => {
      if (slashMenu === null) return
      const current = getBlocksWithContent()
      current[slashMenu.index] = {
        ...current[slashMenu.index],
        type,
        content: '',
        checked: type === 'todo' ? false : undefined
      }
      triggerChange(current)
      setSlashMenu(null)
      requestAnimationFrame(() => {
        blockRefs.current[slashMenu.index]?.focus()
      })
    }, [slashMenu, getBlocksWithContent, triggerChange])

    // --- Block handle menu actions ---

    const handleBlockMenuAction = useCallback((action: BlockMenuAction) => {
      setBlockMenu(null)
      const current = getBlocksWithContent()
      switch (action.type) {
        case 'delete':
          if (current.length <= 1) {
            current[0] = { ...current[0], content: '', type: 'text', indent: 0 }
            triggerChange(current)
          } else {
            const focusIdx = Math.max(0, action.index - 1)
            current.splice(action.index, 1)
            triggerChange(current)
            requestAnimationFrame(() => blockRefs.current[focusIdx]?.focus())
          }
          break
        case 'duplicate':
          const dup = { ...current[action.index], id: genId() }
          current.splice(action.index + 1, 0, dup)
          triggerChange(current)
          break
        case 'moveUp':
          if (action.index > 0) {
            [current[action.index - 1], current[action.index]] = [current[action.index], current[action.index - 1]]
            triggerChange(current)
            requestAnimationFrame(() => blockRefs.current[action.index - 1]?.focus())
          }
          break
        case 'moveDown':
          if (action.index < current.length - 1) {
            [current[action.index], current[action.index + 1]] = [current[action.index + 1], current[action.index]]
            triggerChange(current)
            requestAnimationFrame(() => blockRefs.current[action.index + 1]?.focus())
          }
          break
        case 'turnInto':
          current[action.index] = {
            ...current[action.index],
            type: action.blockType,
            checked: action.blockType === 'todo' ? false : undefined
          }
          triggerChange(current)
          break
      }
    }, [getBlocksWithContent, triggerChange])

    // --- Todo toggle ---

    const handleToggleTodo = useCallback((index: number) => {
      const current = getBlocksWithContent()
      current[index] = { ...current[index], checked: !current[index].checked }
      triggerChange(current)
    }, [getBlocksWithContent, triggerChange])

    // --- Render ---

    return (
      <div className="block-editor">
        {blocks.map((block, i) => (
          <BlockRow
            key={block.id}
            block={block}
            index={i}
            numberLabel={numberedLabels[i]}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
            onContentChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onPaste={onPaste ?? (() => {})}
            onShowSlashMenu={(idx, x, y) => setSlashMenu({ index: idx, x, y })}
            onToggleTodo={handleToggleTodo}
            onShowBlockMenu={(idx, x, y) => setBlockMenu({ index: idx, x, y })}
            onRegisterBlock={handleRegisterBlock}
          />
        ))}

        <div className="block-row-placeholder" onClick={() => {
          const last = blockRefs.current[blocks.length - 1]
          if (last) last.focus()
        }} />

        {slashMenu && (
          <SlashMenu
            x={slashMenu.x}
            y={slashMenu.y}
            onSelect={handleSlashSelect}
            onClose={() => setSlashMenu(null)}
          />
        )}

        {blockMenu && (
          <BlockHandleMenu
            x={blockMenu.x}
            y={blockMenu.y}
            index={blockMenu.index}
            blockCount={blocks.length}
            onAction={handleBlockMenuAction}
            onClose={() => setBlockMenu(null)}
          />
        )}
      </div>
    )
  }
)

export default BlockEditor
