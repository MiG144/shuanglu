import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Board } from './components/Board'
import type { Die, GameOptions, GameState, Player } from './game'
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
  const [mode, setMode] = useState<'pve' | 'hotseat'>('pve')
  const [playerColor, setPlayerColor] = useState<Player>('white')
  const [variant, setVariant] = useState<GameOptions['variant']>('ping')
  const [aiLevel, setAiLevel] = useState<'random' | 'greedy'>('greedy')
  const [selected, setSelected] = useState<number | null>(null)
  const [matchScore, setMatchScore] = useState<Record<Player, number>>({ white: 0, black: 0 })
  const [winsToWin, setWinsToWin] = useState(1)
  const [replayMode, setReplayMode] = useState(false)
  const [replayStep, setReplayStep] = useState(0)
  const busyRef = useRef(false)

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
    if (busyRef.current) return
    if (replayMode) return

    if (state.phase === 'roll') {
      busyRef.current = true
      const t = setTimeout(() => {
        setState((s) => {
          // 掷骰前将当前态入快照栈
          setHistory((h) => [...h, serializeState(s)])
          return rollDice(s, makeDice(s.options.diceCount))
        })
        busyRef.current = false
      }, 300)
      return () => {
        clearTimeout(t)
        busyRef.current = false
      }
    }
    if (state.phase === 'ended') return

    // 无合法走子 → 轮空
    if (legal.length === 0) {
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
        busyRef.current = false
      }, 450)
      return () => {
        clearTimeout(t)
        busyRef.current = false
      }
    }
  }, [state, humanTurn, legal, aiLevel, replayMode, mode])

  // ---------- 终局计筹 ----------
  useEffect(() => {
    if (state.phase === 'ended' && state.winner) {
      setMatchScore((sc) => ({
        ...sc,
        [state.winner!]: sc[state.winner!] + (state.doubled ? 2 : 1),
      }))
      // 达到目标局数才提示整场结束（这里先简单提示，详见状态栏）
    }
  }, [state.phase, state.winner, state.doubled])

  // ---------- 人类点击走子 ----------
  const pushSnapshot = () => setHistory((h) => [...h, serializeState(state)])

  const onPointClick = (global: number) => {
    if (!humanTurn) return
    if (state.phase === 'entry') {
      const entry = legal.find((m) => m.from === null && m.to === global)
      if (entry) {
        pushSnapshot()
        setState((s) => applyMove(s, entry))
        setSelected(null)
      }
      return
    }
    if (selected !== null && selected === global) {
      const bearOff = legal.find((m) => m.bearsOff && m.from === global)
      if (bearOff) {
        pushSnapshot()
        setState((s) => applyMove(s, bearOff))
        setSelected(null)
        return
      }
    }
    if (selected !== null) {
      const move = legal.find((m) => m.from === selected && m.to === global)
      if (move) {
        pushSnapshot()
        setState((s) => applyMove(s, move))
        setSelected(null)
        return
      }
    }
    const hasFrom = legal.some((m) => m.from === global)
    if (hasFrom) {
      setSelected(global)
    } else {
      setSelected(null)
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>双陆棋 · 打双陆</h1>
        <p>中式打双陆 · 《谱双》规则（v0.3）</p>
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
            <select value={aiLevel} onChange={(e) => setAiLevel(e.target.value as 'random' | 'greedy')}>
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
          {state.dice ? state.dice.join(' · ') : '掷骰中…'}
          {state.isDoubles && <em>（双采）</em>}
          {state.bonusRollPending && <em>（赏一掷）</em>}
        </div>
        <div className="status-text">{status}</div>
      </div>

      <Board
        state={state}
        legal={humanTurn && !replayMode ? legal : []}
        selected={selected}
        onPointClick={onPointClick}
      />

      <div className="off-info">
        <span>界外：白 {state.off.white} / 黑 {state.off.black}</span>
        <span>离盘：白 {state.borneOff.white} / 黑 {state.borneOff.black}</span>
        <span className="score">比分：白 {matchScore.white} − {matchScore.black} 黑</span>
      </div>
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