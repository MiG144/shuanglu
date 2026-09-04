# 🀄 双陆棋 · 打双陆

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/MiG144/shuanglu/deploy.yml?label=CI)](https://github.com/MiG144/shuanglu/actions)
[![规则](https://img.shields.io/badge/规则-V0.3-green.svg)](docs/rules/shuanglu-rules-v0.3.md)
[![在线试玩](https://img.shields.io/badge/▶️-Play%20Now-brightgreen)](https://mig144.github.io/shuanglu/)

中式双陆棋（打双陆）Web 小游戏——依据宋代洪遵《谱双》规则还原。支持人机对战与本地双人，内置新手教学、互动式实战教学与完整规则手册。

> 🤖 本项目由 AI（DeepSeek）协作构建，人工负责规则考据与准确性校准；详见 [构建方式](#构建方式)。

## ▶️ 即刻游玩

打开 **https://mig144.github.io/shuanglu/** 即可开始——无需注册，无需安装；手机浏览器支持「添加到主屏幕」作为 PWA 使用。

也可以**离线游玩**：本地执行 `npm run sea` 生成单个可执行文件（Windows 为 `双陆棋.exe`，双击即玩，关掉浏览器或点主菜单「退出本地服务」即停止）。

## ✨ 特性

- **双模式**：人机对战（AI 三档：进阶/启发式/随机）· 本地双人热座
- **六种变体**：平双陆（默认）· 回回 · 三梁/大食（三骰）· 佛 · 下赞（赏一掷）
- **完整对局**：自动掷骰（动画）· 走子可视化 · 悔棋 · 计筹多局 · 存档/读档 · 复盘
- **新手友好**：新手教学 + 互动式实战教学（5 课）+ 图文规则手册（9 章）
- **规则考据**：以《谱双》一手原文为准，规则文案逐条注明出处

## 🎯 玩法速览

双方各执 15 枚「马」，掷骰行棋，先把全部马移出棋盘者胜。棋盘 24 梁、中央以「门」分隔；白马自右归左、黑马自左归右。

| 阶段 | 要点 |
|---|---|
| 走子 | 按骰数推进：可分走两马或同一马分两步；双采走 4 步 |
| 打马 / 卡位 | 单立敌马可击落；己方两马成「梁」则敌方不能落、不能打；单梁上限 6 马 |
| 入局 | 被打落的马须先全部按点数入局，否则盘上其它马不得动 |
| 过门 / 拈出 | 全部马进入己方内区后按点数拈出离盘 |
| 胜负 | 先拈尽者胜记 1 筹；对方未过门或未拈出任何马则双筹（2 分） |

游戏内置完整教程与规则手册，也可查阅 [规则定稿 v0.3](docs/rules/shuanglu-rules-v0.3.md)。

## 🛠 开发

```bash
npm install     # 安装依赖
npm run dev     # 开发（热更新）
npm test        # 运行测试（含引擎/教学/AI/UI 共 31 项）
npm run build   # 生产构建
npm run sea     # 生成离线单文件 exe（dist-app/）
```

技术栈：**React 18 + TypeScript + Vite**。规则引擎为纯逻辑、可序列化；每次 push 自动构建 + Pages 部署（CI）。

## 📚 文档

- [文档索引](docs/README.md) — 目录结构与规则版本脉络
- [规则定稿 v0.3](docs/rules/shuanglu-rules-v0.3.md) — 现行权威规则（常局格制、14 种变体、南北局例）
- [《谱双》OCR 全文](docs/research/pushuang-ocr-fulltext.txt) — 《欣赏编》本五卷原文（供校对）

规则还原基于**公有领域古籍**——宋·洪遵《谱双》，《欣赏编》十四卷（明正德六年刊本）扫描本与识典古籍电子本互校。

## 🤝 贡献

欢迎 Issue 与 PR。规则/玩法争议以《谱双》原文为准，建议先读规则定稿与文档索引。

## 📄 许可

**MIT License**（见 [`LICENSE`](LICENSE)），可自由使用、修改、分发与商用。

## 构建方式

本项目由 DeepSeek 编程代理在需求对话的迭代中协作构建：规则考据（OCR 提取原文 → 人工审校定稿）、规则引擎、UI、测试、CI/CD、桌面打包均为此协作产出；AI 负责实现与整理，**不替代人工的历史考据判断**——所有规则结论均标注古籍出处。