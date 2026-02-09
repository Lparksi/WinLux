import { useEffect, useMemo, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  getThemeState,
  setThemeState,
  ThemeState,
  THEME_STATE_CHANGED_EVENT,
} from './lib/tauri'

type ThemeBadgeTone = 'neutral' | 'good' | 'mix'

function App() {
  const [themeLoading, setThemeLoading] = useState(false)
  const [themeState, setThemeStateLocal] = useState<ThemeState | null>(null)
  const [themeError, setThemeError] = useState<string | null>(null)

  const registryPath =
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'

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

  useEffect(() => {
    let unlisten: (() => void) | undefined

    void listen<ThemeState>(THEME_STATE_CHANGED_EVENT, (event) => {
      setThemeStateLocal(event.payload)
      setThemeError(null)
      setThemeLoading(false)
    }).then((fn) => {
      unlisten = fn
    })

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [])

  useEffect(() => {
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshTheme()
      }
    }

    window.addEventListener('focus', syncWhenVisible)
    document.addEventListener('visibilitychange', syncWhenVisible)

    return () => {
      window.removeEventListener('focus', syncWhenVisible)
      document.removeEventListener('visibilitychange', syncWhenVisible)
    }
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

  const currentTheme = useMemo(() => {
    if (!themeState) {
      return {
        label: '读取中…',
        tone: 'neutral' as ThemeBadgeTone,
        detail: '',
      }
    }

    if (themeState.apps === 'dark' && themeState.system === 'dark') {
      return {
        label: '深色',
        tone: 'good' as ThemeBadgeTone,
        detail: '应用与系统均为深色模式',
      }
    }

    if (themeState.apps === 'light' && themeState.system === 'light') {
      return {
        label: '浅色',
        tone: 'good' as ThemeBadgeTone,
        detail: '应用与系统均为浅色模式',
      }
    }

    const appsLabel = themeState.apps === 'dark' ? '深色' : '浅色'
    const systemLabel = themeState.system === 'dark' ? '深色' : '浅色'

    return {
      label: '混合',
      tone: 'mix' as ThemeBadgeTone,
      detail: `应用：${appsLabel}｜系统：${systemLabel}`,
    }
  }, [themeState])

  const isDarkSelected = themeState?.apps === 'dark' && themeState?.system === 'dark'
  const isLightSelected =
    themeState?.apps === 'light' && themeState?.system === 'light'

  const uiTheme = themeState?.apps ?? 'dark'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiTheme)
  }, [uiTheme])

  return (
    <main className="app">
      <section className="card">
        <header className="header">
          <div>
            <h1 className="title">WinLux</h1>
            <p className="subtitle">一键切换 Windows 深色/浅色</p>
          </div>

          <span className={`badge badge-${currentTheme.tone}`}>{currentTheme.label}</span>
        </header>

        {currentTheme.detail ? <p className="muted small">{currentTheme.detail}</p> : null}

        {themeError ? <p className="error">{themeError}</p> : null}

        <div className="actions">
          <button
            type="button"
            className={`btn ${isDarkSelected ? 'btnPrimary' : 'btnSecondary'}`}
            disabled={themeLoading}
            aria-pressed={isDarkSelected}
            onClick={() => {
              void updateTheme({ apps: 'dark', system: 'dark' })
            }}
          >
            深色
          </button>

          <button
            type="button"
            className={`btn ${isLightSelected ? 'btnPrimary' : 'btnSecondary'}`}
            disabled={themeLoading}
            aria-pressed={isLightSelected}
            onClick={() => {
              void updateTheme({ apps: 'light', system: 'light' })
            }}
          >
            浅色
          </button>

          <button
            type="button"
            className="btn btnGhost btnIcon"
            disabled={themeLoading}
            aria-label="刷新状态"
            title="刷新状态"
            onClick={() => {
              void refreshTheme()
            }}
          >
            <svg
              className={`icon${themeLoading ? ' spinning' : ''}`}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M20 12a8 8 0 1 1-2.34-5.66"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M20 4v6h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p className="hint">提示：关闭窗口不会退出，会隐藏到托盘。</p>

        <details className="details">
          <summary>更多信息</summary>
          <div className="detailsBody">
            <div className="kv">
              <span className="label">注册表路径</span>
              <code className="code">{registryPath}</code>
            </div>
          </div>
        </details>
      </section>
    </main>
  )
}

export default App
