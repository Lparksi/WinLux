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

export const THEME_STATE_CHANGED_EVENT = 'theme-state-changed'
export const LANGUAGE_CHANGED_EVENT = 'language-changed'
