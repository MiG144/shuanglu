import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Board } from './components/Board'
import { Dice } from './components/Dice'
import { HomeScreen } from './components/HomeScreen'
import { RulesManual } from './components/RulesManual'
import { Tutorial } from './components/Tutorial'
import type { Die, GameOptions, GameState, Move, Player } from './game'
import {
  createInitialState,
  rollDice,
  legalMoves,
  applyMove,
  chooseMove,
  skipRemaining,
  serializeState,
  loadState,
} from './game'
import { TUT_LESSONS, createLessonState, getLesson } from './game/tutorial'
import { sfx } from './game/sfx'
import { loadStats, recordResult, resetStats } from './game/stats'
import type { MatchStats } from './game/stats'
import { quoteForMove } from './game/quotes'

const TUTORIAL_KEY = 'shuanglu.tutorialSeen'

function makeDice(count: 2 | 3 = 2): Die[] {
  const d = (): Die => (1 + Math.floor(Math.random() * 6)) as Die
  return Array.from({ length: count }, () => d())
}

/** 变体展示名（与 src/game/types.ts 的 variant 一致） */
const VARIANTS: { value: GameOptions['variant']; label: string; hint: string }[] = [
  { value: 'ping', label: '平双陆', hint: '常局格制' },
  { value: 'huihui', label: '回回双陆', hint: '出局不问点色，任意出两马' },
  { value: 'sanliang', label: '三梁双陆', hint: '用三骰对彩，马分三处' },
  { value: 'fo', label: '佛双陆', hint: '十二马，不布局' },
  { value: 'xia-zan', label: '下赞双陆', hint: '双采移四马 + 赏一掷' },
  { value: 'da-shi', label: '大食双陆', hint: '三骰，马分七' },
]

/** 根据变体推导属性（简化：完整差异在变体布局中实现，这里先接基础开关） */
function variantOptions(v: GameOptions['variant']): GameOptions {
  switch (v) {
    case 'sanliang':
    case 'da-shi':
      return { variant: v, diceCount: 3 }
    case 'fo':
      return { variant: v, pieceCount: 12 }
    case 'huihui':
      return { variant: v, bearOffTolerance: 'arbitraryTwo' }
    case 'xia-zan':
      return { variant: v, doublesFourMoves: true, doublesBonusRoll: true }
    default:
      return { variant: v ?? 'ping' }
  }
}

