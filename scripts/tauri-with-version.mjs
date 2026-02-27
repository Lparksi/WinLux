import { spawn } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const DEFAULT_VERSION = '0.3.1'

const command = process.argv[2]
if (!command || (command !== 'dev' && command !== 'build')) {
  console.error('用法: bun run scripts/tauri-with-version.mjs <dev|build> [tauri 参数...]')
  process.exit(1)
}

const envVersion =
  process.env.WINLUX_VERSION?.trim() ||
  process.env.APP_VERSION?.trim() ||
  process.env.VERSION?.trim() ||
  ''

const resolvedVersion = envVersion || DEFAULT_VERSION
const configPatchPath = join(
  tmpdir(),
  `winlux-tauri-config-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
)
writeFileSync(configPatchPath, JSON.stringify({ version: resolvedVersion }))
const passThroughArgs = process.argv.slice(3)

console.log(`[WinLux] 当前版本: ${resolvedVersion}`)

const child = spawn(
  'bun',
  ['run', 'tauri', command, '--config', configPatchPath, ...passThroughArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      WINLUX_VERSION: resolvedVersion,
      APP_VERSION: resolvedVersion,
      VERSION: resolvedVersion,
    },
  },
)

child.on('close', (code, signal) => {
  rmSync(configPatchPath, { force: true })

  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})

child.on('error', () => {
  rmSync(configPatchPath, { force: true })
  process.exit(1)
})
