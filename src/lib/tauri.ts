import { invoke } from '@tauri-apps/api/core'

export interface ThemeState {
  apps: 'light' | 'dark'
  system: 'light' | 'dark'
}

export const getThemeState = (): Promise<ThemeState> => {
  return invoke('get_theme_state')
}

export const setThemeState = (state: ThemeState): Promise<ThemeState> => {
  return invoke('set_theme_state', { state })
}

export const THEME_STATE_CHANGED_EVENT = 'theme-state-changed'
