import { execSync, spawn } from 'node:child_process'

const DEFAULT_VERSION = '0.3.2'

const rawTag = (() => {
  try {
    return execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
})()

const normalized = rawTag.replace(/^v/i, '').trim()
const isSemver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(normalized)
const releaseVersion = isSemver ? normalized : DEFAULT_VERSION
const sourceHint = rawTag
  ? isSemver
    ? `(from tag: ${rawTag})`
    : `(tag 无效: ${rawTag}, 使用默认)`
  : '(default)'

console.log(`[WinLux] release 版本: ${releaseVersion} ${sourceHint}`)

const passThroughArgs = process.argv.slice(2)

const child = spawn(
  'bun',
  ['scripts/tauri-with-version.mjs', 'build', ...passThroughArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      WINLUX_VERSION: releaseVersion,
      APP_VERSION: releaseVersion,
      VERSION: releaseVersion,
    },
  },
)

child.on('close', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})

child.on('error', () => {
  process.exit(1)
})
