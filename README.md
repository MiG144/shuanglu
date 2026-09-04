# 双陆棋 · 打双陆

中式双陆棋（打双陆）Web 小游戏。以宋代洪遵《谱双》五卷为规则依据——规则原文按**《欣赏编》十四卷（明·沈津编，明正德六年刊本）**扫描本识别核对，并以识典古籍电子本（翁同龢清抄本）互校。
支持 PVE（人机对战）与 PVP（本地热座）。

技术栈：**React + TypeScript + Vite**（规则引擎为纯逻辑、可测试、可序列化）。

## 常用命令

```bash
npm install        # 安装依赖
npm run dev        # 本地开发（Vite dev server）
npm run build      # 构建（tsc --noEmit && vite build）
npm run preview    # 预览构建产物
npm test           # 运行引擎单元测试 + UI 冒烟测试（Vitest）
npm run typecheck  # 仅类型检查
```

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
  双陆规则草案-v0.1.md   # 需求期草案（含待定点，已被 v0.2 取代）
  双陆规则定稿-v0.2.md    # 依据《谱双》（识典古籍本）定稿
  双陆规则定稿-v0.3.md    # 依据《欣赏编》本《谱双》全书扫描核对定稿（含地域变体）
  谱双-OCR全文-欣赏编本.txt  # 《欣赏编》本《谱双》五卷全文 OCR 文本（供校对）
```

## 功能清单

- **对决模式**：人机对战（PVE，可执白/执黑、AI 随机/启发式）· 本地双人热座（PVP）
- **变体选择**：平双陆（默认）· 回回（任意出两马）· 三梁（三骰）· 佛（十二马）· 下赞（双采赏一掷）· 大食（三骰）
- **对局功能**：自动掷骰 · 轮空自动跳过 · 悔棋（任意步）· 计筹多局（先胜 1/2/3/5 局）· 存档（localStorage + 导出/读入 JSON）· 复盘（快照回放）
- **规则提示**：入局/拈出/双采/赏一掷状态标注；可拈出格高亮

## 规则要点（详见 docs/双陆规则定稿-v0.3.md）

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
