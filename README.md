# 🀄 双陆棋 · 打双陆 (Chinese Backgammon)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/MiG144/shuanglu/deploy.yml?label=build%20%26%20deploy)](https://github.com/MiG144/shuanglu/actions)
[![Version](https://img.shields.io/badge/规则-V0.3-green.svg)](docs/rules/shuanglu-rules-v0.3.md)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vite.dev)
[![📖 文档索引](https://img.shields.io/badge/📖-Documentation-blue.svg)](docs/README.md)

**中式双陆棋（打双陆）Web 游戏** —— 依据宋代洪遵《谱双》五卷规则原典，以《欣赏编》十四卷（明正德六年刊本）扫描本识别核对。人机对战（PVE）· 本地双人（PVP）· 新手教学与互动式实战教学，规则引擎纯逻辑、可测试、可序列化。

## 目录

- [✨ 特性](#-特性)
- [🎮 在线试玩](#-在线试玩)
- [🚀 快速开始](#-快速开始)
- [🎯 玩法](#-玩法)
- [📚 文档](#-文档)
- [🧩 技术栈与架构](#-技术栈与架构)
- [✅ 测试](#-测试)
- [🔧 开发与发布](#-开发与发布)
- [🤝 贡献](#-贡献)
- [📄 许可](#-许可)

## ✨ 特性

- **双模式对战** — 人机对战（可执白/执黑，AI 随机/启发式）· 本地双人热座（PVP）
- **六种变体** — 平双陆（默认）· 回回（任意出两马）· 三梁/大食（三骰）· 佛（十二马）· 下赞（双采赏一掷），另预留共 14 种变体接口
- **完整对局功能** — 自动掷骰 · 轮空自动跳过 · 悔棋（任意步）· 计筹多局 · 存档（localStorage + JSON 导出/读入）· 复盘（快照回放）
- **新手友好** — 图解规则手册 + **互动式实战教学**（5 课：走子/打马/入局/拈出/双采），棋盘分级高亮（可走/可落/可拈出）+ 操作提示条
- **规则考据** — 以《谱双》一手原文为权威，规则文档 v0.3 逐条注明出处，含 14 种地域变体与南北局例术语

## 🎮 在线试玩

<p align="center">
  <a href="https://mig144.github.io/shuanglu/">
    <img src="https://img.shields.io/badge/▶️%20立即开始游玩-https%3A%2F%2Fmig144.github.io%2Fshuanglu%2F-brightgreen?style=for-the-badge" alt="Play">
  </a>
</p>

**https://mig144.github.io/shuanglu/** — 打开即玩，无需注册、无需安装（首次进入会弹出教学，也可直接开始对局）。

## 🚀 快速开始

### 方式一：在线游玩（零安装）
直接访问上述在线地址，浏览器即可运行。

### 方式二：本地一键启动（无需命令行 · 跨平台）

项目根目录提供各平台**双击即用**的入口（可复制到桌面/Applications），内部调用 `scripts/launch.mjs`（构建 → 起服务 → 自动开浏览器）：

| 平台 | 启动 | 停止 |
|---|---|---|
| Windows | `启动双陆棋.cmd`（或右键→发送到→桌面快捷方式） | `停止双陆棋.cmd` |
| macOS | `启动双陆棋.command`（首次需 `chmod +x`） | `停止双陆棋.command` |
| Linux | `启动双陆棋.desktop`（修改 `Path`/`Exec` 为实际路径后 `chmod +x`） | `停止双陆棋.desktop` |

> 首次双击会先构建（数秒），之后秒开；服务默认端口 4173（占用自动 +1）；停止脚本按 `server.pid` 精确结束本项目进程，不误杀其它 node。

### 方式三：源码开发

```bash
npm install        # 安装依赖
npm run dev        # 开发模式（Vite 热更新）
npm test           # 运行全部测试
npm run build      # 生产构建
npm run preview    # 预览构建产物
```

## 🎯 玩法

**目标**：双方各执 15 枚「马」，掷骰行棋，先把全部马移出棋盘者胜。

| 阶段 | 规则 |
|---|---|
| **走子** | 棋盘 24 梁、中央以「门」分隔；白马自右归左、黑马自左归右。按骰数推进，可分走两马或同一马分两步走；双采按该点数走 4 步 |
| **打马 / 卡位** | 单立敌马可被击落（打马）；己方两马成「梁」则敌方不能落子、不能打，但可越过；单梁上限 6 马 |
| **入局** | 被打落的马必须先按点数入局，界外有马时盘上其它马不得行动 |
| **过门 / 拈出** | 全部马进入己方内区后按点数「拈出」离盘 |
| **胜负计筹** | 先拈尽者胜，记 1 筹；对方未过门或未拈出任何马则赢 2 筹（双筹） |

完整规则与全部变体见 [规则定稿 v0.3](docs/rules/shuanglu-rules-v0.3.md)；游戏内置**互动教学**可边玩边学。

## 📚 文档

| 文档 | 说明 |
|---|---|
| [📖 文档索引](docs/README.md) | 推荐入口：目录结构、规则版本脉络 |
| [📗 规则定稿 v0.3](docs/rules/shuanglu-rules-v0.3.md) | ★ 现行权威规则——五卷结构、常局格制、14 种变体、南北局例、引擎配置 |
| [📜 《谱双》OCR 全文](docs/research/pushuang-ocr-fulltext.txt) | 《欣赏编》本《谱双》五卷全文（含置信度，供校对） |

**规则版本**：v0.1（需求草案）→ v0.2（识典古籍本初定稿）→ **v0.3（现行，按《欣赏编》本全书核对）**。历史版本存于 `docs/archive/`。

> 规则考据说明：OCR 语音文本转录自**公版古籍《谱双》**（宋·洪遵），为研究性整理；《欣赏编》扫描原件（约 27MB PDF）不随仓库分发。

## 🧩 技术栈与架构

**React 18 + TypeScript + Vite 5**，规则引擎与 UI 完全解耦：

```
src/game/  纯逻辑引擎（无 React 依赖）
  engine.ts    掷骰 / legalMoves / isLegalMove / applyMove / skipRemaining / 序列化
  types.ts     GameState / Move / GameOptions（含 14 种变体）
  geometry.ts  玩家坐标 ↔ 全局物理格
  ai.ts        走子 AI（随机 / 启发式）
  tutorial.ts  互动教学课件（5 课）
```

引擎设计要点：状态为**纯数据、可序列化**（`serializeState`/`loadState`），配置在 `createInitialState` 时固化进 `state.options`，`legalMoves`/`chooseMove` 自动读取——对局全程配置一致、可存档/同步/联机复用。

### 引擎配置项（`GameOptions`）

| 项 | 说明 | 默认 |
|---|---|---|
| `maxStack` | 单梁马数上限（"一道不得过六马"） | 6 |
| `doublesFourMoves` | 双采走四步（"併移四馬"） | `true` |
| `doublesBonusRoll` | 双采赏一掷（下赞/大食） | `false` |
| `entryCanHit` | 入局可打单立马 | `true` |
| `bearOffTolerance` | `standard` 按采数 / `arbitraryTwo` 任意出（回回） | `standard` |
| `diceCount` | 骰子数 2 / 3（三梁/大食） | `2` |
| `pieceCount` | 马数 15 / 12（佛） | `15` |
| `variant` | 玩法变体标识（预留 14 种） | `ping` |

## ✅ 测试

```bash
npm test
```

- 规则引擎单元测试（摆位/打马/卡位/入局/拈出/终局/变体/序列化）
- 互动教学课件**可解性回放测试**（每课逐步用引擎校验）
- UI 渲染冒烟测试（SSR）
- 当前 **22 项全部通过**，并纳入 CI（每次 push 自动执行）

## 🔧 开发与发布

- **日常更新**：`git push` 即触发 GitHub Actions（22 项测试 + 构建 + Pages 部署），约 1-2 分钟线上更新。
- **本地启动服务**：`npm run dev`（开发）或双击各平台启动脚本（生产预览）。

## 🤝 贡献

欢迎 Issue 与 PR。建议先读 [规则定稿 v0.3](docs/rules/shuanglu-rules-v0.3.md) 与 [引擎结构](#-技术栈与架构)，任何规则/玩法争议以《谱双》原文为准。

- 报告问题 / 建议：提交 [Issue](https://github.com/MiG144/shuanglu/issues)
- 修改代码：Fork → 提交 PR（CI 会运行测试并自动部署预览）

## 📄 许可

**MIT License**（见 [`LICENSE`](LICENSE)），允许任何人自由使用、修改、分发、商用，仅需保留版权声明。

**致谢**：规则还原基于公版古籍——宋·洪遵《谱双》，以及《欣赏编》十四卷（明·沈津编）扫描本与识典古籍电子本（翁同龢清抄本）的互校。