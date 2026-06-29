import express from 'express'
import cors from 'cors'
import http from 'http'
import crypto from 'crypto'
import * as database from './database'
import { MOBILE_APP_HTML } from './mobile-app-html'

let server: http.Server | null = null

export function startApiServer(apiKey: string, port: number = 19876): void {
  if (server) return // already running

  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '50mb' }))

  // Serve mobile web app (no auth needed for the page itself)
  app.get('/', (_req, res) => res.type('html').send(MOBILE_APP_HTML))
  app.get('/app', (_req, res) => res.type('html').send(MOBILE_APP_HTML))

  // Auth middleware
  app.use('/api', (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ') || auth.slice(7) !== apiKey) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
  })

  // Health check (no auth needed)
  app.get('/api/ping', (_req, res) => {
    res.json({ ok: true })
  })

  // List notes
  app.get('/api/notes', (req, res) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        tag: req.query.tag as string | undefined,
        category: req.query.category as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
      }
      const result = database.listNotes(filters)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: String(error) })
    }
  })

  // Get single note
  app.get('/api/notes/:id', (req, res) => {
    try {
      const note = database.getNote(req.params.id)
      if (!note) return res.status(404).json({ error: 'Note not found' })
      res.json(note)
    } catch (error) {
      res.status(500).json({ error: String(error) })
    }
  })

  // Create note
  app.post('/api/notes', (req, res) => {
    try {
      const note = database.createNote(req.body)
      res.status(201).json(note)
    } catch (error) {
      res.status(500).json({ error: String(error) })
    }
  })

  // Update note
  app.put('/api/notes/:id', (req, res) => {
    try {
      const note = database.updateNote(req.params.id, req.body)
      res.json(note)
    } catch (error) {
      res.status(500).json({ error: String(error) })
    }
  })

  // Append content to a note (mirrors QuickCapture append logic)
  app.post('/api/notes/:id/append', (req, res) => {
    try {
      const { content } = req.body
      if (!content || !content.trim()) return res.status(400).json({ error: 'Missing content' })

      const note = database.getNote(req.params.id)
      if (!note) return res.status(404).json({ error: 'Note not found' })

      const text = content.trim()
      const nowISO = new Date().toISOString()

      // Get existing blocks or create from content
      let existingBlocks: any[]
      if (note.blocks && note.blocks.length > 0) {
        existingBlocks = note.blocks
      } else if (note.content) {
        existingBlocks = note.content.split('\n').filter((l: string) => l.trim()).map((line: string) => ({
          id: crypto.randomUUID(),
          type: 'numbered',
          content: line,
          indent: 0
        }))
      } else {
        existingBlocks = []
      }

      // Convert all to numbered type
      const numberedExisting = existingBlocks.map((b: any) => ({
        ...b,
        type: 'numbered',
        checked: undefined
      }))

      // New content as numbered blocks with timestamp
      const newLines = text.split('\n').filter((l: string) => l.trim())
      const appendedBlocks = newLines.map((line: string) => ({
        id: crypto.randomUUID(),
        type: 'numbered',
        content: line,
        indent: 0,
        loggedAt: nowISO
      }))

      const allBlocks = [...numberedExisting, ...appendedBlocks]
      const allContent = allBlocks.map((b: any) => b.content).join('\n')

      const updated = database.updateNote(note.id, {
        content: allContent,
        blocks: allBlocks
      })
      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: String(error) })
    }
  })

  // Delete note
  app.delete('/api/notes/:id', (req, res) => {
    try {
      database.deleteNote(req.params.id)
      res.json({ ok: true })
    } catch (error) {
      res.status(500).json({ error: String(error) })
    }
  })

  // Save image (receives base64 dataUrl, returns saved image)
  app.post('/api/images', (req, res) => {
    try {
      const { data } = req.body
      if (!data) return res.status(400).json({ error: 'Missing data field' })
      const image = database.saveImage(data)
      res.status(201).json(image)
    } catch (error) {
      res.status(500).json({ error: String(error) })
    }
  })

  // Batch analyze (AI categorization) - for mobile bulk processing
  app.post('/api/notes/batch-categorize', async (req, res) => {
    try {
      const { ids } = req.body
      if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' })
      // Delegate to AI module if available
      const { batchCategorize } = require('./ai')
      const results = await batchCategorize(ids)
      res.json(results)
    } catch (error) {
      res.status(500).json({ error: String(error) })
    }
  })

  // Start listening
  server = app.listen(port, '0.0.0.0', () => {
    console.log(`[Sync] API server listening on port ${port}`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Sync] Port ${port} is already in use`)
    } else {
      console.error('[Sync] Server error:', err)
    }
  })
}

export function stopApiServer(): void {
  if (server) {
    server.close()
    server = null
    console.log('[Sync] API server stopped')
  }
}

export function isApiServerRunning(): boolean {
  return server !== null
}
