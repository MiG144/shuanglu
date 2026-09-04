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
        {/* 圆坑标记（边带·视觉标记，不与棋子重合） */}
        <span className="pit" />
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

  // 中间信息带（扁平简条，无嵌套框）：当前方 + 比分 + 界外/离盘
  const turnLabel = state.turn === 'white' ? '白马' : '黑马'
  const sc = score ?? state.score
  const offW = state.off.white
  const offB = state.off.black
  const borneW = state.borneOff.white
  const borneB = state.borneOff.black

  const half = 6

  return (
    <div className="board">
      {/* 顶马列：马向下堆，中央月牙门（两脚贴顶边、开口朝下）分割两侧 */}
      <div className="play-row top">
        <div className="point-group">{top.slice(0, half).map(renderPoint)}</div>
        <div className="gate">
          <svg viewBox="0 0 120 64" preserveAspectRatio="none" aria-hidden="true">
            <path className="gate-moon" d="M18 1 C 32 38, 88 38, 102 1 C 88 25, 32 25, 18 1 Z" />
          </svg>
        </div>
        <div className="point-group">{top.slice(half).map(renderPoint)}</div>
      </div>

      {/* 中间青绿色扁平信息带（细竖线分隔，无子框） */}
      <div className="middle-band">
        <span className="mid-item">
          <span className="mid-tag">轮到</span>
          <b className="mid-val">{turnLabel}</b>
        </span>
        <span className="mid-item">
          <span className="mid-tag">比分</span>
          <b className="mid-val">白 {sc ? sc.white : 0} − {sc ? sc.black : 0} 黑</b>
        </span>
        <span className="mid-item">
          <span className="mid-tag">界外</span>
          <b className="mid-val">白 {offW} · 黑 {offB}</b>
          <span className="mid-tag">离盘</span>
          <b className="mid-val">白 {borneW} · 黑 {borneB}</b>
        </span>
      </div>

      {/* 底马列：马向上堆，中央月牙门（两脚贴底边、开口朝上）分割两侧 */}
      <div className="play-row bottom">
        <div className="point-group">{bottom.slice(0, half).map(renderPoint)}</div>
        <div className="gate">
          <svg viewBox="0 0 120 64" preserveAspectRatio="none" aria-hidden="true">
            <path className="gate-moon" d="M18 63 C 32 26, 88 26, 102 63 C 88 39, 32 39, 18 63 Z" />
          </svg>
        </div>
        <div className="point-group">{bottom.slice(half).map(renderPoint)}</div>
      </div>
    </div>
  )
}