const STORAGE_KEY = 'shuanglu.current'

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialState('white'))
  const [history, setHistory] = useState<string[]>([]) // 快照栈（悔棋）
  const [view, setView] = useState<'home' | 'game'>('home') // 主菜单 / 对局
  const [mode, setMode] = useState<'pve' | 'hotseat'>('pve')
  const [playerColor, setPlayerColor] = useState<Player>('white')
  const [variant, setVariant] = useState<GameOptions['variant']>('ping')
  const [aiLevel, setAiLevel] = useState<'random' | 'greedy' | 'advanced'>('advanced')
  const [selected, setSelected] = useState<number | null>(null)
  const [matchScore, setMatchScore] = useState<Record<Player, number>>({ white: 0, black: 0 })
  const [winsToWin, setWinsToWin] = useState(1)
  const [replayMode, setReplayMode] = useState(false)
  const [replayStep, setReplayStep] = useState(0)
  // 互动教学会话：{ lesson, step }；null = 不在教学中
  const [tut, setTut] = useState<{ lesson: number; step: number } | null>(null)
  const [tutSeed, setTutSeed] = useState(0) // 强制重挂（课程切换时重置棋盘）
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TUTORIAL_KEY) !== '1'
    } catch {
      return true
    }
  })
  const [showRules, setShowRules] = useState(false)
  const [rollKey, setRollKey] = useState(0)
  const [soundOn, setSoundOn] = useState(() => !sfx.isMuted())
  const [stats, setStats] = useState<MatchStats>(() => {
    try {
      return loadStats()
    } catch {
      return { total: 0, whiteWins: 0, blackWins: 0, streak: 0 }
    }
  })
  const busyRef = useRef(false)

  // 音效：首次用户交互后解锁 AudioContext
  useEffect(() => {
    const unlock = () => sfx.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const toggleSound = () => {
    const muted = sfx.toggle()
    setSoundOn(!muted)
    if (!muted) sfx.roll()
  }

  // ---- 本地 SEA 服务：自动退出（关闭浏览器）与手动退出 ----
  const [isSea, setIsSea] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetch('/__meta__')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!cancelled && m && m.mode === 'sea') setIsSea(true)
      })
      .catch(() => { /* 非 SEA 环境（如 Pages 线上）忽略 */ })
    return () => {
      cancelled = true
    }
  }, [])

  // 关闭浏览器/标签页 / 刷新 → 通知本地服务自动退出（服务端延迟退出防误杀）
  useEffect(() => {
    if (!isSea) return
    const onPageHide = () => {
      try {
        navigator.sendBeacon('/__shutdown__')
      } catch {
        /* 忽略 */
      }
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [isSea])

  const stopSeaService = () => {
    fetch('/__shutdown__', { method: 'GET' })
      .then(() => flashHint('本地服务将在片刻后退出（可关闭此页面）'))
      .catch(() => flashHint('当前非离线模式，无需退出服务'))
  }

  const handleResetStats = () => {
    setStats(resetStats())
    flashHint('战绩已清零')
  }

  // 热座：双方都是人类（本机轮流，隐藏 AI）；PVE：只有执子方是人类
  const humanTurn = !replayMode && (mode === 'hotseat' ? state.phase !== 'ended' : state.turn === playerColor && state.phase !== 'ended')
  const legal = useMemo(() => legalMoves(state), [state])

  // 自动存档（防刷新丢失）
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: serializeState(state), history }))
    } catch {
      /* localStorage 不可用时忽略 */
    }
  }, [state, history])

  // ---------- 回合驱动（掷骰 / 轮空 / AI），由 busyRef 防止重复调度 ----------
  useEffect(() => {
    if (tut) return // 互动教学中，回合由教学向导控制
    if (busyRef.current) return
    if (replayMode) return

    if (state.phase === 'roll') {
      busyRef.current = true
      const t = setTimeout(() => {
        setState((s) => {
          // 掷骰前将当前态入快照栈
          setHistory((h) => [...h, serializeState(s)])
          const next = rollDice(s, makeDice(s.options.diceCount))
          setRollKey((k) => k + 1)
          sfx.roll()
          return next
        })
        busyRef.current = false
      }, 300)
      return () => {
        clearTimeout(t)
        busyRef.current = false
      }
    }
    if (state.phase === 'ended') return

    // 无合法走子 → 轮空（对本方玩家给出说明）
    if (legal.length === 0) {
      if (humanTurn) {
        flashHint('本点数无法走子，自动跳过（需过门/被卡位/界外马不能入局）')
      }
      busyRef.current = true
      const t = setTimeout(() => {
        setState((s) => {
          setHistory((h) => [...h, serializeState(s)])
          return skipRemaining(s, 'pip')
        })
        busyRef.current = false
      }, 400)
      return () => {
        clearTimeout(t)
        busyRef.current = false
      }
    }

    // AI 回合（仅 PVE：AI 执非玩家方；热座双方皆人类，无 AI）
    if (!humanTurn && mode === 'pve') {
      busyRef.current = true
      const step = chooseMove(state, undefined, aiLevel)
      if (!step) {
        busyRef.current = false
        return
      }
      const t = setTimeout(() => {
        // 走子前快照（AI 也有悔棋权利由玩家主导）
        setState((s) => {
          const next = applyMove(s, step)
          if (next !== s) setHistory((h) => [...h, serializeState(s)])
          return next
        })
        recordMove(step)
        busyRef.current = false
      }, 450)
      return () => {
        clearTimeout(t)
        busyRef.current = false
      }
    }
  }, [state, humanTurn, legal, aiLevel, replayMode, mode, tut])

  // ---------- 终局计筹 + 战绩 ----------
  useEffect(() => {
    if (state.phase === 'ended' && state.winner) {
      sfx.win()
      recordResult(state.winner)
      setStats(loadStats())
      setMatchScore((sc) => ({
        ...sc,
        [state.winner!]: sc[state.winner!] + (state.doubled ? 2 : 1),
      }))
      // 达到目标局数才提示整场结束（这里先简单提示，详见状态栏）
    }
  }, [state.phase, state.winner, state.doubled])

  // ---------- 互动教学 ----------
  // 课程切换/开始：重建课程局面
  useEffect(() => {
    if (tut) {
      setState(createLessonState(getLesson(tut.lesson)))
      setSelected(null)
      setHistory([])
    }
  }, [tut?.lesson, tutSeed])

  // roll 步骤：自动掷骰并推进
  useEffect(() => {
    if (!tut) return
    const lesson = getLesson(tut.lesson)
    const st = lesson.steps[tut.step]
    if (st && st.kind === 'roll') {
      const t = setTimeout(() => {
        setState((s) => {
          setHistory((h) => [...h, serializeState(s)])
          const next = rollDice(s, st.dice)
          setRollKey((k) => k + 1)
          sfx.roll()
          return next
        })
        setTut((cur) => (cur ? { ...cur, step: cur.step + 1 } : cur))
      }, 600)
      return () => clearTimeout(t)
    }
  }, [tut, tutSeed])

  const tutStep = tut ? getLesson(tut.lesson).steps[tut.step] : null

  // 互动教学下一步（'下一课'或结束）
  const tutAdvance = () => {
    setTut((cur) => {
      if (!cur) return cur
      const lesson = getLesson(cur.lesson)
      if (cur.step + 1 < lesson.steps.length) {
        return { ...cur, step: cur.step + 1 }
      }
      if (cur.lesson + 1 < TUT_LESSONS.length) {
        setTutSeed((x) => x + 1)
        return { lesson: cur.lesson + 1, step: 0 }
      }
      return null // 全部完成
    })
    setSelected(null)
  }

  const tutExit = () => {
    setTut(null)
    setSelected(null)
    setState(createInitialState(playerColor, variantOptions(variant)))
  }

  // 教学点击校验
  const handleTutClick = (global: number) => {
    if (!tutStep || !tut) return
    switch (tutStep.kind) {
      case 'pick': {
        if (global === tutStep.from) {
          setSelected(global)
          flashHint('好的，再点黄色目标落点')
          setTut((c) => (c ? { ...c, step: c.step + 1 } : c))
        } else {
          flashHint('请点击橙色脉冲的那匹马（第 ' + tutStep.from + ' 梁）')
        }
        break
      }
      case 'place': {
        if (selected !== null && selected === tutStep.from && global === tutStep.to) {
          pushSnapshot()
          const m = legal.find((mm) => mm.from === tutStep.from && mm.to === tutStep.to)
          if (m) {
            setState((s) => applyMove(s, m))
            setSelected(null)
            setTut((c) => (c ? { ...c, step: c.step + 1 } : c))
          }
        } else if (global === tutStep.from) {
          setSelected(global)
        } else {
          flashHint('请点击黄色闪光的目标落点（第 ' + tutStep.to + ' 梁）')
        }
        break
      }
      case 'enter': {
        if (global === tutStep.to) {
          pushSnapshot()
          const m = legal.find((mm) => mm.from === null && mm.to === tutStep.to)
          if (m) {
            setState((s) => applyMove(s, m))
            setTut((c) => (c ? { ...c, step: c.step + 1 } : c))
          }
        } else {
          flashHint('请点击黄色闪烁的入局落点（第 ' + tutStep.to + ' 梁）')
        }
        break
      }
      case 'bearoff': {
        if (selected === tutStep.from && global === tutStep.from) {
          pushSnapshot()
          const m = legal.find((mm) => mm.bearsOff && mm.from === tutStep.from)
          if (m) {
            setState((s) => applyMove(s, m))
            setSelected(null)
            setTut((c) => (c ? { ...c, step: c.step + 1 } : c))
          }
        } else if (global === tutStep.from) {
          setSelected(global)
        } else {
          flashHint('请先选中第 ' + tutStep.from + ' 梁的马，再点一次拈出')
        }
        break
      }
      default:
        break
    }
  }

  const startInteractive = () => {
    setShowTutorial(false)
    setTutSeed((x) => x + 1)
    setTut({ lesson: 0, step: 0 })
    setReplayMode(false)
  }

  // ---------- 人类点击走子（含反馈提示） ----------
  const pushSnapshot = () => setHistory((h) => [...h, serializeState(state)])
  const [hint, setHint] = useState<string | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashHint = (msg: string) => {
    setHint(msg)
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(null), 2600)
  }

  // 最近一步走子（可视化）：记录最后一次 applyMove 的步与时间戳，2.4s 后自动清除
  const [lastMove, setLastMove] = useState<{ move: Move; ts: number } | null>(null)
  const lastMoveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordMove = (move: Move) => {
    setLastMove({ move, ts: Date.now() })
    if (lastMoveTimer.current) clearTimeout(lastMoveTimer.current)
    lastMoveTimer.current = setTimeout(() => setLastMove(null), 2400)
    // 音效
    if (move.hit) sfx.hit()
    else if (move.bearsOff) sfx.bearOff()
    else if (move.reenters) sfx.reenter()
  }

  const tryApply = (movePath: { from: number | null; to: number | null } | undefined): boolean => {
    if (!movePath) return false
    const move = legal.find(
      (m) => m.from === (movePath.from ?? null) && m.to === (movePath.to ?? null),
    )
    if (!move) return false
    pushSnapshot()
    setState((s) => applyMove(s, move))
    recordMove(move)
    setSelected(null)
    return true
  }

  const onPointClick = (global: number) => {
    if (tut) {
      handleTutClick(global)
      return
    }
    if (!humanTurn) {
      if (state.phase !== 'ended') flashHint(state.turn === playerColor ? '请稍候，正在掷骰…' : '当前不是你的回合（等待对方/AI）')
      return
    }
    // 入局阶段：只有黄色落点可点
    if (state.phase === 'entry') {
      if (tryApply({ from: null, to: global })) return
      flashHint('界外有马需先入局，请点击黄色闪烁的落点')
      return
    }
    // 已选中起点：再次点击同一格 → 拈出；点击某落点 → 走子
    if (selected !== null) {
      if (selected === global) {
        if (tryApply({ from: selected, to: null })) return // 拈出
        flashHint('这匹马不能拈出（需先过门或点数不匹配）')
        return
      }
      if (tryApply({ from: selected, to: global })) return
      // 点到别处：视为切换选择
    }
    // 选择新起点
    if (legal.some((m) => m.from === global)) {
      setSelected(global)
      setHint(null)
      return
    }
    // 点击无可走的格 → 明确反馈
    const hasOppPiece = state.points[global - 1][state.turn === 'white' ? 'black' : 'white'] > 0
    if (hasOppPiece) {
      flashHint('这是对方的马，点击橙色脉冲的己方马开始')
    } else {
      flashHint('这匹马本步不能走——请点击橙色脉冲的己方马')
    }
    setSelected(null)
  }

  // 拖拽：拖源 → 放目标
  const onDragFrom = (global: number) => {
    if (!humanTurn) return
    if (legal.some((m) => m.from === global)) setSelected(global)
  }
  const onDropTo = (global: number) => {
    if (!humanTurn || selected === null) return
    // 先试走棋/入局，再试拈出（拖到自己的源格）
    if (!tryApply({ from: selected, to: global })) {
      if (global === selected) tryApply({ from: selected, to: null })
    }
  }

  // ---------- 控制 ----------
  const startNewGame = () => {
    const next = createInitialState(playerColor, variantOptions(variant))
    setState(next)
    setHistory([])
    setSelected(null)
    setReplayMode(false)
    setReplayStep(0)
  }

  // 主菜单「开始对局」：切到对局视图并开局
  const startFromHome = () => {
    startNewGame()
    setView('game')
  }

  // 返回主菜单（保留当前局面，可从主菜单读档或再进）
  const goHome = () => {
    setView('home')
    setSelected(null)
  }

  const undo = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    const restored = loadState(prev)
    if (!restored) return
    setHistory((h) => h.slice(0, -1))
    setState(restored)
    setSelected(null)
  }

  const saveToFile = () => {
    const blob = new Blob([JSON.stringify({ state: serializeState(state), history, at: Date.now() })], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shuanglu-game-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadFromFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        const s = loadState(data.state)
        if (s) {
          setState(s)
          setHistory(Array.isArray(data.history) ? data.history : [])
          setSelected(null)
          setReplayMode(true)
          setReplayStep(s.moves.length)
        }
      } catch {
        alert('存档解析失败')
      }
    }
    reader.readAsText(file)
  }

  // 复盘视图：快照栈 + 当前态 = 可回放
  const enterReplay = () => {
    setReplayMode(true)
    setReplayStep(history.length)
  }
  const replayTo = (step: number) => {
    const snap = history[step]
    if (snap) setState(loadState(snap)!)
    setReplayStep(step)
  }

  const status = statusText(state, matchScore, winsToWin)

  const closeTutorial = () => {
    setShowTutorial(false)
    try {
      localStorage.setItem(TUTORIAL_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (view === 'home') {
    return (
      <div className="app">
        <HomeScreen
          variant={variant}
          aiLevel={aiLevel}
          mode={mode}
          playerColor={playerColor}
          winsToWin={winsToWin}
          onVariant={setVariant}
          onAiLevel={setAiLevel}
          onMode={setMode}
          onPlayerColor={setPlayerColor}
          onWinsToWin={setWinsToWin}
          onStart={startFromHome}
          onTutorial={startInteractive}
          onRules={() => setShowRules(true)}
          onLoad={() => document.getElementById('load-game-input')?.click()}
          onSave={saveToFile}
          onToggleSound={toggleSound}
          soundOn={soundOn}
          isSea={isSea}
          onStopSea={stopSeaService}
          stats={stats}
          onResetStats={handleResetStats}
        />
        {/* 读档用的隐藏 input，供主菜单调用 */}
        <input
          id="load-game-input"
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && loadFromFile(e.target.files[0])}
        />
        <Tutorial open={showTutorial} onClose={closeTutorial} onStartInteractive={startInteractive} onRules={() => setShowRules(true)} />
        <RulesManual open={showRules} onClose={() => setShowRules(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-row">
          <div>
            <h1>双陆棋 · 打双陆</h1>
            <p>中式打双陆 · 《谱双》规则（v0.3）</p>
          </div>
          <div className="app-header-btns">
            <button className="home-btn" onClick={toggleSound} title={soundOn ? '关闭音效' : '开启音效'}>
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="home-btn" onClick={goHome}>≡ 主菜单</button>
          </div>
        </div>
      </header>

      <div className="controls">
        <div className="mode-picker">
          <label>模式：</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as 'pve' | 'hotseat')}>
            <option value="pve">人机对战（PVE）</option>
            <option value="hotseat">本地双人（热座）</option>
          </select>
        </div>

        {mode === 'pve' && (
          <div className="color-picker">
            <label>执子：</label>
            <button className={playerColor === 'white' ? 'active' : ''} onClick={() => { setPlayerColor('white'); startNewGame() }}>
              白马
            </button>
            <button className={playerColor === 'black' ? 'active' : ''} onClick={() => { setPlayerColor('black'); startNewGame() }}>
              黑马
            </button>
          </div>
        )}

        <div className="variant-picker">
          <label>变体：</label>
          <select value={variant ?? 'ping'} onChange={(e) => setVariant(e.target.value as GameOptions['variant'])}>
            {VARIANTS.map((v) => (
              <option key={v.value} value={v.value}> {v.label} — {v.hint}</option>
            ))}
          </select>
        </div>

        {mode === 'pve' && (
          <div className="ai-picker">
            <label>AI：</label>
            <select value={aiLevel} onChange={(e) => setAiLevel(e.target.value as 'random' | 'greedy' | 'advanced')}>
              <option value="advanced">进阶（前瞻）</option>
              <option value="greedy">启发式</option>
              <option value="random">随机</option>
            </select>
          </div>
        )}

        <div className="wins-picker">
          <label>先胜几局：</label>
          <select value={winsToWin} onChange={(e) => setWinsToWin(Number(e.target.value))}>
            <option value={1}>单局</option>
            <option value={2}>先赢2局</option>
            <option value={3}>先赢3局</option>
            <option value={5}>先赢5局</option>
          </select>
        </div>

        <button onClick={startNewGame}>新的一局</button>
        <button onClick={() => setShowTutorial(true)}>教学</button>
        <button onClick={() => setShowRules(true)}>规则</button>
        <button onClick={undo} disabled={history.length === 0}>悔棋</button>
        <button onClick={enterReplay} disabled={history.length === 0}>复盘</button>
        <button onClick={saveToFile}>存档</button>
        <label className="file-load">
          读档
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && loadFromFile(e.target.files[0])} />
        </label>
      </div>

      {replayMode && (
        <div className="replay-bar">
          <span>复盘模式</span>
          <button onClick={() => replayTo(Math.max(0, replayStep - 1))}>◀ 上一手</button>
          <span>{replayStep}/{history.length}</span>
          <button onClick={() => replayTo(Math.min(history.length, replayStep + 1))}>下一手 ▶</button>
          <button onClick={() => { setReplayMode(false); setReplayStep(0); }}>退出复盘</button>
        </div>
      )}

      <div className="status-bar">
        <div className="dice">
          <Dice dice={state.dice} rollKey={rollKey} doubles={state.isDoubles} bonusPending={state.bonusRollPending} />
        </div>
        <div className="status-text">{status}</div>
      </div>

      {hint && <div className="hint-bar">{hint}</div>}

      {lastMove && !replayMode && (
        <div className="move-bar">
          <span>
            {lastMove.move.player === 'white' ? '白马' : '黑马'}
            {' '}
            {lastMove.move.from === null
              ? `入局 → 第 ${lastMove.move.to} 梁`
              : lastMove.move.to === null
                ? `第 ${lastMove.move.from} 梁 拈出离盘`
                : `${lastMove.move.from} → ${lastMove.move.to}${lastMove.move.hit ? '（打马）' : ''}`}
          </span>
          {quoteForMove(lastMove.move.hit, lastMove.move.bearsOff, lastMove.move.reenters) && (
            <span className="move-quote font-serif">
              「{quoteForMove(lastMove.move.hit, lastMove.move.bearsOff, lastMove.move.reenters)}」
            </span>
          )}
        </div>
      )}

      {tut && tutStep && (
        <div className="tut-panel">
          <div className="tut-panel-head">
            <span className="tut-title">互动教学 · {getLesson(tut.lesson).title}</span>
            <button className="tut-exit" onClick={tutExit}>退出教学</button>
          </div>
          <p className="tut-text">{tutStep.text}</p>
          {tutStep.kind === 'note' && (
            <button className="tut-next" onClick={tutAdvance}>
              {tutStep.done ? '完成教学，开始游戏 →' : '继续 →'}
            </button>
          )}
        </div>
      )}

      <Board
        state={state}
        legal={humanTurn && !replayMode ? legal : []}
        selected={selected}
        onPointClick={onPointClick}
        onDragFrom={onDragFrom}
        onDropTo={onDropTo}
        lastMove={replayMode ? null : lastMove?.move ?? null}
        tutFrom={tutStep && (tutStep.kind === 'pick' || tutStep.kind === 'place' || tutStep.kind === 'bearoff') ? tutStep.from : undefined}
        tutTo={tutStep && (tutStep.kind === 'place' || tutStep.kind === 'enter') ? tutStep.to : undefined}
      />

      <div className="off-info">
        <span>界外：白 {state.off.white} / 黑 {state.off.black}</span>
        <span>离盘：白 {state.borneOff.white} / 黑 {state.borneOff.black}</span>
        <span className="score">比分：白 {matchScore.white} − {matchScore.black} 黑</span>
      </div>

      <Tutorial open={showTutorial} onClose={closeTutorial} onStartInteractive={startInteractive} onRules={() => setShowRules(true)} />
      <RulesManual open={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}

function statusText(state: GameState, score: Record<Player, number>, winsToWin: number): string {
  if (state.phase === 'ended') {
    const winnerLabel = state.winner === 'white' ? '白马' : '黑马'
    return `对局结束 —— ${winnerLabel}获胜${state.doubled ? '（双筹）' : ''}！比分 ${score.white}:${score.black}（先胜 ${winsToWin} 局）`
  }
  const turnLabel = state.turn === 'white' ? '白马' : '黑马'
  const phaseLabel =
    state.phase === 'entry' ? '　入局（界外马需先复进）' :
    state.phase === 'bearing' ? '　过门·拈出（点选可拈出格再点一次离盘）' : ''
  return `轮到 ${turnLabel}${phaseLabel}`
}