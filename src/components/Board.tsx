import './Board.css'
import type { GameState, Move, Player } from '../game'

interface BoardProps {
  state: GameState
  legal: Move[]
  selected?: number | null
  onPointClick?: (global: number) => void
  onDragFrom?: (global: number) => void
  onDropTo?: (global: number) => void
  /** 互动教学：强引导点（期望点击的源/目标），高亮 */
  tutFrom?: number
  tutTo?: number
  /** 最近一步走子（可视化：源/目标短暂高亮） */
  lastMove?: Move | null
  /** 多局系列比分（显示在中间信息带） */
  score?: Record<Player, number>
}

/**
 * 双陆棋盘：仿《谱双》古盘——上下两条边带各 12 个圆坑（梁）+ 两枚月牙门，
 * 中间为青绿色三框格信息带，双方马分置于上下两条马列中。
 *
 * 布局（自上而下）：
 *   顶边带（12 圆坑 + 月牙门）→ 顶马列（马向下堆）→ 中间信息带 → 底马列（马向上堆）→ 底边带
 *
 * 交互反馈：
 *   - movable（可走动的己方马）：金圈
 *   - target（可选落点：走棋/入局）：黄圈脉动
 *   - bearoff（可拈出源格）：绿圈
 *   - selected（已选中起点）：白粗圈
 *   - 支持点击（点源→点目标）与 HTML5 拖拽（拖源→放目标）
 */
export function Board({ state, legal, selected, onPointClick, onDragFrom, onDropTo, tutFrom, tutTo, lastMove, score }: BoardProps) {
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
    // 红酒瓶式棋子（《谱双》"上径小、下径大、底平、束腰"）：
    // 直身圆柱（略收颈）→ 圆肩 → 细颈 → 平顶，无顶端圆球
    const Bottle = ({ color }: { color: 'white' | 'black' }) => (
      <span className={`piece bottle ${color}`} aria-hidden="true">
        <svg viewBox="0 0 24 40" width="24" height="40" className="bottle-shape">
          <path
            d="M4.6 38 L19.4 38 C20 38 20.4 37.6 20.4 37 L20.4 22 C20.4 15 15 14.6 15 9.6 L15 6.6 C15 5.6 14.3 4.8 13.2 4.8 L10.8 4.8 C9.7 4.8 9 5.6 9 6.6 L9 9.6 C9 14.6 3.6 15 3.6 22 L3.6 37 C3.6 37.6 4 38 4.6 38 Z"
            className={`bottle-body ${color}`}
          />
        </svg>
      </span>
    )
    return (
      <div
        key={g}
        className={cls}
        onClick={() => onPointClick?.(g)}
        onDragStart={(e) => {
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
        {/* 圆坑标记（边带·视觉标记，不与棋子重合）：金色小圆 + 马数 */}
        <span className="pit">
          <span className="count">{white + black}</span>
        </span>
        {/* 马列：棋子堆叠（放大、略微拉长、少量重叠） */}
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

  // 中间信息带内容（仅在空间充足时保留核心项）
  const turnLabel = state.turn === 'white' ? '白马' : '黑马'
  const sc = score ?? state.score

  return (
    <div className="board">
      {/* 顶马列：马向下堆 */}
      <div className="play-row top">{top.map(renderPoint)}</div>

      {/* 中间青绿色三框格信息带 */}
      <div className="middle-band">
        <div className="mid-cell">
          <span className="mid-tag">梁頭（起点）</span>
          <span className="mid-val">界外 白 {state.off.white} · 黑 {state.off.black}</span>
        </div>
        <div className="mid-cell mid-main">
          <span className="mid-tag">轮到 {turnLabel}</span>
          {sc && (
            <span className="mid-val">比分 白 {sc.white} − {sc.black} 黑</span>
          )}
        </div>
        <div className="mid-cell">
          <span className="mid-tag">梁末（终点）</span>
          <span className="mid-val">离盘 白 {state.borneOff.white} · 黑 {state.borneOff.black}</span>
        </div>
      </div>

      {/* 底马列：马向上堆 */}
      <div className="play-row bottom">{bottom.map(renderPoint)}</div>

      {/* 月牙门：上下两条长边正中央各一枚（上开口朝上、下开口朝下），弯月体、尖角分明 */}
      <svg className="crescent cres-top" viewBox="0 0 140 60" width="196" height="78" aria-hidden="true">
        <path d="M43 14 A 44 44 0 0 1 97 14 A 40 40 0 0 0 43 14 Z" />
      </svg>
      <svg className="crescent cres-bottom" viewBox="0 0 140 60" width="196" height="78" aria-hidden="true">
        <path d="M43 46 A 44 44 0 0 0 97 46 A 40 40 0 0 1 43 46 Z" />
      </svg>
    </div>
  )
}
