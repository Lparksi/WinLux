import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const localesRoot = join(scriptDir, '../src/locales')
const localeFolders = readdirSync(localesRoot).filter((name) => {
  const fullPath = join(localesRoot, name)
  return statSync(fullPath).isDirectory()
})

const locales = Object.fromEntries(
  localeFolders.map((locale) => {
    const contentPath = join(localesRoot, locale, 'common.json')
    const content = JSON.parse(readFileSync(contentPath, 'utf8'))
    return [locale, content]
  }),
)

const [baseLocale, ...restLocales] = Object.keys(locales)
const baseKeys = new Set(Object.keys(locales[baseLocale]))

const trayTextsPath = new URL('../src/locales/tray-texts.json', import.meta.url)
const trayTexts = JSON.parse(readFileSync(trayTextsPath, 'utf8'))
const trayRequiredKeys = [
  'open_main',
  'dark_mode',
  'light_mode',
  'language_menu',
  'language_auto',
  'quit',
]

const collectPlaceholders = (value) => {
  if (typeof value !== 'string') {
    return []
  }

  return Array.from(value.matchAll(/\{([a-zA-Z0-9_]+)\}/g), (match) => match[1]).sort()
}

let hasError = false

for (const locale of restLocales) {
  const keys = new Set(Object.keys(locales[locale]))

  const missing = [...baseKeys].filter((key) => !keys.has(key))
  const extra = [...keys].filter((key) => !baseKeys.has(key))

  if (missing.length > 0) {
    hasError = true
    console.error(`[i18n] ${locale} 缺失 key: ${missing.join(', ')}`)
  }

  if (extra.length > 0) {
    hasError = true
    console.error(`[i18n] ${locale} 存在冗余 key: ${extra.join(', ')}`)
  }

  for (const key of baseKeys) {
    if (!keys.has(key)) {
      continue
    }

    const basePlaceholders = collectPlaceholders(locales[baseLocale][key]).join(',')
    const localePlaceholders = collectPlaceholders(locales[locale][key]).join(',')

    if (basePlaceholders !== localePlaceholders) {
      hasError = true
      console.error(
        `[i18n] ${locale} 占位符不匹配: ${key} (base=${basePlaceholders || '∅'}, locale=${localePlaceholders || '∅'})`,
      )
    }
  }
}

if (hasError) {
  process.exit(1)
}

for (const [language, textSet] of Object.entries(trayTexts)) {
  for (const key of trayRequiredKeys) {
    if (!(key in textSet)) {
      hasError = true
      console.error(`[i18n] tray 文案缺失: ${language}.${key}`)
      continue
    }

    if (typeof textSet[key] !== 'string' || textSet[key].trim().length === 0) {
      hasError = true
      console.error(`[i18n] tray 文案为空: ${language}.${key}`)
    }
  }
}

if (!('English' in trayTexts)) {
  hasError = true
  console.error('[i18n] tray 文案缺少 English 兜底')
}

if (hasError) {
  process.exit(1)
}

console.log('[i18n] locale key 与占位符校验通过')
