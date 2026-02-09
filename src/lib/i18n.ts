export const INSTALLER_LANGUAGES = [
  'English',
  'SimpChinese',
  'TradChinese',
  'Japanese',
  'Korean',
  'Thai',
  'Vietnamese',
  'Indonesian',
  'French',
  'German',
  'Italian',
  'Spanish',
  'SpanishInternational',
  'Portuguese',
  'PortugueseBR',
  'Russian',
  'Polish',
  'Turkish',
  'Ukrainian',
  'Czech',
  'Hungarian',
  'Greek',
  'Bulgarian',
  'Romanian',
  'Arabic',
  'Dutch',
  'Danish',
  'Finnish',
  'Norwegian',
  'Swedish',
] as const

export type InstallerLanguage = (typeof INSTALLER_LANGUAGES)[number]

export type Messages = {
  subtitle: string
  loading: string
  dark: string
  light: string
  mixed: string
  bothDark: string
  bothLight: string
  mixedDetail: (apps: string, system: string) => string
  refreshStatus: string
  hideToTrayHint: string
  moreInfo: string
  registryPath: string
  language: string
  languageAuto: string
  effectiveLanguage: string
}

const EN_MESSAGES: Messages = {
  subtitle: 'One-click switch for Windows dark/light mode',
  loading: 'Loading…',
  dark: 'Dark',
  light: 'Light',
  mixed: 'Mixed',
  bothDark: 'Apps and system are both in dark mode',
  bothLight: 'Apps and system are both in light mode',
  mixedDetail: (apps, system) => `Apps: ${apps} | System: ${system}`,
  refreshStatus: 'Refresh status',
  hideToTrayHint: 'Tip: closing the window will hide to tray instead of exiting.',
  moreInfo: 'More Info',
  registryPath: 'Registry Path',
  language: 'Language',
  languageAuto: 'Auto (Follow system)',
  effectiveLanguage: 'Effective language',
}

const ZH_CN_MESSAGES: Messages = {
  subtitle: '一键切换 Windows 深色/浅色',
  loading: '读取中…',
  dark: '深色',
  light: '浅色',
  mixed: '混合',
  bothDark: '应用与系统均为深色模式',
  bothLight: '应用与系统均为浅色模式',
  mixedDetail: (apps, system) => `应用：${apps}｜系统：${system}`,
  refreshStatus: '刷新状态',
  hideToTrayHint: '提示：关闭窗口不会退出，会隐藏到托盘。',
  moreInfo: '更多信息',
  registryPath: '注册表路径',
  language: '语言',
  languageAuto: '自动（跟随系统）',
  effectiveLanguage: '当前生效语言',
}

const ZH_TW_MESSAGES: Messages = {
  subtitle: '一鍵切換 Windows 深色/淺色',
  loading: '讀取中…',
  dark: '深色',
  light: '淺色',
  mixed: '混合',
  bothDark: '應用程式與系統皆為深色模式',
  bothLight: '應用程式與系統皆為淺色模式',
  mixedDetail: (apps, system) => `應用程式：${apps}｜系統：${system}`,
  refreshStatus: '重新整理狀態',
  hideToTrayHint: '提示：關閉視窗不會退出，會隱藏到系統匣。',
  moreInfo: '更多資訊',
  registryPath: '登錄路徑',
  language: '語言',
  languageAuto: '自動（跟隨系統）',
  effectiveLanguage: '目前生效語言',
}

export const getMessages = (language: string): Messages => {
  if (language === 'SimpChinese') {
    return ZH_CN_MESSAGES
  }

  if (language === 'TradChinese') {
    return ZH_TW_MESSAGES
  }

  return EN_MESSAGES
}

const LANGUAGE_OPTION_LABELS: Record<InstallerLanguage, string> = {
  English: 'English',
  SimpChinese: '简体中文',
  TradChinese: '繁體中文',
  Japanese: '日本語',
  Korean: '한국어',
  Thai: 'ไทย',
  Vietnamese: 'Tiếng Việt',
  Indonesian: 'Bahasa Indonesia',
  French: 'Français',
  German: 'Deutsch',
  Italian: 'Italiano',
  Spanish: 'Español (España)',
  SpanishInternational: 'Español (Internacional)',
  Portuguese: 'Português (Portugal)',
  PortugueseBR: 'Português (Brasil)',
  Russian: 'Русский',
  Polish: 'Polski',
  Turkish: 'Türkçe',
  Ukrainian: 'Українська',
  Czech: 'Čeština',
  Hungarian: 'Magyar',
  Greek: 'Ελληνικά',
  Bulgarian: 'Български',
  Romanian: 'Română',
  Arabic: 'العربية',
  Dutch: 'Nederlands',
  Danish: 'Dansk',
  Finnish: 'Suomi',
  Norwegian: 'Norsk',
  Swedish: 'Svenska',
}

export const getLanguageOptionLabel = (language: string): string => {
  const key = language as InstallerLanguage
  return LANGUAGE_OPTION_LABELS[key] ?? language
}

export const getLanguageMenuLabel = (languageLabel: string, currentLanguage: string): string => {
  if (currentLanguage === 'English' || languageLabel === 'Language') {
    return languageLabel
  }

  return `${languageLabel} (Language)`
}

const LANGUAGE_TO_LOCALE: Record<InstallerLanguage, string> = {
  English: 'en-US',
  SimpChinese: 'zh-CN',
  TradChinese: 'zh-TW',
  Japanese: 'ja-JP',
  Korean: 'ko-KR',
  Thai: 'th-TH',
  Vietnamese: 'vi-VN',
  Indonesian: 'id-ID',
  French: 'fr-FR',
  German: 'de-DE',
  Italian: 'it-IT',
  Spanish: 'es-ES',
  SpanishInternational: 'es-419',
  Portuguese: 'pt-PT',
  PortugueseBR: 'pt-BR',
  Russian: 'ru-RU',
  Polish: 'pl-PL',
  Turkish: 'tr-TR',
  Ukrainian: 'uk-UA',
  Czech: 'cs-CZ',
  Hungarian: 'hu-HU',
  Greek: 'el-GR',
  Bulgarian: 'bg-BG',
  Romanian: 'ro-RO',
  Arabic: 'ar-SA',
  Dutch: 'nl-NL',
  Danish: 'da-DK',
  Finnish: 'fi-FI',
  Norwegian: 'nb-NO',
  Swedish: 'sv-SE',
}

export const toLanguageLocale = (language: string): string => {
  const key = language as InstallerLanguage
  return LANGUAGE_TO_LOCALE[key] ?? 'en-US'
}

export const getLanguageDisplayName = (language: string): string => {
  const locale = toLanguageLocale(language)

  try {
    const displayName = new Intl.DisplayNames([locale], { type: 'language' }).of(locale)
    return displayName ?? getLanguageOptionLabel(language)
  } catch {
    return getLanguageOptionLabel(language)
  }
}
