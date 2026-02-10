# WinLux

[English](./README.md) | 简体中文 | [日本語](./README.ja.md) | [한국어](./README.ko.md)

WinLux 是一个基于 Tauri 2 + React 的轻量级 Windows 桌面工具。
它可以快速切换 Windows 深色/浅色主题，常驻系统托盘，并支持日出/日落自动主题切换。

## 目录

- [功能特性](#功能特性)
- [截图](#截图)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [常用脚本](#常用脚本)
- [验证建议](#验证建议)
- [项目结构](#项目结构)
- [日出/日落自动主题说明](#日出日落自动主题说明)
- [OpenStreetMap 版权与归属说明](#openstreetmap-版权与归属说明)
- [语言说明](#语言说明)
- [许可证](#许可证)

## 功能特性

- 一键切换深色与浅色模式（同时作用于 Apps 与 System）。
- 读取与写入 Windows 主题注册表：
  - `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize`
- 系统托盘支持：
  - 打开主窗口
  - 快速切换深色/浅色
  - 切换日出/日落自动主题
  - 调整语言偏好
  - 退出应用
- 关闭窗口不退出（隐藏到托盘）。
- 支持语言偏好（`auto` 跟随系统或手动选择）。
- 日出/日落设置面板：
  - 为日出/日落自动主题配置将地址解析为坐标（OpenStreetMap Nominatim）
  - 保存地点并查询指定日期的日出/日落
  - 按本地日出/日落时刻自动切换 Apps/System 主题
- NSIS 安装器支持 30 种语言选择。

## 截图

| 主窗口 | 托盘菜单 |
| --- | --- |
| ![主窗口](docs/screenshots/main-window.png) | ![托盘菜单](docs/screenshots/tray-menu.png) |
| 主界面 | 托盘快捷操作 |

## 技术栈

- 前端：React 18 + TypeScript + Vite
- 桌面运行时：Tauri 2
- 后端：Rust + `winreg` + `reqwest` + `sunrise` + `tokio`
- 包管理器：Bun

## 环境要求

- Windows 10 或 Windows 11
- Bun（建议最新稳定版）
- Rust stable 工具链（MSVC 目标）
- Windows 平台 Tauri 依赖（WebView2 / 构建工具链）
- 网络访问（仅地址地理编码时需要，用于 OpenStreetMap Nominatim）

## 快速开始

```bash
bun install
bun run tauri:dev
```

运行后会启动桌面窗口，同时可通过托盘图标进行操作。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `bun run dev` | 仅启动 Vite 前端（`http://localhost:5173`） |
| `bun run build` | 类型检查并构建前端资源到 `dist/` |
| `bun run typecheck` | 仅执行 TypeScript 类型检查 |
| `bun run i18n:check` | 校验多语言 key 与占位符一致性 |
| `bun run tauri:dev` | 启动 Tauri 桌面开发模式 |
| `bun run tauri:build` | 构建桌面安装包（NSIS） |
| `bun run release` | 按最新 Git Tag 推导版本并执行构建 |
| `bun run icon:gen` | 生成 Windows 图标资源 |

## 验证建议

提交 PR 前，至少执行：

```bash
bun run typecheck
cargo test -p winlux
```

## 项目结构

```text
.
├─ src/                 # React 前端与 Tauri 桥接
│  └─ lib/tauri.ts      # invoke 封装与 TS 协议类型
├─ src-tauri/src/       # Rust 后端（commands、tray、i18n）
├─ src-tauri/icons/     # 应用/安装包图标
├─ scripts/             # 构建与发布辅助脚本
└─ dist/                # 供 Tauri 打包使用的前端产物
```

## 日出/日落自动主题说明

- 地理编码接口：
  - `https://nominatim.openstreetmap.org/search`
- 日出/日落自动主题 worker：
  - 后台运行，并根据已保存坐标的本地日出/日落时间切换浅色/深色。
  - 若已开启日出/日落自动主题但未保存地点，应用会提示“需要先完成配置”。
- 相关设置存储位置：
  - `HKCU\Software\WinLux\SolarAddress`
  - `HKCU\Software\WinLux\SolarDisplayName`
  - `HKCU\Software\WinLux\SolarLatitude`
  - `HKCU\Software\WinLux\SolarLongitude`
  - `HKCU\Software\WinLux\SolarAutoThemeEnabled`

## OpenStreetMap 版权与归属说明

- WinLux 使用 OpenStreetMap Nominatim（ https://nominatim.openstreetmap.org/search ） 将用户输入地址转换为经纬度，用于日出/日落自动主题功能。
- 地理编码数据版权归 © OpenStreetMap contributors，采用 ODbL 1.0 许可。
- 版权与许可详情：`https://www.openstreetmap.org/copyright`

## 语言说明

- 主窗口界面文案已覆盖上述 30 种语言选项。
- 托盘菜单文案已外置到 `src/locales/tray-texts.json`，覆盖 30 个安装器语言标识。
- 语言偏好存储位置：
  - `HKCU\Software\WinLux\LanguagePreference`

## 许可证

MIT，详见 `LICENSE`。
