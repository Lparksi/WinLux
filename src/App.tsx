import { useEffect, useMemo, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  AUTO_THEME_CONFIGURATION_REQUIRED_EVENT,
  AppErrorPayload,
  geocodeAddress,
  GeocodeResult,
  getStartupState,
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
  setSunsetOffsetMinutes,
  setStartupEnabled,
  setThemeState,
  SolarSettings,
  SOLAR_SETTINGS_CHANGED_EVENT,
  STARTUP_STATE_CHANGED_EVENT,
  StartupState,
  SunTimesResult,
  ThemeState,
  THEME_STATE_CHANGED_EVENT,
} from './lib/tauri'
import {
  getLanguageDisplayName,
  getLanguageMenuLabel,
  getLanguageOptionLabel,
  getMessages,
  translate,
} from './lib/i18n'

type ThemeBadgeTone = 'neutral' | 'good' | 'mix'

const toErrorMessage = (error: unknown, language: string): string => {
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error) as AppErrorPayload
      if (typeof parsed?.code === 'string') {
        return translate(language, parsed.code, parsed.params)
      }
    } catch {
      return error
    }

    return error
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    const payload = error as AppErrorPayload
    return translate(language, payload.code, payload.params)
  }

  return error instanceof Error ? error.message : String(error)
}

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

