import { useEffect, useMemo, useState } from 'react'
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
} from './game'

function makeDice(count: 2 | 3 = 2): Die[] {
  const d = (): Die => (1 + Math.floor(Math.random() * 6)) as Die
  return Array.from({ length: count }, () => d())
}

/** 变体展示名（与 src/game/types.ts 的 variant 一致） */
const VARIANTS: { value: GameOptions['variant']; label: string; hint: string }[] = [
  { value: 'ping', label: '平双陆', hint: '常局格制 · 16 版默认' },
  { value: 'huihui', label: '回回双陆', hint: '出局不问点色，任意出两马' },
  { value: 'sanliang', label: '三梁双陆', hint: '用三骰对彩，马分三处' },
  { value: 'fo', label: '佛双陆', hint: '十二马，不布局' },
  { value: 'xia-zan', label: '下赞双陆', hint: '双采移四马 + 赏一掷' },
  { value: 'da-shi', label: '大食双陆', hint: '三骰，马分七' },
]

/** 根据变体推导属性（简化：完整差异在 M3+ 变体布局中实现，这里先接基础开关） */
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

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialState('white'))
  const [playerColor, setPlayerColor] = useState<Player>('white')
  const [variant, setVariant] = useState<GameOptions['variant']>('ping')
  const [aiLevel, setAiLevel] = useState<'random' | 'greedy'>('greedy')
  const [selected, setSelected] = useState<number | null>(null)

  const humanTurn = state.turn === playerColor && state.phase !== 'ended'
  const legal = useMemo(() => legalMoves(state), [state])

  // ---- 回合驱动：掷骰 / 轮空 / AI ----
  useEffect(() => {
    // 任意方在 roll 阶段自动掷骰
    if (state.phase === 'roll') {
      const t = setTimeout(() => {
        setState((s) => rollDice(s, makeDice(s.options.diceCount)))
      }, 300)
      return () => clearTimeout(t)
    }
    if (state.phase === 'ended') return

    // 无合法走子 → 自动跳过当前采数（轮空），避免卡死
    if (legal.length === 0) {
      const t = setTimeout(() => {
        setState((s) => skipRemaining(s, 'pip'))
      }, 400)
      return () => clearTimeout(t)
    }

    // AI 回合：选择走子
    if (!humanTurn) {
      const step = chooseMove(state, undefined, aiLevel)
      if (!step) return
      const t = setTimeout(() => {
        setState((s) => applyMove(s, step))
      }, 450)
      return () => clearTimeout(t)
    }
  }, [state, humanTurn, legal, aiLevel])

  // ---- 人类点击走子 ----
  const onPointClick = (global: number) => {
    if (!humanTurn) return
    // 入局阶段：直接点合法落点
    if (state.phase === 'entry') {
      const entry = legal.find((m) => m.from === null && m.to === global)
      if (entry) {
        setState((s) => applyMove(s, entry))
        setSelected(null)
      }
      return
    }

    // 拈出/普通阶段：
    // 1) 已选中某格，再次点击该格且其可拈出 → 拈出
    if (selected !== null && selected === global) {
      const bearOff = legal.find((m) => m.bearsOff && m.from === global)
      if (bearOff) {
        setState((s) => applyMove(s, bearOff))
        setSelected(null)
        return
      }
    }
    // 2) 已选中起点，点击合法目标 → 走子
    if (selected !== null) {
      const move = legal.find((m) => m.from === selected && m.to === global)
      if (move) {
        setState((s) => applyMove(s, move))
        setSelected(null)
        return
      }
    }
    // 3) 选择新的起点（存在以其为源的走法，含可拈出）
    const hasFrom = legal.some((m) => m.from === global)
    if (hasFrom) {
      setSelected(global)
    } else {
      setSelected(null)
    }
  }

  const startNewGame = () => {
    setSelected(null)
    setState(createInitialState(playerColor, variantOptions(variant)))
  }

  const status = statusText(state)

  return (
    <div className="app">
      <header className="app-header">
        <h1>双陆棋 · 打双陆</h1>
        <p>中式打双陆 · 《谱双》规则（v0.3）</p>
      </header>

      <div className="controls">
        <div className="color-picker">
          <label>执子：</label>
          <button className={playerColor === 'white' ? 'active' : ''} onClick={() => { setPlayerColor('white'); startNewGame() }}>
            白马
          </button>
          <button className={playerColor === 'black' ? 'active' : ''} onClick={() => { setPlayerColor('black'); startNewGame() }}>
            黑马
          </button>
        </div>

        <div className="variant-picker">
          <label>变体：</label>
          <select
            value={variant ?? 'ping'}
            onChange={(e) => setVariant(e.target.value as GameOptions['variant'])}
          >
            {VARIANTS.map((v) => (
              <option key={v.value} value={v.value}> {v.label} — {v.hint}</option>
            ))}
          </select>
        </div>

        <div className="ai-picker">
          <label>AI：</label>
          <select value={aiLevel} onChange={(e) => setAiLevel(e.target.value as 'random' | 'greedy')}>
            <option value="greedy">启发式</option>
            <option value="random">随机</option>
          </select>
        </div>

        <button onClick={startNewGame}>新的一局</button>
      </div>

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
        legal={humanTurn ? legal : []}
        selected={selected}
        onPointClick={onPointClick}
      />

      <div className="off-info">
        <span>界外：白 {state.off.white} / 黑 {state.off.black}</span>
        <span>离盘：白 {state.borneOff.white} / 黑 {state.borneOff.black}</span>
      </div>
    </div>
  )
}

function statusText(state: GameState): string {
  if (state.phase === 'ended') {
    const winnerLabel = state.winner === 'white' ? '白马' : '黑马'
    return `对局结束 —— ${winnerLabel}获胜${state.doubled ? '（双筹）' : ''}！`
  }
  const turnLabel = state.turn === 'white' ? '白马' : '黑马'
  const phaseLabel =
    state.phase === 'entry' ? '　入局（界外马需先复进）' :
    state.phase === 'bearing' ? '　过门·拈出（点选可拈出格再点一次离盘）' : ''
  return `轮到 ${turnLabel}${phaseLabel}`
}