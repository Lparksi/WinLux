import { invoke } from '@tauri-apps/api/core'

export interface ThemeState {
  apps: 'light' | 'dark'
  system: 'light' | 'dark'
}

export interface LanguageSettings {
  preference: string
  resolved: string
  available: string[]
}

export interface GeocodeResult {
  address: string
  display_name: string
  latitude: number
  longitude: number
}

export interface SolarSettings {
  location: GeocodeResult | null
  auto_theme_enabled: boolean
}

export interface SunTimesResult {
  address: string
  display_name: string
  latitude: number
  longitude: number
  date: string
  sunrise_utc: string
  sunset_utc: string
  sunrise_local: string
  sunset_local: string
  sunrise_unix: number
  sunset_unix: number
  day_length_seconds: number
  day_length_hms: string
  is_daylight: boolean
  recommended_theme: 'light' | 'dark'
  next_transition: 'sunrise' | 'sunset'
  next_transition_local: string
  next_transition_utc: string
  seconds_until_next_transition: number
}

export const getThemeState = (): Promise<ThemeState> => {
  return invoke('get_theme_state')
}

export const setThemeState = (state: ThemeState): Promise<ThemeState> => {
  return invoke('set_theme_state', { state })
}

export const getLanguageSettings = (): Promise<LanguageSettings> => {
  return invoke('get_language_settings')
}

export const setLanguagePreference = (preference: string): Promise<LanguageSettings> => {
  return invoke('set_language_preference', { preference })
}

export const geocodeAddress = (address: string): Promise<GeocodeResult> => {
  return invoke('geocode_address', { address })
}

export const getSolarSettings = (): Promise<SolarSettings> => {
  return invoke('get_solar_settings')
}

export const saveSolarLocation = (address: string): Promise<SolarSettings> => {
  return invoke('save_solar_location', { address })
}

export const setAutoThemeEnabled = (enabled: boolean): Promise<SolarSettings> => {
  return invoke('set_auto_theme_enabled', { enabled })
}

export const getSunTimesByAddress = (
  address: string,
  date?: string,
): Promise<SunTimesResult> => {
  return invoke('get_sun_times_by_address', { address, date })
}

export const getSunTimesBySavedLocation = (date?: string): Promise<SunTimesResult> => {
  return invoke('get_sun_times_by_saved_location', { date })
}

export const openExternalUrl = (url: string): Promise<void> => {
  return invoke('open_external_url', { url })
}

export const THEME_STATE_CHANGED_EVENT = 'theme-state-changed'
export const LANGUAGE_CHANGED_EVENT = 'language-changed'
export const SOLAR_SETTINGS_CHANGED_EVENT = 'solar-settings-changed'
export const AUTO_THEME_CONFIGURATION_REQUIRED_EVENT =
  'auto-theme-configuration-required'
