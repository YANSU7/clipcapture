import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, screen, ipcMain } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase } from './services/database'
import { registerIpcHandlers } from './ipc/handlers'
import { initConfig } from './services/config'
import { getTrayIcon } from './utils/icon'

let mainWindow: BrowserWindow | null = null
let quickCaptureWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = !app.isPackaged

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createQuickCaptureWindow(): void {
  const cursorPoint = screen.getCursorScreenPoint()
  const activeDisplay = screen.getDisplayNearestPoint(cursorPoint)
  const { x: displayX, y: displayY, width: displayWidth } = activeDisplay.workArea

  const winWidth = 500
  const winHeight = 100

  quickCaptureWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: displayX + Math.round((displayWidth - winWidth) / 2),
    y: displayY + 100,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    quickCaptureWindow.loadURL('http://localhost:5173/#/capture')
  } else {
    quickCaptureWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: '/capture'
    })
  }

  quickCaptureWindow.on('blur', () => {
    hideQuickCapture()
  })
}

function showQuickCapture(): void {
  if (!quickCaptureWindow || quickCaptureWindow.isDestroyed()) {
    createQuickCaptureWindow()
  }

  const cursorPoint = screen.getCursorScreenPoint()
  const activeDisplay = screen.getDisplayNearestPoint(cursorPoint)
  const { x: displayX, y: displayY, width: displayWidth } = activeDisplay.workArea

  const winWidth = 500
  const winHeight = 100

  quickCaptureWindow?.setBounds({
    x: displayX + Math.round((displayWidth - winWidth) / 2),
    y: displayY + 100,
    width: winWidth,
    height: winHeight
  })

  quickCaptureWindow?.show()
  quickCaptureWindow?.focus()
  quickCaptureWindow?.webContents.send('capture:focus')
}

function hideQuickCapture(): void {
  if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
    quickCaptureWindow.hide()
  }
}

function createTray(): void {
  const icon = getTrayIcon()
  tray = new Tray(icon)

  tray.setToolTip('ClipCapture')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开主窗口',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: '快速捕获 (CmdOrCtrl+Shift+C)',
      click: () => showQuickCapture()
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    showQuickCapture()
  })
}

function registerShortcuts(): void {
  const registered = globalShortcut.register('CmdOrCtrl+Shift+C', () => {
    showQuickCapture()
  })

  if (!registered) {
    console.warn('Failed to register global shortcut CmdOrCtrl+Shift+C')
  }

  const wRegistered = globalShortcut.register('CmdOrCtrl+Shift+W', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  if (!wRegistered) {
    console.warn('快捷键 Ctrl+Shift+W 注册失败，可能被其他程序占用。可修改 src/main/index.ts 中的快捷键。')
  }
}

function registerWindowIpcHandlers(): void {
  ipcMain.on('window:hideQuickCapture', () => {
    hideQuickCapture()
  })

  ipcMain.on('window:showMainWindow', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  ipcMain.on('window:resizeQuickCapture', (_event, height: number) => {
    if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
      const bounds = quickCaptureWindow.getBounds()
      quickCaptureWindow.setBounds({ ...bounds, height })
    }
  })

  // When notes change (e.g. QuickCapture saved), notify the main window
  ipcMain.on('notes:changed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('notes:changed')
    }
  })
}

app.on('ready', () => {
  initConfig()
  initDatabase()
  registerIpcHandlers()
  registerWindowIpcHandlers()
  createMainWindow()
  createQuickCaptureWindow()
  createTray()
  registerShortcuts()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeDatabase()
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
  }
})

declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}
