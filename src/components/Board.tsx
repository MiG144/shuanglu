import './Board.css'
import type { GameState, Move } from '../game'

interface BoardProps {
  state: GameState
  legal: Move[]
  selected?: number | null
  onPointClick?: (global: number) => void
}

/**
 * 双陆棋盘：展示 24 梁，白黑双方的马。
 * 布局按 12 列 u 型（上下各 12 梁），中间为门标。
 * 注意：这里用"一字排开"的简化布局（每方各 12 梁分列上下），
 * 具体几何以最终 UI 稿为准；核心是 24 梁 + 门。
 */
export function Board({ state, legal, selected, onPointClick }: BoardProps) {
  // 近端（下排）用白方视角编号 1..12，远端（上排）13..24（示意）
  const bottom = Array.from({ length: 12 }, (_, i) => i + 1) // 1..12
  const top = Array.from({ length: 12 }, (_, i) => 24 - i)   // 24..13

  const isLegalTarget = (g: number) => legal.some((m) => m.to === g || (m.to === null && m.from === g))

  const renderPoint = (g: number) => {
    const white = state.points[g - 1].white
    const black = state.points[g - 1].black
    const legalHere = isLegalTarget(g)
    return (
      <div
        key={g}
        className={`point ${legalHere ? 'legal' : ''} ${selected === g ? 'selected' : ''}`}
        onClick={() => onPointClick?.(g)}
        title={`梁 ${g}（白${white} / 黑${black}）`}
      >
        <span className="count">{white + black}</span>
        <div className="stack">
          {Array.from({ length: white }).map((_, i) => (
            <span key={`w${i}`} className="piece white" />
          ))}
          {Array.from({ length: black }).map((_, i) => (
            <span key={`b${i}`} className="piece black" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="board">
      <div className="gate-row">
        <span className="gate-mark">— 门 —</span>
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
        {top.map(renderPoint)}
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
        {bottom.map(renderPoint)}
      </div>
      <div className="gate-row">
        <span className="gate-mark">— 门 —</span>
      </div>
    </div>
  )
}
