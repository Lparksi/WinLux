import { useEffect, useMemo, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  getLanguageSettings,
  getThemeState,
  LANGUAGE_CHANGED_EVENT,
  LanguageSettings,
  setLanguagePreference,
  setThemeState,
  ThemeState,
  THEME_STATE_CHANGED_EVENT,
} from './lib/tauri'
import {
  getLanguageDisplayName,
  getLanguageMenuLabel,
  getLanguageOptionLabel,
  getMessages,
} from './lib/i18n'

type ThemeBadgeTone = 'neutral' | 'good' | 'mix'

function App() {
  const [themeLoading, setThemeLoading] = useState(false)
  const [themeState, setThemeStateLocal] = useState<ThemeState | null>(null)
  const [languageLoading, setLanguageLoading] = useState(false)
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings | null>(null)
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

  const refreshLanguage = async () => {
    setLanguageLoading(true)
    setThemeError(null)
    try {
      const settings = await getLanguageSettings()
      setLanguageSettings(settings)
    } catch (error) {
      setThemeError(error instanceof Error ? error.message : String(error))
    } finally {
      setLanguageLoading(false)
    }
  }

  useEffect(() => {
    void refreshTheme()
    void refreshLanguage()
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
    let unlisten: (() => void) | undefined

    void listen<LanguageSettings>(LANGUAGE_CHANGED_EVENT, (event) => {
      setLanguageSettings(event.payload)
      setThemeError(null)
      setLanguageLoading(false)
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
        void refreshLanguage()
      }
    }

    window.addEventListener('focus', syncWhenVisible)
    document.addEventListener('visibilitychange', syncWhenVisible)

    return () => {
      window.removeEventListener('focus', syncWhenVisible)
      document.removeEventListener('visibilitychange', syncWhenVisible)
    }
  }, [])

  const updateLanguagePreference = async (preference: string) => {
    setLanguageLoading(true)
    setThemeError(null)
    try {
      const settings = await setLanguagePreference(preference)
      setLanguageSettings(settings)
    } catch (error) {
      setThemeError(error instanceof Error ? error.message : String(error))
    } finally {
      setLanguageLoading(false)
    }
  }

  const currentLanguage = languageSettings?.resolved ?? 'English'
  const messages = useMemo(() => getMessages(currentLanguage), [currentLanguage])

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
        label: messages.loading,
        tone: 'neutral' as ThemeBadgeTone,
        detail: '',
      }
    }

    if (themeState.apps === 'dark' && themeState.system === 'dark') {
      return {
        label: messages.dark,
        tone: 'good' as ThemeBadgeTone,
        detail: messages.bothDark,
      }
    }

    if (themeState.apps === 'light' && themeState.system === 'light') {
      return {
        label: messages.light,
        tone: 'good' as ThemeBadgeTone,
        detail: messages.bothLight,
      }
    }

    const appsLabel = themeState.apps === 'dark' ? messages.dark : messages.light
    const systemLabel = themeState.system === 'dark' ? messages.dark : messages.light

    return {
      label: messages.mixed,
      tone: 'mix' as ThemeBadgeTone,
      detail: messages.mixedDetail(appsLabel, systemLabel),
    }
  }, [themeState, messages])

  const isDarkSelected = themeState?.apps === 'dark' && themeState?.system === 'dark'
  const isLightSelected =
    themeState?.apps === 'light' && themeState?.system === 'light'

  const uiTheme = themeState?.apps ?? 'dark'
  const resolvedLanguageLabel = getLanguageOptionLabel(currentLanguage)
  const resolvedLanguageDisplayName = getLanguageDisplayName(currentLanguage)
  const languagePreference = languageSettings?.preference ?? 'auto'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiTheme)
  }, [uiTheme])

  return (
    <main className="app">
      <section className="card">
        <header className="header">
          <div>
            <h1 className="title">WinLux</h1>
            <p className="subtitle">{messages.subtitle}</p>
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
            {messages.dark}
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
            {messages.light}
          </button>

          <button
            type="button"
            className="btn btnGhost btnIcon"
            disabled={themeLoading}
            aria-label={messages.refreshStatus}
            title={messages.refreshStatus}
            onClick={() => {
              void refreshTheme()
              void refreshLanguage()
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

        <div className="languageRow">
          <label className="label" htmlFor="language-select">
            {getLanguageMenuLabel(messages.language, currentLanguage)}
          </label>
          <select
            id="language-select"
            value={languagePreference}
            disabled={languageLoading}
            onChange={(event) => {
              void updateLanguagePreference(event.target.value)
            }}
          >
            <option value="auto">{messages.languageAuto}</option>
            {(languageSettings?.available ?? []).map((language) => (
              <option key={language} value={language}>
                {getLanguageOptionLabel(language)}
              </option>
            ))}
          </select>
          <p className="hint">
            {messages.effectiveLanguage}：
            {resolvedLanguageDisplayName}
            {' ('}
            {resolvedLanguageLabel}
            {')'}
          </p>
        </div>

        <p className="hint">{messages.hideToTrayHint}</p>

        <details className="details">
          <summary>{messages.moreInfo}</summary>
          <div className="detailsBody">
            <div className="kv">
              <span className="label">{messages.registryPath}</span>
              <code className="code">{registryPath}</code>
            </div>
          </div>
        </details>
      </section>
    </main>
  )
}

export default App
