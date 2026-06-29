import { ipcMain } from 'electron'
import * as database from '../services/database'
import * as ai from '../services/ai'
import * as config from '../services/config'
import { isApiServerRunning, startApiServer, stopApiServer } from '../services/api-server'
import { v4 as uuidv4 } from 'uuid'

export function registerIpcHandlers(): void {
  ipcMain.handle('notes:list', (_event, filters) => {
    return database.listNotes(filters)
  })

  ipcMain.handle('notes:get', (_event, id: string) => {
    return database.getNote(id)
  })

  ipcMain.handle('notes:create', (_event, data) => {
    return database.createNote(data)
  })

  ipcMain.handle('notes:update', (_event, id: string, data) => {
    return database.updateNote(id, data)
  })

  ipcMain.handle('notes:delete', (_event, id: string) => {
    database.deleteNote(id)
  })

  ipcMain.handle('ai:generateTitle', async (_event, content: string) => {
    return ai.generateTitle(content)
  })

  ipcMain.handle('ai:summarize', async (_event, content: string) => {
    return ai.summarizeContent(content)
  })

  ipcMain.handle('ai:analyze', async (_event, content: string) => {
    return ai.analyzeNote(content)
  })

  ipcMain.handle('ai:batchCategorize', async (_event, ids: string[]) => {
    const results: Array<{ id: string; title: string; category: string; summary: string | null }> = []
    for (const id of ids) {
      const note = database.getNote(id)
      if (!note || !note.content.trim()) continue
      try {
        const result = await ai.analyzeNote(note.content)
        database.updateNote(id, {
          title: result.title,
          category: result.category,
          summary: result.summary || null
        })
        results.push({ id, ...result, summary: result.summary || null })
      } catch {
        results.push({ id, title: '', category: '', summary: null })
      }
    }
    return results
  })

  ipcMain.handle('config:getApiKey', () => {
    return config.getApiKey()
  })

  ipcMain.handle('config:setApiKey', (_event, key: string) => {
    config.setApiKey(key)
    ai.resetClient()
  })

  ipcMain.handle('config:getApiBaseUrl', () => {
    return config.getApiBaseUrl()
  })

  ipcMain.handle('config:setApiBaseUrl', (_event, url: string) => {
    config.setApiBaseUrl(url)
    ai.resetClient()
  })

  ipcMain.handle('config:getModel', () => {
    return config.getModel()
  })

  ipcMain.handle('config:setModel', (_event, model: string) => {
    config.setModel(model)
    ai.resetClient()
  })

  ipcMain.handle('notes:saveImage', (_event, dataUrl: string) => {
    return database.saveImage(dataUrl)
  })

  // Sync config
  ipcMain.handle('sync:getStatus', () => {
    return {
      running: isApiServerRunning(),
      port: config.getSyncPort(),
      apiKey: config.getSyncApiKey()
    }
  })

  ipcMain.handle('sync:regenerateKey', () => {
    return config.regenerateSyncApiKey()
  })

  ipcMain.handle('sync:restart', () => {
    stopApiServer()
    startApiServer(config.getSyncApiKey(), config.getSyncPort())
  })
}
