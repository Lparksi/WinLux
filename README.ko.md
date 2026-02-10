# WinLux

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | 한국어

WinLux는 Tauri 2 + React 기반의 Windows 전용 경량 데스크톱 유틸리티입니다.
Windows 라이트/다크 테마를 빠르게 전환하고, 시스템 트레이 상주, 앱 언어 설정 관리, 그리고 일출/일몰 기반 자동 테마 전환을 지원합니다.

## 목차

- [기능](#기능)
- [스크린샷](#스크린샷)
- [기술 스택](#기술-스택)
- [요구 사항](#요구-사항)
- [빠른 시작](#빠른-시작)
- [스크립트](#스크립트)
- [검증](#검증)
- [프로젝트 구조](#프로젝트-구조)
- [일출/일몰 자동 테마 노트](#일출일몰-자동-테마-노트)
- [OpenStreetMap 저작권 및 출처](#openstreetmap-저작권-및-출처)
- [언어 노트](#언어-노트)
- [라이선스](#라이선스)

## 기능

- Apps와 System 모두에 대해 다크/라이트 모드를 원클릭 전환.
- Windows 테마 레지스트리 읽기/쓰기:
  - `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize`
- 시스템 트레이 지원:
  - 메인 창 열기
  - 다크/라이트 빠른 전환
  - 일출/일몰 자동 테마 토글
  - 언어 설정 변경
  - 앱 종료
- 창 닫기 시 종료하지 않고 트레이로 숨김.
- 언어 설정 지원 (`auto` 시스템 추종 또는 수동 선택).
- 일출/일몰 설정 패널:
  - 일출/일몰 자동 테마 설정을 위해 주소를 좌표로 변환 (OpenStreetMap Nominatim)
  - 저장된 위치 기준으로 지정 날짜의 일출/일몰 조회
  - 로컬 일출/일몰 시각에 따라 Apps/System 테마 자동 전환
- NSIS 설치기에서 30개 언어 선택 지원.

## 스크린샷

| Main Window | Tray Menu |
| --- | --- |
| ![Main Window](docs/screenshots/main-window.png) | ![Tray Menu](docs/screenshots/tray-menu.png) |
| Main interface | Tray quick actions |

## 기술 스택

- 프론트엔드: React 18 + TypeScript + Vite
- 데스크톱 런타임: Tauri 2
- 백엔드: Rust + `winreg` + `reqwest` + `sunrise` + `tokio`
- 패키지 매니저: Bun

## 요구 사항

- Windows 10 또는 Windows 11
- Bun (최신 안정 버전 권장)
- Rust stable toolchain (MSVC 타깃)
- Windows용 Tauri 사전 요구사항 (WebView2 / 빌드 도구)
- 인터넷 연결 (OpenStreetMap Nominatim 주소 지오코딩 시에만 필요)

## 빠른 시작

```bash
bun install
bun run tauri:dev
```

앱 UI는 데스크톱 창으로 실행되며, 트레이 아이콘으로도 제어할 수 있습니다.

## 스크립트

| Command | Description |
| --- | --- |
| `bun run dev` | Vite 프론트엔드만 실행 (`http://localhost:5173`) |
| `bun run build` | 타입 체크 후 프론트엔드 자산을 `dist/`로 빌드 |
| `bun run typecheck` | TypeScript 타입 체크만 실행 |
| `bun run i18n:check` | 로케일 key 및 플레이스홀더 검증 |
| `bun run tauri:dev` | Tauri 데스크톱 앱 개발 모드 실행 |
| `bun run tauri:build` | 데스크톱 배포물 빌드 (NSIS) |
| `bun run release` | 최신 Git 태그 기반 버전 추론 후 릴리스 빌드 |
| `bun run icon:gen` | Windows 아이콘 자산 생성 |

## 검증

PR 전에 최소한 아래를 실행하세요:

```bash
bun run typecheck
cargo test -p winlux
```

## 프로젝트 구조

```text
.
├─ src/                 # React frontend and Tauri bridge
│  └─ lib/tauri.ts      # invoke wrappers + shared TS contracts
├─ src-tauri/src/       # Rust backend (commands, tray, i18n)
├─ src-tauri/icons/     # App/package icons
├─ scripts/             # Build/release helper scripts
└─ dist/                # Frontend output consumed by Tauri builds
```

## 일출/일몰 자동 테마 노트

- 지오코딩 엔드포인트:
  - `https://nominatim.openstreetmap.org/search`
- 일출/일몰 자동 테마 worker:
  - 백그라운드에서 실행되며, 저장된 좌표의 로컬 일출/일몰 기준으로 라이트/다크를 적용합니다.
  - 자동 테마가 활성화되어 있어도 위치가 저장되지 않았다면 설정 필요 오류를 반환합니다.
- 설정 저장 위치:
  - `HKCU\Software\WinLux\SolarAddress`
  - `HKCU\Software\WinLux\SolarDisplayName`
  - `HKCU\Software\WinLux\SolarLatitude`
  - `HKCU\Software\WinLux\SolarLongitude`
  - `HKCU\Software\WinLux\SolarAutoThemeEnabled`

## OpenStreetMap 저작권 및 출처

- WinLux는 OpenStreetMap Nominatim(`https://nominatim.openstreetmap.org/search`)을 사용해 사용자가 입력한 주소를 좌표로 변환하며, 이를 일출/일몰 자동 테마 기능에 사용합니다.
- 지오코딩 데이터의 저작권은 © OpenStreetMap contributors에 있으며, ODbL 1.0 라이선스로 제공됩니다.
- 저작권 및 라이선스 상세: `https://www.openstreetmap.org/copyright`

## 언어 노트

- 지원 언어 (30):
  - English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Thai, Vietnamese, Indonesian, French, German, Italian, Spanish (Spain), Spanish (International), Portuguese (Portugal), Portuguese (Brazil), Russian, Polish, Turkish, Ukrainian, Czech, Hungarian, Greek, Bulgarian, Romanian, Arabic, Dutch, Danish, Finnish, Norwegian, Swedish
- 메인 창 UI 문자열은 위 30개 언어를 모두 지원합니다.
- 트레이 메뉴 문자열은 `src/locales/tray-texts.json`에서 로드됩니다.
- 언어 설정 저장 위치:
  - `HKCU\Software\WinLux\LanguagePreference`

## 라이선스

MIT. 자세한 내용은 `LICENSE`를 참고하세요.
