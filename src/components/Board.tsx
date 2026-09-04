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
 * 布局按 12 列 U 型（上下各 12 梁），中间为门标。
 * - 梁頭（起点端）在左、梁末（终点端）在右，门标居中（视觉层标注）。
 * - 走法高亮：
 *   - entry 阶段：高亮入局落点（from === null 的 to）
 *   - bearing 阶段：高亮可拈出的源格（to === null 的 from）
 *   - 普通：高亮合法目标（to）
 */
export function Board({ state, legal, selected, onPointClick }: BoardProps) {
  // 近端（下排）用白方视角编号 1..12，远端（上排）13..24（示意）
  const bottom = Array.from({ length: 12 }, (_, i) => i + 1) // 1..12
  const top = Array.from({ length: 12 }, (_, i) => 24 - i)   // 24..13

  const isEntryTarget = (g: number) => legal.some((m) => m.from === null && m.to === g)
  const isBearOffSource = (g: number) => legal.some((m) => m.bearsOff && m.from === g)
  const isMoveTarget = (g: number) => legal.some((m) => m.from !== null && m.to === g)

  const renderPoint = (g: number) => {
    const white = state.points[g - 1].white
    const black = state.points[g - 1].black
    const cls = [
      'point',
      isEntryTarget(g) || isMoveTarget(g) ? 'legal' : '',
      isBearOffSource(g) ? 'bearoff' : '',
      selected === g ? 'selected' : '',
    ].filter(Boolean).join(' ')
    return (
      <div
        key={g}
        className={cls}
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
        <span className="gate-mark">梁頭（起点）</span>
        <span className="gate-mark">— 门 —</span>
        <span className="gate-mark">梁末（终点）</span>
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
        {top.map(renderPoint)}
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
        {bottom.map(renderPoint)}
      </div>
      <div className="gate-row">
        <span className="gate-mark">梁頭（起点）</span>
        <span className="gate-mark">— 门 —</span>
        <span className="gate-mark">梁末（终点）</span>
      </div>
    </div>
  )
}