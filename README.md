# 双陆棋 · 打双陆

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/MiG144/shuanglu/deploy.yml?label=build%20%26%20deploy)](https://github.com/MiG144/shuanglu/actions)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vite.dev)
[![在线试玩](https://img.shields.io/badge/%F0%9F%8E%AE%20Play-https%3A%2F%2Fmig144.github.io%2Fshuanglu%2F-brightgreen)](https://mig144.github.io/shuanglu/)

中式双陆棋（打双陆）Web 小游戏。以宋代洪遵《谱双》五卷为规则依据——规则原文按**《欣赏编》十四卷（明·沈津编，明正德六年刊本）**扫描本识别核对，并以识典古籍电子本（翁同龢清抄本）互校。
支持 PVE（人机对战）与 PVP（本地热座），内置新手教学与互动式实战教学。

技术栈：**React + TypeScript + Vite**（规则引擎为纯逻辑、可测试、可序列化）。

## 🎮 在线试玩

部署到 GitHub Pages 后，直接访问：

```
https://mig144.github.io/shuanglu/
```

构建产物使用相对路径 base，任意子路径托管均可正常加载。

## 常用命令

```bash
npm install        # 安装依赖
npm run dev        # 本地开发（Vite dev server，热更新）
npm run build      # 构建（tsc --noEmit && vite build）
npm run preview    # 预览构建产物
npm test           # 运行引擎单元测试 + UI 冒烟测试（Vitest）
npm run typecheck  # 仅类型检查
```

## 一键启动（无需命令行 · 跨平台）

项目根目录提供**各平台双击即用**的入口（可复制到桌面/Applications）。所有入口只做一件事：调用跨平台的 `scripts/launch.mjs`（构建→起服务→开浏览器）或 `scripts/stop.mjs`（结束服务）。

| 平台 | 启动 | 停止 |
|---|---|---|
| Windows | `启动双陆棋.cmd` | `停止双陆棋.cmd` |
| macOS | `启动双陆棋.command`（需先 `chmod +x`） | `停止双陆棋.command` |
| Linux | `启动双陆棋.desktop`（改路径 + `chmod +x`） | `停止双陆棋.desktop` |

Windows 补充：右键 `启动双陆棋.cmd` → 发送到 → 桌面快捷方式，即为桌面图标入口。

> 说明：
> - 首次双击启动会先执行 `npm run build`（约几秒），之后秒开；改过源码后再启动会自动重新构建。
> - 服务默认端口 4173（被占用时自动 +1，浏览器打开的是实际端口）；服务在后台运行，关闭浏览器可再次双击重复打开。
> - 停止脚本只结束本项目记录的预览进程 PID（`server.pid`），不会误杀其它 node 进程。
> - **路径注意**：`.cmd`/`.command` 用脚本所在目录定位，移动整个文件夹也无碍；`.desktop` 需手动把 `Path`/`Exec` 改为你的实际项目路径（见文件内注释）。
> - 若把项目复制到 macOS/Linux，记得 `chmod +x 启动双陆棋.command`（或 `.desktop`）。

## 更多启动形态（进阶）

- **单文件可执行（无需 Node）**：用 Node SEA（`node --experimental-sea-config`）把 `scripts/launch.mjs` 编译成各平台单个二进制，双击即运行，本机免装 Node。
- **原生桌面 App（终态）**：Tauri 把 `dist` 静态资源嵌入，出 Windows/macOS/Linux 原生安装包，离线、无端口、无后台进程。
- **纯 Web 部署（连启动器都不需要）**：项目是纯静态站，构建后推到 GitHub Pages / Netlify / Cloudflare Pages，得到 URL 后手机/平板/任意设备浏览器即玩。

## 项目结构

```
src/
  game/            # 规则引擎（纯逻辑）
    types.ts       # 类型定义（GameState / Move / GameOptions / 变体）
    geometry.ts    # 坐标/几何工具（玩家坐标 <-> 全局物理格）
    engine.ts      # 核心引擎：掷骰、legalMoves、isLegalMove、applyMove、skipRemaining、打马/入局/拈出/终局、序列化
    ai.ts          # 走子 AI（random / greedy）
    index.ts       # 公共导出
  components/
    Board.tsx      # 棋盘 UI（24 梁 + 门 + 梁頭/梁末 + 走法高亮）
  App.tsx          # 对局协调：掷骰、回合、PVE/热座、悔棋、计筹、存局、复盘
tests/
  engine.test.ts   # 规则引擎单元测试（17 项）
  ui-smoke.test.tsx # UI 渲染冒烟（SSR）测试（3 项）
docs/
  README.md                  # 文档索引（推荐从这里进入）
  rules/shuanglu-rules-v0.3.md  # ★ 现行规则定稿（权威依据）
  research/pushuang-ocr-fulltext.txt  # 《谱双》五卷全文 OCR 文本（供校对）
  archive/                   # 历史版本（v0.1 草案 / v0.2 初定稿）
```

## 功能清单

- **对决模式**：人机对战（PVE，可执白/执黑、AI 随机/启发式）· 本地双人热座（PVP）
- **变体选择**：平双陆（默认）· 回回（任意出两马）· 三梁（三骰）· 佛（十二马）· 下赞（双采赏一掷）· 大食（三骰）
- **对局功能**：自动掷骰 · 轮空自动跳过 · 悔棋（任意步）· 计筹多局（先胜 1/2/3/5 局）· 存档（localStorage + 导出/读入 JSON）· 复盘（快照回放）
- **新手教学**：静态图解手册 + 互动式实战教学（5 课：走子/打马/入局/拈出/双采）
- **规则提示**：入局/拈出/双采/赏一掷状态标注；可走马/可落点/可拈出分级高亮；操作提示条

## 规则要点（详见 docs/rules/shuanglu-rules-v0.3.md）

- 棋盘 24 梁、两门；白马自右归左、黑马自左归右。
- 每方 15 马（佛双陆 12 马）；单梁上限 6 马。
- 打马：单立马可击落；两马成梁则不可打不可落。
- 入局：被击落马须先全部复进（按采数落子），否则盘上马不得走。
- 过门后拈出离盘；拈尽者胜；敌未归梁或未拈出则"双筹"。
- 变体差异（详见 v0.3 文档）：三梁/大食用三骰；回回出局任意两马；佛双陆不布局、十二马；下赞双采赏一掷。

## 引擎配置项（`GameOptions`）

| 项 | 说明 | 默认 |
|---|---|---|
| `maxStack` | 单梁马数上限（"一道不得过六马"） | 6 |
| `doublesFourMoves` | 双采走四步（"併移四馬"） | true |
| `doublesBonusRoll` | 双采赏一掷（下赞/大食） | false |
| `entryCanHit` | 入局可打单立马 | true |
| `bearOffTolerance` | `standard` 按采数 / `arbitraryTwo` 任意出（回回） | standard |
| `diceCount` | 骰子数 2 / 3（三梁/大食） | 2 |
| `pieceCount` | 马数 15 / 12（佛） | 15 |
| `variant` | 玩法变体标识（预留 14 种） | ping |

配置在 `createInitialState(player, options)` 时固化进 `state.options`；`legalMoves`/`chooseMove` 默认自动读取，保证整局一致、可序列化同步。

## 《谱双》各卷（《欣赏编》本，PDF 页 399–449）

| 卷 | 内容 |
|---|---|
| 卷一 | 盘马制度（图）：北双陆盘 / 广州双陆板 / 大食双陆毯 / 真腊阁婆双陆板 |
| 卷二 | 北双陆（开局图）、平双陆、打间、回回、七梁、三梁 |
| 卷三 | 广州：罗嬴、下赞（双采走四+赏一掷）、不打（无骰喊彩）、佛（十二马）、三堆 |
| 卷四 | 南番东夷：四架八、南皮、大食（三骰）、日本（归一为胜） |
| 卷五 | 总录：常局格制、南北局例、事始、盘马（两门二十四路）、骰子、赌赛、名称、杂记 |

## 🚀 发布与日常更新

本仓库已发布：

- **仓库**：https://github.com/MiG144/shuanglu
- **在线地址**：https://mig144.github.io/shuanglu/
- **部署方式**：GitHub Pages（Source = GitHub Actions），`.github/workflows/deploy.yml` 负责构建+测试+部署，每次 push 自动生效。

日常更新只需：

```bash
git add -A
git commit -m "描述改动"
git push        # 自动触发 Actions 构建部署，约 1-2 分钟后线上更新
```

> 说明：`docs/欣赏编….pdf`（约 27MB 古籍扫描件）未入库（见 `.gitignore`），因此仓库体积很小；规则结论与 OCR 文本均在 `docs/`。

## 📄 许可

**MIT License**（见 `LICENSE`）。允许任何人自由使用、修改、分发、商用，仅需保留版权声明。

古籍说明：`docs/research/pushuang-ocr-fulltext.txt` 的 OCR 文本转录自**公版古籍《谱双》（宋·洪遵）**，规则整理为研究性笔记；`docs/欣赏编….pdf`（扫描原件）不随仓库分发。
