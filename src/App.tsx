import { useEffect, useMemo, useState } from 'react'
import { getThemeState, setThemeState, ThemeState } from './lib/tauri'

function App() {
  const [themeLoading, setThemeLoading] = useState(false)
  const [themeState, setThemeStateLocal] = useState<ThemeState | null>(null)
  const [themeError, setThemeError] = useState<string | null>(null)

  const isWindows = useMemo(() => {
    return navigator.userAgent.toLowerCase().includes('windows')
  }, [])

  const refreshTheme = async () => {
    setThemeLoading(true)
    setThemeError(null)
    try {
      const state = await getThemeState()
      setThemeStateLocal(state)
    } catch (error) {
      setThemeError(error instanceof Error ? error.message : String(error))
    } finally {
      setThemeLoading(false)
    }
  }

  useEffect(() => {
    void refreshTheme()
  }, [])

  const updateTheme = async (next: ThemeState) => {
    setThemeLoading(true)
    setThemeError(null)
    try {
      const state = await setThemeState(next)
      setThemeStateLocal(state)
    } catch (error) {
      setThemeError(error instanceof Error ? error.message : String(error))
    } finally {
      setThemeLoading(false)
    }
  }

  const currentThemeLabel = useMemo(() => {
    if (!themeState) return '读取中...'
    if (themeState.apps === 'dark' && themeState.system === 'dark') return '深色'
    if (themeState.apps === 'light' && themeState.system === 'light') return '浅色'
    return '混合'
  }, [themeState])

  return (
    <main className="app">
      <section className="card">
        <h1>WinLux</h1>
        <p className="muted">仅保留 Windows 深色/浅色切换功能</p>
        <p className="muted">当前状态：{currentThemeLabel}</p>
        <p className="muted">注册表路径：HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize</p>

        {themeError ? <p className="error">{themeError}</p> : null}

        <div className="row">
          <button
            type="button"
            disabled={!isWindows || themeLoading}
            onClick={() => {
              void updateTheme({ apps: 'dark', system: 'dark' })
            }}
          >
            切换为深色
          </button>

          <button
            type="button"
            disabled={!isWindows || themeLoading}
            onClick={() => {
              void updateTheme({ apps: 'light', system: 'light' })
            }}
          >
            切换为浅色
          </button>

          <button
            type="button"
            disabled={!isWindows || themeLoading}
            onClick={() => {
              void refreshTheme()
            }}
          >
            {themeLoading ? '处理中...' : '刷新状态'}
          </button>
        </div>

        {!isWindows ? <p className="muted">当前不是 Windows，功能已禁用。</p> : null}
      </section>
    </main>
  )
}

export default App
