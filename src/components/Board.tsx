import './Board.css'
import type { GameState, Move } from '../game'

interface BoardProps {
  state: GameState
  legal: Move[]
  selected?: number | null
  onPointClick?: (global: number) => void
  onDragFrom?: (global: number) => void
  onDropTo?: (global: number) => void
  /** 互动教学：强引导点（期望点击的源/目标），高亮并添加点击指示光标 */
  tutFrom?: number
  tutTo?: number
  /** 最近一步走子（可视化：源/目标短暂高亮） */
  lastMove?: Move | null
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
export function Board({ state, legal, selected, onPointClick, onDragFrom, onDropTo, tutFrom, tutTo, lastMove }: BoardProps) {
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

  // 最近一步走子的高亮格
  const lmFrom = lastMove ? lastMove.from : null
  const lmTo = lastMove ? lastMove.to : null

  const renderPoint = (g: number) => {
    const white = state.points[g - 1].white
    const black = state.points[g - 1].black
    const isMovable = movableSet.has(g)
    const isTarget = isMoveTarget(g) || isEntryTarget(g)
    const isLm = g === lmFrom || g === lmTo
    // 上排（top）尖朝下，下排（bottom）尖朝上；用方向类区分三角朝向与堆叠方向
    const isTop = top.includes(g)
    const cls = [
      'point',
      isTop ? 'point-top' : 'point-bottom',
      selected === g ? 'selected' : '',
      isMovable ? 'movable' : '',
      isTarget ? 'target' : '',
      isBearOffSource(g) ? 'bearoff' : '',
      g === tutFrom || g === tutTo ? 'tut-guide' : '',
      isLm ? 'last-move' : '',
    ].filter(Boolean).join(' ')
    const tutLabel = g === tutFrom ? '（点击这里）' : g === tutTo ? '（目标位置）' : ''
    // 酒瓶/捣衣椎形棋子（《谱双》"上径小、下径大、底平、束腰"）：
    // 窄颈 → 鼓腹 → 平底
    const Bottle = ({ color }: { color: 'white' | 'black' }) => (
      <span className={`piece bottle ${color}`} aria-hidden="true">
        <svg viewBox="0 0 20 28" width="20" height="28" className="bottle-shape">
          {/* 瓶身：上颈窄 (8→9) 鼓腹 (15) 平底收窄 */}
          <path
            d="M8.2 2 C8 8 5.6 11 4.6 15 C3.6 19.4 5 24 7.6 26.6 L12.4 26.6 C15 24 16.4 19.4 15.4 15 C14.4 11 12 8 11.8 2 Z"
            className={`bottle-body ${color}`}
          />
          {/* 瓶口圆环 */}
          <ellipse cx="10" cy="2" rx="2.6" ry="1.1" className={`bottle-rim ${color}`} />
        </svg>
      </span>
    )
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
        title={`梁 ${g}（白${white} / 黑${black}）${tutLabel}`}
      >
        {tutLabel && <span className="tut-badge">👆 {tutLabel}</span>}
        {isLm && (
          <span className="lm-badge">{g === lmTo ? '→ 落点' : '← 起点'}</span>
        )}
        <span className="count">{white + black}</span>
        <div className="stack">
          {Array.from({ length: white }).map((_, i) => (
            <Bottle key={`w${i}`} color="white" />
          ))}
          {Array.from({ length: black }).map((_, i) => (
            <Bottle key={`b${i}`} color="black" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="board">
      <div className="gate-row">
        <span className="gate-mark font-serif">梁頭（起点）</span>
        <span className="gate-mark font-serif">— 门 —</span>
        <span className="gate-mark font-serif">梁末（终点）</span>
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
        {top.map(renderPoint)}
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
        {bottom.map(renderPoint)}
      </div>
      <div className="gate-row">
        <span className="gate-mark font-serif">梁頭（起点）</span>
        <span className="gate-mark font-serif">— 门 —</span>
        <span className="gate-mark font-serif">梁末（终点）</span>
      </div>
    </div>
  )
}