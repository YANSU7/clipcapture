import React, { useState, useEffect } from 'react'

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

  useEffect(() => {
    Promise.all([
      window.clipCaptureAPI.config.getApiKey(),
      window.clipCaptureAPI.config.getApiBaseUrl(),
      window.clipCaptureAPI.config.getModel()
    ]).then(([key, url, m]) => {
      setApiKey(key)
      setApiBaseUrl(url)
      setModel(m)
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
        </div>
      </div>
    </div>
  )
}
