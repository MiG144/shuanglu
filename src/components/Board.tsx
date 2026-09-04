import './Board.css'
import type { GameState, Move } from '../game'

interface BoardProps {
  state: GameState
  legal: Move[]
  selected?: number | null
  onPointClick?: (global: number) => void
  onDragFrom?: (global: number) => void
  onDropTo?: (global: number) => void
}

/**
 * 双陆棋盘：展示 24 梁，白黑双方的马。
 * 布局按 12 列 U 型（上下各 12 梁），中间为门标。
 *
 * 交互反馈（让玩家一眼知道"点什么"）：
 *   - movable（该格有可走动的己方马，可选中起点）：橙色脉冲
 *   - target（可选落点：走棋目标 / 入局落点）：黄色闪光
 *   - bearoff（可拈出源格）：绿色
 *   - selected（已选中起点）：白色粗框
 *   - 支持点击（点源→点目标）与 HTML5 拖拽（拖源→放目标）两种方式
 */
export function Board({ state, legal, selected, onPointClick, onDragFrom, onDropTo }: BoardProps) {
  // 近端（下排）用白方视角编号 1..12，远端（上排）13..24（示意）
  const bottom = Array.from({ length: 12 }, (_, i) => i + 1) // 1..12
  const top = Array.from({ length: 12 }, (_, i) => 24 - i)   // 24..13

  // 可走动的源格（含拈出源）：有合法走法从该格出发
  const movableSet = new Set(
    legal.filter((m) => m.from !== null).map((m) => m.from!),
  )
  const isEntryTarget = (g: number) => legal.some((m) => m.from === null && m.to === g)
  const isBearOffSource = (g: number) => legal.some((m) => m.bearsOff && m.from === g)
  // 已选中起点后的目标落点（对应当前 selected 的走法）
  const isMoveTarget = (g: number) =>
    selected !== null && legal.some((m) => m.from === selected && m.to === g)

  const renderPoint = (g: number) => {
    const white = state.points[g - 1].white
    const black = state.points[g - 1].black
    const isMovable = movableSet.has(g)
    const isTarget = isMoveTarget(g) || isEntryTarget(g)
    const cls = [
      'point',
      selected === g ? 'selected' : '',
      isMovable ? 'movable' : '',
      isTarget ? 'target' : '',
      isBearOffSource(g) ? 'bearoff' : '',
    ].filter(Boolean).join(' ')
    return (
      <div
        key={g}
        className={cls}
        onClick={() => onPointClick?.(g)}
        onDragStart={(e) => {
          // 仅允许从"可走动的源格"拖起
          if (!isMovable) e.preventDefault()
          else {
            e.dataTransfer.setData('text/plain', String(g))
            e.dataTransfer.effectAllowed = 'move'
            onDragFrom?.(g)
          }
        }}
        onDragOver={(e) => {
          if (isTarget || isBearOffSource(g)) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (isTarget || isBearOffSource(g)) onDropTo?.(g)
        }}
        draggable={isMovable}
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