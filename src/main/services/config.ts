import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface AppConfig {
  openai_api_key: string
  api_base_url: string
  model: string
}

let config: AppConfig = {
  openai_api_key: '',
  api_base_url: '',
  model: ''
}

let configPath = ''

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'config.json')
}

function loadConfig(): void {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      config = { ...config, ...JSON.parse(data) }
    }
  } catch {
    // ignore parse errors
  }
}

function saveConfig(): void {
  const dir = path.dirname(configPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

export function initConfig(): void {
  configPath = getConfigPath()
  loadConfig()
}

export function getApiKey(): string {
  return config.openai_api_key || process.env.OPENAI_API_KEY || ''
}

export function setApiKey(key: string): void {
  config.openai_api_key = key
  saveConfig()
}

export function getApiBaseUrl(): string {
  return config.api_base_url || process.env.OPENAI_BASE_URL || ''
}

export function setApiBaseUrl(url: string): void {
  config.api_base_url = url
  saveConfig()
}

export function getModel(): string {
  return config.model || ''
}

export function setModel(model: string): void {
  config.model = model
  saveConfig()
}