const SUNSET_OFFSET_MIN = 0
const SUNSET_OFFSET_MAX = 720
const SUNSET_OFFSET_PRESETS = [5, 10, 15] as const

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
  const [sunsetOffsetSaving, setSunsetOffsetSaving] = useState(false)
  const [customSunsetOffsetInput, setCustomSunsetOffsetInput] = useState('0')
  const [solarError, setSolarError] = useState<string | null>(null)
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null)
  const [sunTimesResult, setSunTimesResult] = useState<SunTimesResult | null>(null)
  const [solarSettings, setSolarSettings] = useState<SolarSettings | null>(null)
  const [todaySunTimes, setTodaySunTimes] = useState<SunTimesResult | null>(null)
  const [todaySunTimesLoading, setTodaySunTimesLoading] = useState(false)
  const [startupLoading, setStartupLoading] = useState(false)
  const [startupEnabled, setStartupEnabledLocal] = useState(false)
  const currentLanguage = languageSettings?.resolved ?? 'English'

  const registryPath =
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'

  const refreshTheme = async () => {
    setThemeLoading(true)
    setThemeError(null)
    try {
      const state = await getThemeState()
      setThemeStateLocal(state)
    } catch (error) {
      setThemeError(toErrorMessage(error, currentLanguage))
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
      setThemeError(toErrorMessage(error, currentLanguage))
    } finally {
      setLanguageLoading(false)
    }
  }

  useEffect(() => {
    void refreshTheme()
    void refreshLanguage()
    void refreshSolarSettings()
    void refreshStartupState()

    const startupResyncTimer = window.setTimeout(() => {
      void refreshStartupState()
    }, 2000)

    return () => {
      window.clearTimeout(startupResyncTimer)
    }
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

    void listen<StartupState>(STARTUP_STATE_CHANGED_EVENT, (event) => {
      setStartupEnabledLocal(event.payload.enabled)
      setThemeError(null)
      setStartupLoading(false)
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
      setSunsetOffsetSaving(false)
      void refreshTodaySunTimes(event.payload)
      setCustomSunsetOffsetInput(String(event.payload.sunset_offset_minutes))

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

    void listen<AppErrorPayload>(AUTO_THEME_CONFIGURATION_REQUIRED_EVENT, (event) => {
      setSolarError(toErrorMessage(event.payload, currentLanguage))
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
  }, [currentLanguage])

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
        void refreshStartupState()
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
      setThemeError(toErrorMessage(error, currentLanguage))
    } finally {
      setLanguageLoading(false)
    }
  }

  const refreshStartupState = async () => {
    setStartupLoading(true)
    setThemeError(null)
    try {
      const state = await getStartupState()
      setStartupEnabledLocal(state.enabled)
    } catch (error) {
      setThemeError(toErrorMessage(error, currentLanguage))
    } finally {
      setStartupLoading(false)
    }
  }

  const resolveAddress = async () => {
    setGeocodeLoading(true)
    setSolarError(null)
    try {
      const result = await geocodeAddress(addressInput)
      setGeocodeResult(result)
    } catch (error) {
      setSolarError(toErrorMessage(error, currentLanguage))
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
      setSolarError(toErrorMessage(error, currentLanguage))
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
      setCustomSunsetOffsetInput(String(settings.sunset_offset_minutes))
      void refreshTodaySunTimes(settings)

      if (settings.location) {
        setAddressInput(settings.location.address)
      }
    } catch (error) {
      setSolarError(toErrorMessage(error, currentLanguage))
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
      setSolarError(toErrorMessage(error, currentLanguage))
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
      setSolarError(toErrorMessage(error, currentLanguage))
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
      setSolarError(toErrorMessage(error, currentLanguage))
    } finally {
      setAutoThemeToggling(false)
    }
  }

  const updateSunsetOffset = async (minutes: number) => {
    setSunsetOffsetSaving(true)
    setSolarError(null)
    try {
      const settings = await setSunsetOffsetMinutes(minutes)
      setSolarSettings(settings)
      setCustomSunsetOffsetInput(String(settings.sunset_offset_minutes))
    } catch (error) {
      setSolarError(toErrorMessage(error, currentLanguage))
    } finally {
      setSunsetOffsetSaving(false)
    }
  }

  const applyCustomSunsetOffset = async () => {
    const raw = customSunsetOffsetInput.trim()
    const isDigitsOnly = /^\d+$/.test(raw)
    const value = Number.parseInt(raw, 10)

    if (!isDigitsOnly || Number.isNaN(value) || value < SUNSET_OFFSET_MIN || value > SUNSET_OFFSET_MAX) {
      setSolarError(
        translate(currentLanguage, 'errors.solar.invalid_sunset_offset_minutes', {
          min: SUNSET_OFFSET_MIN,
          max: SUNSET_OFFSET_MAX,
          value: raw || 'empty',
        }),
      )
      return
    }

    await updateSunsetOffset(value)
  }

  const openOsmCopyright = async () => {
    setSolarError(null)
    try {
      await openExternalUrl('https://www.openstreetmap.org/copyright')
    } catch (error) {
      setSolarError(toErrorMessage(error, currentLanguage))
    }
  }

  const toggleStartup = async (enabled: boolean) => {
    setStartupLoading(true)
    setThemeError(null)
    try {
      const state = await setStartupEnabled(enabled)
      setStartupEnabledLocal(state.enabled)
    } catch (error) {
      setThemeError(toErrorMessage(error, currentLanguage))
    } finally {
      setStartupLoading(false)
    }
  }

  const messages = useMemo(() => getMessages(currentLanguage), [currentLanguage])

  const updateTheme = async (next: ThemeState) => {
    setThemeLoading(true)
    setThemeError(null)
    try {
      const state = await setThemeState(next)
      setThemeStateLocal(state)
    } catch (error) {
      setThemeError(toErrorMessage(error, currentLanguage))
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
    solarSettings?.auto_theme_enabled
      ? translate(currentLanguage, 'solar.status_enabled')
      : translate(currentLanguage, 'solar.status_disabled')
  const savedLocationText =
    solarSettings?.location?.display_name ??
    translate(currentLanguage, 'solar.saved_location_empty')
  const savedCoordinatesText = solarSettings?.location
    ? translate(currentLanguage, 'solar.saved_coordinates', {
        latitude: solarSettings.location.latitude.toFixed(6),
        longitude: solarSettings.location.longitude.toFixed(6),
      })
    : null
  const todaySunTimesText = !solarSettings?.location
    ? translate(currentLanguage, 'solar.today_prompt_save_address')
    : todaySunTimesLoading
      ? translate(currentLanguage, 'solar.today_loading')
      : todaySunTimes
        ? translate(currentLanguage, 'solar.today_result', {
            date: todaySunTimes.date,
            sunrise: formatLocalClock(todaySunTimes.sunrise_local),
            sunset: formatLocalClock(todaySunTimes.sunset_local),
          })
        : translate(currentLanguage, 'solar.today_failed')
  const startupToggleText = translate(currentLanguage, 'startup.toggle')
  const startupRefreshText = translate(currentLanguage, 'startup.refresh')
  const startupCurrentStatusText = translate(currentLanguage, 'startup.current_status')
  const startupEnabledText = translate(currentLanguage, 'startup.status_enabled')
  const startupDisabledText = translate(currentLanguage, 'startup.status_disabled')
  const currentSunsetOffsetMinutes = solarSettings?.sunset_offset_minutes ?? 0
  const sunTimeDetails = sunTimesResult
    ? [
        {
          label: translate(currentLanguage, 'solar.detail.input_address'),
          value: sunTimesResult.address,
        },
        {
          label: translate(currentLanguage, 'solar.detail.parsed_address'),
          value: sunTimesResult.display_name,
        },
        {
          label: translate(currentLanguage, 'solar.detail.coordinates'),
          value: translate(currentLanguage, 'solar.detail.coordinates_value', {
            latitude: sunTimesResult.latitude.toFixed(6),
            longitude: sunTimesResult.longitude.toFixed(6),
          }),
        },
        { label: translate(currentLanguage, 'solar.detail.date'), value: sunTimesResult.date },
        {
          label: translate(currentLanguage, 'solar.detail.sunrise_local'),
          value: sunTimesResult.sunrise_local,
        },
        {
          label: translate(currentLanguage, 'solar.detail.sunset_local'),
          value: sunTimesResult.sunset_local,
        },
        {
          label: translate(currentLanguage, 'solar.detail.sunrise_utc'),
          value: sunTimesResult.sunrise_utc,
        },
        {
          label: translate(currentLanguage, 'solar.detail.sunset_utc'),
          value: sunTimesResult.sunset_utc,
        },
        {
          label: translate(currentLanguage, 'solar.detail.sunrise_unix'),
          value: String(sunTimesResult.sunrise_unix),
        },
        {
          label: translate(currentLanguage, 'solar.detail.sunset_unix'),
          value: String(sunTimesResult.sunset_unix),
        },
        {
          label: translate(currentLanguage, 'solar.detail.day_length'),
          value: translate(currentLanguage, 'solar.detail.day_length_value', {
            duration: sunTimesResult.day_length_hms,
            seconds: sunTimesResult.day_length_seconds,
          }),
        },
        {
          label: translate(currentLanguage, 'solar.detail.light_state'),
          value: sunTimesResult.is_daylight
            ? translate(currentLanguage, 'solar.detail.light_state_day')
            : translate(currentLanguage, 'solar.detail.light_state_night'),
        },
        {
          label: translate(currentLanguage, 'solar.detail.recommended_theme'),
          value:
            sunTimesResult.recommended_theme === 'light'
              ? translate(currentLanguage, 'solar.detail.theme_light')
              : translate(currentLanguage, 'solar.detail.theme_dark'),
        },
        {
          label: translate(currentLanguage, 'solar.detail.next_transition'),
          value: translate(currentLanguage, 'solar.detail.next_transition_value', {
            transition:
              sunTimesResult.next_transition === 'sunrise'
                ? translate(currentLanguage, 'solar.detail.transition_sunrise')
                : translate(currentLanguage, 'solar.detail.transition_sunset'),
            local: sunTimesResult.next_transition_local,
          }),
        },
        {
          label: translate(currentLanguage, 'solar.detail.next_transition_utc'),
          value: sunTimesResult.next_transition_utc,
        },
        {
          label: translate(currentLanguage, 'solar.detail.until_next_transition'),
          value: translate(currentLanguage, 'solar.detail.until_next_transition_value', {
            duration: formatDuration(sunTimesResult.seconds_until_next_transition),
            seconds: sunTimesResult.seconds_until_next_transition,
          }),
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
              void refreshStartupState()
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
          <div className="kv">
            <span className="label">{startupToggleText}</span>
            <div className="switchRow startupSwitchRow">
              <button
                type="button"
                className={`btn ${startupEnabled ? 'btnPrimary' : 'btnSecondary'}`}
                disabled={startupLoading}
                onClick={() => {
                  void toggleStartup(true)
                }}
              >
                {translate(currentLanguage, 'common.enable')}
              </button>
              <button
                type="button"
                className={`btn ${startupEnabled ? 'btnSecondary' : 'btnPrimary'}`}
                disabled={startupLoading}
                onClick={() => {
                  void toggleStartup(false)
                }}
              >
                {translate(currentLanguage, 'common.disable')}
              </button>
              <button
                type="button"
                className="btn btnGhost"
                disabled={startupLoading}
                onClick={() => {
                  void refreshStartupState()
                }}
              >
                {startupLoading
                  ? translate(currentLanguage, 'common.loading')
                  : startupRefreshText}
              </button>
            </div>
            <code className="code">
              {startupCurrentStatusText}
              {translate(currentLanguage, 'common.kv_separator')}
              {startupEnabled ? startupEnabledText : startupDisabledText}
            </code>
          </div>
          <p className="hint">
            {translate(currentLanguage, 'info.osm_copyright_prefix')}
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
          <summary>{translate(currentLanguage, 'solar.section_title')}</summary>
          <div className="detailsBody">
            <div className="kv codeGrid">
              <span className="label">{translate(currentLanguage, 'solar.auto_theme_toggle')}</span>
              <div className="switchRow">
                <button
                  type="button"
                  className={`btn ${solarSettings?.auto_theme_enabled ? 'btnPrimary' : 'btnSecondary'}`}
                  disabled={autoThemeToggling || solarSettingsLoading}
                  onClick={() => {
                    void toggleAutoTheme(true)
                  }}
                >
                  {translate(currentLanguage, 'common.enable')}
                </button>
                <button
                  type="button"
                  className={`btn ${solarSettings?.auto_theme_enabled ? 'btnSecondary' : 'btnPrimary'}`}
                  disabled={autoThemeToggling || solarSettingsLoading}
                  onClick={() => {
                    void toggleAutoTheme(false)
                  }}
                >
                  {translate(currentLanguage, 'common.disable')}
                </button>
                <button
                  type="button"
                  className="btn btnGhost"
                  disabled={solarSettingsLoading || autoThemeToggling}
                  onClick={() => {
                    void refreshSolarSettings()
                  }}
                >
                  {solarSettingsLoading
                    ? translate(currentLanguage, 'common.loading')
                    : translate(currentLanguage, 'solar.refresh_settings')}
                </button>
              </div>
              <span className="label">{translate(currentLanguage, 'solar.night_mode_advance_label')}</span>
              <div className="switchRow">
                {SUNSET_OFFSET_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={`btn ${currentSunsetOffsetMinutes === minutes ? 'btnPrimary' : 'btnSecondary'}`}
                    disabled={solarSettingsLoading || sunsetOffsetSaving || autoThemeToggling}
                    onClick={() => {
                      void updateSunsetOffset(minutes)
                    }}
                  >
                    {translate(currentLanguage, 'solar.night_mode_advance_preset_value', { minutes })}
                  </button>
                ))}
              </div>
              <div className="customOffsetRow">
                <div className="field">
                  <label className="label" htmlFor="sunset-offset-input">
                    {translate(currentLanguage, 'solar.night_mode_advance_custom_label')}
                  </label>
                  <input
                    id="sunset-offset-input"
                    type="number"
                    min={SUNSET_OFFSET_MIN}
                    max={SUNSET_OFFSET_MAX}
                    step={1}
                    value={customSunsetOffsetInput}
                    placeholder={translate(currentLanguage, 'solar.night_mode_advance_preset_value', {
                      minutes: 30,
                    })}
                    onChange={(event) => {
                      setCustomSunsetOffsetInput(event.target.value)
                    }}
                    disabled={solarSettingsLoading || sunsetOffsetSaving || autoThemeToggling}
                  />
                </div>
                <button
                  type="button"
                  className="btn btnGhost customOffsetApply"
                  disabled={solarSettingsLoading || sunsetOffsetSaving || autoThemeToggling}
                  onClick={() => {
                    void applyCustomSunsetOffset()
                  }}
                >
                  {sunsetOffsetSaving
                    ? translate(currentLanguage, 'common.saving')
                    : translate(currentLanguage, 'solar.night_mode_advance_apply')}
                </button>
              </div>
              <code className="code">
                {translate(currentLanguage, 'solar.current_status')}
                {translate(currentLanguage, 'common.kv_separator')}
                {autoThemeStatusText}
              </code>
              <code className="code">
                {translate(currentLanguage, 'solar.night_mode_advance_current', {
                  minutes: currentSunsetOffsetMinutes,
                })}
              </code>
              <code className="code">
                {translate(currentLanguage, 'solar.saved_address')}
                {translate(currentLanguage, 'common.kv_separator')}
                {savedLocationText}
              </code>
              {savedCoordinatesText ? <code className="code">{savedCoordinatesText}</code> : null}
              <code className="code">{todaySunTimesText}</code>
            </div>

            <div className="inputGrid">
              <div className="field">
                <label className="label" htmlFor="address-input">
                  {translate(currentLanguage, 'solar.address_label')}
                </label>
                <input
                  id="address-input"
                  type="text"
                  value={addressInput}
                  placeholder={translate(currentLanguage, 'solar.address_placeholder')}
                  onChange={(event) => {
                    setAddressInput(event.target.value)
                  }}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="date-input">
                  {translate(currentLanguage, 'solar.date_label')}
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
                {geocodeLoading
                  ? translate(currentLanguage, 'common.resolving')
                  : translate(currentLanguage, 'solar.action.resolve_address')}
              </button>

              <button
                type="button"
                className="btn btnSecondary"
                disabled={geocodeLoading || sunLoading}
                onClick={() => {
                  void saveAddress()
                }}
              >
                {geocodeLoading
                  ? translate(currentLanguage, 'common.saving')
                  : translate(currentLanguage, 'solar.action.save_address')}
              </button>

              <button
                type="button"
                className="btn btnPrimary"
                disabled={sunLoading || geocodeLoading}
                onClick={() => {
                  void resolveSunTimes()
                }}
              >
                {sunLoading
                  ? translate(currentLanguage, 'common.calculating')
                  : translate(currentLanguage, 'solar.action.query_sun_times')}
              </button>

              <button
                type="button"
                className="btn btnPrimary"
                disabled={sunLoading || geocodeLoading || !solarSettings?.location}
                onClick={() => {
                  void resolveSavedSunTimes()
                }}
              >
                {sunLoading
                  ? translate(currentLanguage, 'common.calculating')
                  : translate(currentLanguage, 'solar.action.query_saved_location')}
              </button>

              <button
                type="button"
                className="btn btnGhost btnIcon"
                disabled={sunLoading || geocodeLoading}
                aria-label={translate(currentLanguage, 'solar.action.clear_results')}
                title={translate(currentLanguage, 'solar.action.clear_results')}
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
                <span className="label">{translate(currentLanguage, 'solar.result.geocode')}</span>
                <div className="resultList">
                  <code className="code">{geocodeResult.display_name}</code>
                  <code className="code">
                    {translate(currentLanguage, 'solar.label.latitude_longitude', {
                      latitude: geocodeResult.latitude.toFixed(6),
                      longitude: geocodeResult.longitude.toFixed(6),
                    })}
                  </code>
                </div>
              </div>
            ) : null}

            {sunTimesResult ? (
              <div className="resultBlock">
                <span className="label">{translate(currentLanguage, 'solar.result.sun_times')}</span>
                <div className="resultList">
                  {sunTimeDetails.map((item) => (
                    <code key={item.label} className="code">
                      {item.label}
                      {translate(currentLanguage, 'common.kv_separator')}
                      {item.value}
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
