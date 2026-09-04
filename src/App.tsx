import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { Board } from './components/Board'
import type { GameState, Player } from './game'
import {
  createInitialState,
  rollDice,
  legalMoves,
  applyMove,
  chooseMove,
} from './game'
import type { Die } from './game'

function makeDice(count: 2 | 3 = 2): Die[] {
  const d = (): Die => (1 + Math.floor(Math.random() * 6)) as Die
  return Array.from({ length: count }, () => d())
}

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialState('white'))
  const [playerColor, setPlayerColor] = useState<Player>('white')
  const [selected, setSelected] = useState<number | null>(null)

  const humanTurn = state.turn === playerColor && state.phase !== 'ended'
  const legal = useMemo(() => legalMoves(state), [state])

  // 人类回合自动掷骰
  useEffect(() => {
    if (!humanTurn) return
    if (state.phase === 'roll') {
      setState((s) => rollDice(s, makeDice()))
    }
  }, [state.phase, humanTurn])

  // AI 回合
  useEffect(() => {
    if (humanTurn) return
    if (state.phase === 'ended') return
    if (state.phase === 'roll') {
      setState((s) => rollDice(s, makeDice()))
      return
    }
    // AI 走子：每次应用一“步”（消耗一个采数）
    const step = chooseMove(state)
    if (!step) return
    const t = setTimeout(() => {
      setState((s) => applyMove(s, step))
    }, 350)
    return () => clearTimeout(t)
  }, [state, humanTurn])

  // 走子（人类点击）：如果选中了一个起点，再点合法终点 → 应用
  const onPointClick = (global: number) => {
    if (!humanTurn) return
    // 若已选起点且该点为合法目标 → 应用
    if (selected !== null) {
      const move = legal.find((m) => m.from === selected && m.to === global)
      if (move) {
        setState((s) => applyMove(s, move))
        setSelected(null)
        return
      }
    }
    // 否则：检查是否有以该点为“源”的走法（仅展示，不自动）
    const hasFrom = legal.some((m) => m.from === global)
    if (hasFrom) {
      setSelected(global)
    } else {
      setSelected(null)
    }
  }

  const reset = () => {
    setSelected(null)
    setState(createInitialState(playerColor))
  }

  const status = statusText(state)

  return (
    <div className="app">
      <header className="app-header">
        <h1>双陆棋 · 打双陆</h1>
        <p>中式打双陆 · 《谱双》规则</p>
      </header>

      <div className="controls">
        <div className="color-picker">
          <label>执子：</label>
          <button className={playerColor === 'white' ? 'active' : ''} onClick={() => { setPlayerColor('white'); reset() }}>
            白马
          </button>
          <button className={playerColor === 'black' ? 'active' : ''} onClick={() => { setPlayerColor('black'); reset() }}>
            黑马
          </button>
        </div>
        <button onClick={reset}>新的一局</button>
      </div>

      <div className="status-bar">
        <div className="dice">
          {state.dice ? state.dice.join(' · ') : '掷骰中…'}
          {state.isDoubles && <em>（双采）</em>}
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
    state.phase === 'bearing' ? '　过门·拈出' : ''
  return `轮到 ${turnLabel}${phaseLabel}`
}
