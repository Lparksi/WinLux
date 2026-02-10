import { useEffect, useMemo, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  AUTO_THEME_CONFIGURATION_REQUIRED_EVENT,
  geocodeAddress,
  GeocodeResult,
  getSolarSettings,
  getSunTimesBySavedLocation,
  getLanguageSettings,
  getSunTimesByAddress,
  getThemeState,
  LANGUAGE_CHANGED_EVENT,
  LanguageSettings,
  setLanguagePreference,
  openExternalUrl,
  saveSolarLocation,
  setAutoThemeEnabled,
  setThemeState,
  SolarSettings,
  SOLAR_SETTINGS_CHANGED_EVENT,
  SunTimesResult,
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

const formatDuration = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const formatLocalClock = (dateTimeText: string) => {
  const match = dateTimeText.match(/\d{2}:\d{2}:\d{2}/)
  return match ? match[0] : dateTimeText
}

function App() {
  const [themeLoading, setThemeLoading] = useState(false)
  const [themeState, setThemeStateLocal] = useState<ThemeState | null>(null)
  const [languageLoading, setLanguageLoading] = useState(false)
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings | null>(null)
  const [themeError, setThemeError] = useState<string | null>(null)
  const [addressInput, setAddressInput] = useState('')
  const [dateInput, setDateInput] = useState(() => {
    const now = new Date()
    const timezoneOffset = now.getTimezoneOffset() * 60_000
    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
  })
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [sunLoading, setSunLoading] = useState(false)
  const [solarSettingsLoading, setSolarSettingsLoading] = useState(false)
  const [autoThemeToggling, setAutoThemeToggling] = useState(false)
  const [solarError, setSolarError] = useState<string | null>(null)
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null)
  const [sunTimesResult, setSunTimesResult] = useState<SunTimesResult | null>(null)
  const [solarSettings, setSolarSettings] = useState<SolarSettings | null>(null)
  const [todaySunTimes, setTodaySunTimes] = useState<SunTimesResult | null>(null)
  const [todaySunTimesLoading, setTodaySunTimesLoading] = useState(false)

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
    void refreshSolarSettings()
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

    void listen<SolarSettings>(SOLAR_SETTINGS_CHANGED_EVENT, (event) => {
      setSolarSettings(event.payload)
      setSolarError(null)
      setSolarSettingsLoading(false)
      setAutoThemeToggling(false)
      void refreshTodaySunTimes(event.payload)

      if (event.payload.location) {
        setAddressInput(event.payload.location.address)
      }
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

    void listen<string>(AUTO_THEME_CONFIGURATION_REQUIRED_EVENT, (event) => {
      setSolarError(event.payload)
      setSolarSettingsLoading(false)
      setAutoThemeToggling(false)
      void refreshSolarSettings()
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
        void refreshSolarSettings()
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

  const resolveAddress = async () => {
    setGeocodeLoading(true)
    setSolarError(null)
    try {
      const result = await geocodeAddress(addressInput)
      setGeocodeResult(result)
    } catch (error) {
      setSolarError(error instanceof Error ? error.message : String(error))
    } finally {
      setGeocodeLoading(false)
    }
  }

  const saveAddress = async () => {
    setGeocodeLoading(true)
    setSolarError(null)
    try {
      const settings = await saveSolarLocation(addressInput)
      setSolarSettings(settings)

      if (settings.location) {
        setGeocodeResult(settings.location)
        setAddressInput(settings.location.address)
      }
    } catch (error) {
      setSolarError(error instanceof Error ? error.message : String(error))
    } finally {
      setGeocodeLoading(false)
    }
  }

  const refreshTodaySunTimes = async (settings?: SolarSettings | null) => {
    const targetSettings = settings ?? solarSettings
    if (!targetSettings?.location) {
      setTodaySunTimes(null)
      setTodaySunTimesLoading(false)
      return
    }

    setTodaySunTimesLoading(true)
    try {
      const result = await getSunTimesBySavedLocation()
      setTodaySunTimes(result)
    } catch {
      setTodaySunTimes(null)
    } finally {
      setTodaySunTimesLoading(false)
    }
  }

  const refreshSolarSettings = async () => {
    setSolarSettingsLoading(true)
    setSolarError(null)
    try {
      const settings = await getSolarSettings()
      setSolarSettings(settings)
      void refreshTodaySunTimes(settings)

      if (settings.location) {
        setAddressInput(settings.location.address)
      }
    } catch (error) {
      setSolarError(error instanceof Error ? error.message : String(error))
    } finally {
      setSolarSettingsLoading(false)
    }
  }

  const resolveSunTimes = async () => {
    setSunLoading(true)
    setSolarError(null)
    try {
      const result = await getSunTimesByAddress(addressInput, dateInput || undefined)
      setSunTimesResult(result)
      setGeocodeResult({
        address: result.address,
        display_name: result.display_name,
        latitude: result.latitude,
        longitude: result.longitude,
      })
    } catch (error) {
      setSolarError(error instanceof Error ? error.message : String(error))
    } finally {
      setSunLoading(false)
    }
  }

  const resolveSavedSunTimes = async () => {
    setSunLoading(true)
    setSolarError(null)
    try {
      const result = await getSunTimesBySavedLocation(dateInput || undefined)
      setSunTimesResult(result)
      setGeocodeResult({
        address: result.address,
        display_name: result.display_name,
        latitude: result.latitude,
        longitude: result.longitude,
      })
    } catch (error) {
      setSolarError(error instanceof Error ? error.message : String(error))
    } finally {
      setSunLoading(false)
    }
  }

  const toggleAutoTheme = async (enabled: boolean) => {
    setAutoThemeToggling(true)
    setSolarError(null)
    try {
      const settings = await setAutoThemeEnabled(enabled)
      setSolarSettings(settings)
    } catch (error) {
      setSolarError(error instanceof Error ? error.message : String(error))
    } finally {
      setAutoThemeToggling(false)
    }
  }

  const openOsmCopyright = async () => {
    setSolarError(null)
    try {
      await openExternalUrl('https://www.openstreetmap.org/copyright')
    } catch (error) {
      setSolarError(error instanceof Error ? error.message : String(error))
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
  const autoThemeStatusText =
    solarSettings?.auto_theme_enabled ? '已启用（将按日出/日落自动切换）' : '未启用'
  const savedLocationText = solarSettings?.location?.display_name ?? '未保存'
  const savedCoordinatesText = solarSettings?.location
    ? `保存坐标：纬度 ${solarSettings.location.latitude.toFixed(6)}，经度 ${solarSettings.location.longitude.toFixed(6)}`
    : null
  const todaySunTimesText = !solarSettings?.location
    ? '本日（日出/日落）：请先保存地址'
    : todaySunTimesLoading
      ? '本日（日出/日落）：读取中…'
      : todaySunTimes
        ? `本日 ${todaySunTimes.date}：日出 ${formatLocalClock(todaySunTimes.sunrise_local)}，日落 ${formatLocalClock(todaySunTimes.sunset_local)}`
        : '本日（日出/日落）：读取失败'
  const sunTimeDetails = sunTimesResult
    ? [
        { label: '地址（输入）', value: sunTimesResult.address },
        { label: '地址（解析）', value: sunTimesResult.display_name },
        {
          label: '坐标',
          value: `纬度 ${sunTimesResult.latitude.toFixed(6)}，经度 ${sunTimesResult.longitude.toFixed(6)}`,
        },
        { label: '日期', value: sunTimesResult.date },
        { label: '日出（本地）', value: sunTimesResult.sunrise_local },
        { label: '日落（本地）', value: sunTimesResult.sunset_local },
        { label: '日出（UTC）', value: sunTimesResult.sunrise_utc },
        { label: '日落（UTC）', value: sunTimesResult.sunset_utc },
        { label: '日出 Unix', value: String(sunTimesResult.sunrise_unix) },
        { label: '日落 Unix', value: String(sunTimesResult.sunset_unix) },
        {
          label: '白昼长度',
          value: `${sunTimesResult.day_length_hms}（${sunTimesResult.day_length_seconds} 秒）`,
        },
        {
          label: '当前光照状态',
          value: sunTimesResult.is_daylight ? '白天' : '夜晚',
        },
        {
          label: '推荐主题',
          value: sunTimesResult.recommended_theme === 'light' ? '浅色' : '深色',
        },
        {
          label: '下次切换',
          value: `${sunTimesResult.next_transition === 'sunrise' ? '日出' : '日落'}（本地：${sunTimesResult.next_transition_local}）`,
        },
        {
          label: '下次切换（UTC）',
          value: sunTimesResult.next_transition_utc,
        },
        {
          label: '距下次切换',
          value: `${formatDuration(sunTimesResult.seconds_until_next_transition)}（${sunTimesResult.seconds_until_next_transition} 秒）`,
        },
      ]
    : []

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiTheme)
  }, [uiTheme])

  return (
    <main className="app">
      <section className="card">
        <header className="header">
          <div className="brand">
            <p className="kicker">Theme Manager</p>
            <h1 className="title">WinLux</h1>
            <p className="subtitle">{messages.subtitle}</p>
          </div>

          <div className="statusStack">
            <span className={`badge badge-${currentTheme.tone}`}>{currentTheme.label}</span>
            {themeLoading ? <span className="statusHint">{messages.loading}</span> : null}
          </div>
        </header>

        {currentTheme.detail ? <p className="muted small">{currentTheme.detail}</p> : null}

        {themeError ? <p className="error">{themeError}</p> : null}

        <div className="actions actionsTheme">
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
            aria-label={messages.refreshStatus}
            onClick={() => {
              void refreshTheme()
              void refreshLanguage()
              void refreshSolarSettings()
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

        <section className="panel languagePanel">
          <div className="languageRow">
            <label className="label" htmlFor="language-select">
              {getLanguageMenuLabel(messages.language, currentLanguage)}
            </label>
            <select
              id="language-select"
              className="languageSelect"
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
              {messages.effectiveLanguage}: 
              {resolvedLanguageDisplayName}
              {' ('}
              {resolvedLanguageLabel}
              {')'}
            </p>
          </div>
        </section>

        <section className="panel infoPanel">
          <p className="hint">{messages.hideToTrayHint}</p>
          <p className="hint">
            地图数据版权：
            <a
              className="hintLink"
              href="https://www.openstreetmap.org/copyright"
              onClick={(event) => {
                event.preventDefault()
                void openOsmCopyright()
              }}
            >
              Data © OpenStreetMap contributors
            </a>
          </p>
        </section>

        <details className="details detailsPrimary">
          <summary>地址日照与自动切换</summary>
          <div className="detailsBody">
            <div className="kv codeGrid">
              <span className="label">自动浅色/深色切换</span>
              <div className="switchRow">
                <button
                  type="button"
                  className={`btn ${solarSettings?.auto_theme_enabled ? 'btnPrimary' : 'btnSecondary'}`}
                  disabled={autoThemeToggling || solarSettingsLoading}
                  onClick={() => {
                    void toggleAutoTheme(true)
                  }}
                >
                  启用
                </button>
                <button
                  type="button"
                  className={`btn ${solarSettings?.auto_theme_enabled ? 'btnSecondary' : 'btnPrimary'}`}
                  disabled={autoThemeToggling || solarSettingsLoading}
                  onClick={() => {
                    void toggleAutoTheme(false)
                  }}
                >
                  停用
                </button>
                <button
                  type="button"
                  className="btn btnGhost"
                  disabled={solarSettingsLoading || autoThemeToggling}
                  onClick={() => {
                    void refreshSolarSettings()
                  }}
                >
                  {solarSettingsLoading ? '读取中…' : '刷新设置'}
                </button>
              </div>
              <code className="code">当前状态：{autoThemeStatusText}</code>
              <code className="code">已保存地址：{savedLocationText}</code>
              {savedCoordinatesText ? <code className="code">{savedCoordinatesText}</code> : null}
              <code className="code">{todaySunTimesText}</code>
            </div>

            <div className="inputGrid">
              <div className="field">
                <label className="label" htmlFor="address-input">
                  地址
                </label>
                <input
                  id="address-input"
                  type="text"
                  value={addressInput}
                  placeholder="例如：上海市浦东新区"
                  onChange={(event) => {
                    setAddressInput(event.target.value)
                  }}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="date-input">
                  日期（YYYY-MM-DD）
                </label>
                <input
                  id="date-input"
                  type="date"
                  value={dateInput}
                  onChange={(event) => {
                    setDateInput(event.target.value)
                  }}
                />
              </div>
            </div>

            <div className="actions solarActions">
              <button
                type="button"
                className="btn btnSecondary"
                disabled={geocodeLoading || sunLoading}
                onClick={() => {
                  void resolveAddress()
                }}
              >
                {geocodeLoading ? '解析中…' : '解析地址'}
              </button>

              <button
                type="button"
                className="btn btnSecondary"
                disabled={geocodeLoading || sunLoading}
                onClick={() => {
                  void saveAddress()
                }}
              >
                {geocodeLoading ? '保存中…' : '保存地址'}
              </button>

              <button
                type="button"
                className="btn btnPrimary"
                disabled={sunLoading || geocodeLoading}
                onClick={() => {
                  void resolveSunTimes()
                }}
              >
                {sunLoading ? '计算中…' : '查询日出日落'}
              </button>

              <button
                type="button"
                className="btn btnPrimary"
                disabled={sunLoading || geocodeLoading || !solarSettings?.location}
                onClick={() => {
                  void resolveSavedSunTimes()
                }}
              >
                {sunLoading ? '计算中…' : '按已保存地址查询'}
              </button>

              <button
                type="button"
                className="btn btnGhost btnIcon"
                disabled={sunLoading || geocodeLoading}
                aria-label="清空结果"
                title="清空结果"
                onClick={() => {
                  setSolarError(null)
                  setGeocodeResult(null)
                  setSunTimesResult(null)
                }}
              >
                ✕
              </button>
            </div>

            {solarError ? <p className="error">{solarError}</p> : null}

            {geocodeResult ? (
              <div className="resultBlock">
                <span className="label">地址解析结果</span>
                <div className="resultList">
                  <code className="code">{geocodeResult.display_name}</code>
                  <code className="code">
                    纬度：{geocodeResult.latitude.toFixed(6)}，经度：
                    {geocodeResult.longitude.toFixed(6)}
                  </code>
                </div>
              </div>
            ) : null}

            {sunTimesResult ? (
              <div className="resultBlock">
                <span className="label">日出日落结果</span>
                <div className="resultList">
                  {sunTimeDetails.map((item) => (
                    <code key={item.label} className="code">
                      {item.label}：{item.value}
                    </code>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </details>

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
