import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'

execSync('bunx tauri icon src-tauri/icons/icon.svg -o src-tauri/icons', {
  stdio: 'inherit',
})

const removeTargets = [
  'src-tauri/icons/android',
  'src-tauri/icons/ios',
  'src-tauri/icons/icon.icns',
  'src-tauri/icons/32x32.png',
  'src-tauri/icons/64x64.png',
  'src-tauri/icons/128x128.png',
  'src-tauri/icons/128x128@2x.png',
  'src-tauri/icons/icon.png',
]

for (const target of removeTargets) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true })
  }
}

console.log('[WinLux] Windows-only icons generated and non-Windows assets removed.')
