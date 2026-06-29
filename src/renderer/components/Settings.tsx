import React, { useState, useEffect } from 'react'
import type { SyncStatus } from '../types'

interface SettingsProps {
  onClose: () => void
}

export default function Settings({ onClose }: SettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      window.clipCaptureAPI.config.getApiKey(),
      window.clipCaptureAPI.config.getApiBaseUrl(),
      window.clipCaptureAPI.config.getModel(),
      window.clipCaptureAPI.sync.getStatus()
    ]).then(([key, url, m, sync]) => {
      setApiKey(key)
      setApiBaseUrl(url)
      setModel(m)
      setSyncStatus(sync)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      setError('请输入 API Key')
      return
    }

    setSaving(true)
    setError('')
    try {
      await window.clipCaptureAPI.config.setApiKey(trimmedKey)
      await window.clipCaptureAPI.config.setApiBaseUrl(apiBaseUrl.trim())
      await window.clipCaptureAPI.config.setModel(model.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-layout">
      <div className="settings">
        <div className="settings-header">
          <h1 className="settings-title">设置</h1>
          <button className="toolbar-btn toolbar-btn-secondary" onClick={onClose}>
            返回
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <h2 className="settings-section-title">API 配置</h2>
            <p className="settings-desc">
              用于自动生成笔记标题和 AI 摘要功能。支持 OpenAI 以及兼容接口（如 DeepSeek）。
            </p>

            {loading ? (
              <div className="settings-loading">加载中...</div>
            ) : (
              <>
                <label className="settings-label">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setError('')
                    setSaved(false)
                  }}
                  placeholder="sk-..."
                  className="settings-input"
                />

                <label className="settings-label" style={{ marginTop: 16 }}>API 地址（可选）</label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => {
                    setApiBaseUrl(e.target.value)
                    setError('')
                    setSaved(false)
                  }}
                  placeholder="留空=OpenAI，DeepSeek 填 https://api.deepseek.com"
                  className="settings-input"
                />
                <p className="settings-hint">
                  常见选项：留空 = OpenAI、https://api.deepseek.com = DeepSeek
                </p>

                <label className="settings-label" style={{ marginTop: 16 }}>模型名称（可选）</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value)
                    setError('')
                    setSaved(false)
                  }}
                  placeholder="留空默认 gpt-4o-mini，DeepSeek 填 deepseek-v4-flash"
                  className="settings-input"
                />
                <p className="settings-hint">
                  常见选项：gpt-4o-mini（OpenAI）、deepseek-v4-flash（DeepSeek）
                </p>

                {error && <div className="settings-error">{error}</div>}

                <div className="settings-actions">
                  <button
                    className="toolbar-btn"
                    onClick={handleSave}
                    disabled={saving || !apiKey.trim()}
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                  {saved && <span className="settings-saved">已保存</span>}
                </div>
              </>
            )}
          </div>

          {/* Sync section */}
          <div className="settings-section">
            <h2 className="settings-section-title">手机同步</h2>
              <p className="settings-desc">
                通过 Tailscale 在手机与电脑之间同步笔记。在电脑上安装 Tailscale，手机 App 通过以下信息连接。
              </p>

              {syncStatus && (
                <div className="sync-info">
                  <div className="sync-info-row">
                    <span className="sync-info-label">服务器状态</span>
                    <span className={`sync-status-dot ${syncStatus.running ? 'online' : 'offline'}`}>
                      {syncStatus.running ? '运行中' : '已停止'}
                    </span>
                  </div>

                  <div className="sync-info-row">
                    <span className="sync-info-label">端口</span>
                    <span className="sync-info-value">{syncStatus.port}</span>
                  </div>

                  <div className="sync-info-row">
                    <span className="sync-info-label">API Key</span>
                    <span className="sync-info-key">{syncStatus.apiKey}</span>
                    <button
                      className="sync-copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(syncStatus.apiKey)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                    >
                      {copied ? '已复制' : '复制'}
                    </button>
                  </div>

                  <div className="sync-info-row">
                    <button
                      className="toolbar-btn toolbar-btn-secondary"
                      onClick={async () => {
                        await window.clipCaptureAPI.sync.regenerateKey()
                        const status = await window.clipCaptureAPI.sync.getStatus()
                        setSyncStatus(status)
                      }}
                    >
                      重新生成 Key
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}
