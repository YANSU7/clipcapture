import { contextBridge, ipcRenderer } from 'electron'

const api = {
  notes: {
    list: (filters?: unknown) => ipcRenderer.invoke('notes:list', filters),
    get: (id: string) => ipcRenderer.invoke('notes:get', id),
    create: (data: unknown) => ipcRenderer.invoke('notes:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('notes:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('notes:delete', id),
    saveImage: (dataUrl: string) => ipcRenderer.invoke('notes:saveImage', dataUrl),
    onChanged: (callback: () => void) => ipcRenderer.on('notes:changed', () => callback())
  },
  ai: {
    generateTitle: (content: string) => ipcRenderer.invoke('ai:generateTitle', content),
    summarize: (content: string) => ipcRenderer.invoke('ai:summarize', content),
    analyze: (content: string) => ipcRenderer.invoke('ai:analyze', content),
    batchCategorize: (ids: string[]) => ipcRenderer.invoke('ai:batchCategorize', ids)
  },
  config: {
    getApiKey: () => ipcRenderer.invoke('config:getApiKey'),
    setApiKey: (key: string) => ipcRenderer.invoke('config:setApiKey', key),
    getApiBaseUrl: () => ipcRenderer.invoke('config:getApiBaseUrl'),
    setApiBaseUrl: (url: string) => ipcRenderer.invoke('config:setApiBaseUrl', url),
    getModel: () => ipcRenderer.invoke('config:getModel'),
    setModel: (model: string) => ipcRenderer.invoke('config:setModel', model)
  },
  window: {
    hideQuickCapture: () => ipcRenderer.send('window:hideQuickCapture'),
    showMainWindow: () => ipcRenderer.send('window:showMainWindow'),
    resizeQuickCapture: (height: number) => ipcRenderer.send('window:resizeQuickCapture', height)
  },
  notifyNotesChanged: () => ipcRenderer.send('notes:changed')
}

contextBridge.exposeInMainWorld('clipCaptureAPI', api)

ipcRenderer.on('capture:focus', () => {
  window.dispatchEvent(new CustomEvent('capture:focus'))
})

export type ClipCaptureAPI = typeof api
