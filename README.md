# 🀄 双陆棋 · 打双陆 (Chinese Backgammon)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/MiG144/shuanglu/deploy.yml?label=build%20%26%20deploy)](https://github.com/MiG144/shuanglu/actions)
[![Version](https://img.shields.io/badge/规则-V0.3-green.svg)](docs/rules/shuanglu-rules-v0.3.md)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vite.dev)
[![AI 协建](https://img.shields.io/badge/AI%20Cobuild-DeepSeek-4d6bfe.svg)](#-构建方式)
[![📖 文档索引](https://img.shields.io/badge/📖-Documentation-blue.svg)](docs/README.md)

**中式双陆棋（打双陆）Web 游戏** —— 依据宋代洪遵《谱双》五卷规则原典，以《欣赏编》十四卷（明正德六年刊本）扫描本识别核对。人机对战（PVE）· 本地双人（PVP）· 新手教学与互动式实战教学，规则引擎纯逻辑、可测试、可序列化。

> 🤖 **本项目由 AI（DeepSeek 编程代理）在需求对话的迭代中辅助构建**——规则考据、引擎实现、UI、测试、部署流水线均为 AI 协作产出，人工负责需求决策与规则准确性校准。详见「[构建方式](#-构建方式)」。

## 目录

- [✨ 特性](#-特性)
- [🎮 在线试玩](#-在线试玩)
- [🚀 快速开始](#-快速开始)
- [🎯 玩法](#-玩法)
- [📚 文档](#-文档)
- [🧩 技术栈与架构](#-技术栈与架构)
- [✅ 测试](#-测试)
- [🤖 构建方式](#-构建方式)
- [🔧 开发与发布](#-开发与发布)
- [🤝 贡献](#-贡献)
- [📄 许可](#-许可)

## ✨ 特性

- **双模式对战** — 人机对战（可执白/执黑；AI 三档：进阶前瞻 / 启发式 / 随机）· 本地双人热座（PVP）
- **六种变体** — 平双陆（默认）· 回回（任意出两马）· 三梁/大食（三骰）· 佛（十二马）· 下赞（双采赏一掷），另预留共 14 种变体接口
- **完整对局功能** — 自动掷骰（骰子动画）· 落子可视化（最近一步高亮 + 走子提示条）· 轮空自动跳过 · 悔棋（任意步）· 计筹多局 · 存档（localStorage + JSON 导出/读入）· 复盘（快照回放）
- **新手友好** — 图解规则手册 + 互动式实战教学（5 课）+ **完整规则手册**（9 章节图文并茂，三处入口随时查看），棋盘分级高亮 + 操作提示条
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

### 方式二：离线单文件可执行（无需 Node · 双击即玩）

打包为**单个可执行文件**（Node SEA，自包含运行时 + 内嵌静态资源，可整体拷到任意文件夹）：

```bash
npm run sea        # 本地生成（依赖 Node ≥ 20.12、首次自动装 postject）
```

产物在 `dist-app/`：

| 产物 | 说明 |
|---|---|
| `双陆棋.exe`（Windows）/ `双陆棋`（macOS/Linux） | 双击 → 启动内置 HTTP 服务并打开浏览器到主菜单（离线可用，幂等：重复双击不重复起服务） |

**停止方式（单 exe 设计）**：
- **自动**：直接关闭浏览器/标签页 → 服务检测到页面卸载后自动退出（延迟 3 秒防误杀：刷新或多标签继续使用不会被终止）；
- **手动**：游戏主菜单底部「⏻ 退出本地服务」按钮（仅离线 SEA 模式显示）。

> 说明：单文件 exe 内置游戏全部静态资源与 Node 运行时，**本机无需安装 Node、无需 node_modules**；`dist-app/` 为构建产物（已 gitignore），按需在目标平台重新执行 `npm run sea` 生成对应平台版本。

**各平台 SEA 构建说明**：`npm run sea` 利用 Node SEA 生成**当前平台**的可执行文件——在 Windows 上跑得到 `.exe`，在 macOS（`darwin`）上得到 `双陆棋`（ARM/Intel 各有其产物，需在对应机器构建），在 Linux 上得到 ELF 可执行文件。产物可整体拷贝到任意文件夹独立运行。打 tag（`v*`）后 CI 会自动构建 **Windows 版 exe** 并发布到 GitHub Releases 页（`https://github.com/MiG144/shuanglu/releases`），macOS/Linux 请按需本地执行 `npm run sea` 生成。

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
  ai.ts        走子 AI（随机 / 贪心启发式 / 前瞻评估三档）
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
- AI 评估与选步测试（局面评分单调性 / 暴露单立惩罚 / 进阶档合法性与整回合冒烟）
- UI 渲染冒烟测试（SSR）
- 当前 **27 项全部通过**，并纳入 CI（每次 push 自动执行）

## 🤖 构建方式

本项目由 **DeepSeek 编程代理（AI）在需求对话的迭代中辅助构建**，人工主导需求决策与规则准确性校验。协作分工大致如下：

| 环节 | 产出方 | 说明 |
|---|---|---|
| 规则考据 | AI 调研 + 人工审校 | 从《谱双》（《欣赏编》本扫描 PDF + 识典古籍本）OCR 提取原文，整理规则定稿 v1→v2→v3；终版以古籍原文为准 |
| 规则引擎 | AI 实现 + 测试验证 | 24 梁/打马/卡位/入局/拈出/终局纯逻辑引擎，配套单元测试与课件可解性测试 |
| UI / 交互 | AI 实现 | 棋盘、主菜单、互动教学、移动端适配（含响应式与触控降级） |
| 工程化 | AI 实现 | Vite 脚手架、SEA 单文件打包、GitHub Actions CI/CD、一键启动器 |
| 发布 | AI 执行 + 人工确认 | 仓库创建、Pages 部署、README / LICENSE 落地 |

**说明**：AI 负责实现与整理，**不替代人工的历史考据判断**——所有规则结论均标注古籍出处，若有争议应回到《谱双》原文核对。本声明的意义在于透明记录项目的 AI 协作属性，供使用者评估。

## 🔧 开发与发布

- **日常更新**：`git push` 即触发 GitHub Actions（27 项测试 + 构建 + Pages 部署），约 1-2 分钟线上更新。
- **本地调试**：`npm run dev`（开发热更新）；`npm run sea`（生成离线单文件 exe）。

## 🤝 贡献

欢迎 Issue 与 PR。建议先读 [规则定稿 v0.3](docs/rules/shuanglu-rules-v0.3.md) 与 [引擎结构](#-技术栈与架构)，任何规则/玩法争议以《谱双》原文为准。

- 报告问题 / 建议：提交 [Issue](https://github.com/MiG144/shuanglu/issues)
- 修改代码：Fork → 提交 PR（CI 会运行测试并自动部署预览）

## 📄 许可

**MIT License**（见 [`LICENSE`](LICENSE)），允许任何人自由使用、修改、分发、商用，仅需保留版权声明。

**致谢**：规则还原基于公版古籍——宋·洪遵《谱双》，以及《欣赏编》十四卷（明·沈津编）扫描本与识典古籍电子本（翁同龢清抄本）的互校；工程实现得力于 AI 编程代理的协作（见「[构建方式](#-构建方式)」）。