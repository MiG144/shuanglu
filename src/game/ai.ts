// ============================================================================
// 双陆棋（中式打双陆）· 走子 AI
// 只负责在给定状态/剩余骰步下选择走子；骰子由游戏内公平随机统一掷出。
//
// 强度：B 级增强 ——
//   1) 静态局面评估（pip 距离差 / 暴露单立惩罚 / 成梁奖励 / 拈出进度）
//   2) 前瞻：对"本回合剩余采数序列"逐步行棋做模拟，取整回合最优路径
//      （比单步贪心更好地照顾双采多步、打马后再走等情形）
// ============================================================================

import type { GameState, Move, GameOptions } from './types'
import { legalMoves, applyMove } from './engine'
import { globalToCoord } from './geometry'

export type AiLevel = 'random' | 'greedy' | 'advanced'

// ----------------------------------------------------------------------------
// 局面评估（对 mover 视角）
// ----------------------------------------------------------------------------

/** 某玩家全部马到"家门"的总 pip 距离（越小越好；界外按 +25 计，已拈出不计） */
function pipDistance(state: GameState, player: Move['player']): number {
  let sum = 0
  for (let g = 1; g <= 24; g++) {
    const n = state.points[g - 1][player]
    if (n > 0) {
      const coord = globalToCoord(player, g)
      sum += n * coord // 坐标即剩余步数（1=家内，24=最远）
    }
  }
  sum += state.off[player] * 25 // 界外马需先入局，代价大
  return sum
}

/** 暴露的单立马数（可被敌打；防守弱点） */
function blotCount(state: GameState, player: Move['player']): number {
  let count = 0
  for (let g = 1; g <= 24; g++) {
    if (state.points[g - 1][player] === 1) count++
  }
  return count
}

/** 成梁数（≥2 同梁，防守好） */
function madePoints(state: GameState, player: Move['player']): number {
  let count = 0
  for (let g = 1; g <= 24; g++) {
    if (state.points[g - 1][player] >= 2) count++
  }
  return count
}

/**
 * 对 mover 局面的启发式评分（越大越好）。
 * 权重：赛跑（pip 差）为主，兼顾防守（blot/成梁）与拈出进度。
 */
export function evaluate(state: GameState, mover: Move['player']): number {
  const opp = mover === 'white' ? 'black' : 'white'
  const myPip = pipDistance(state, mover)
  const oppPip = pipDistance(state, opp)

  let score = 0
  score += (oppPip - myPip) * 0.30 // 领先差
  score -= blotCount(state, mover) * 8.0 // 暴露单立是重大弱点
  score += madePoints(state, mover) * 2.0
  score += state.borneOff[mover] * 30.0 // 离盘进度
  score += state.off[mover] * 0 // 界外惩罚已含在 pip 中
  // 接近家门（进内盘）奖励：坐标小则好
  return score
}

// ----------------------------------------------------------------------------
// 前瞻：对剩余采数序列做整回合模拟
// ----------------------------------------------------------------------------

/**
 * 深度受限贪心前瞻：对状态 s（轮到 mover，有剩余采数序列 pips）返回
 * 本回合能取得的最优评分（沿合法步行棋，逐骰评估，直至 pips 用完）。
 * 用"取当前骰数上 eval 最高的步"并推进，衡量本回合潜力。
 */
function simulateTurn(state: GameState, mover: Move['player'], pips: number[], depth = 0): number {
  if (pips.length === 0) return evaluate(state, mover)
  if (depth > 12) return evaluate(state, mover) // 防双采长链爆栈

  const pip = pips[0]
  const moves = legalMoves({ ...state, remainingPips: [pip] } as GameState)
  if (moves.length === 0) {
    // 无可走：跳过该骰，继续下一骰
    return simulateTurn(state, mover, pips.slice(1), depth + 1)
  }
  // 枚举本骰每个合法步，取能带来最高后续评分的走法
  let best = -Infinity
  for (const m of moves) {
    const next = applyMove({ ...state, remainingPips: [pip] } as GameState, m)
    const rest = next.remainingPips
    const val = simulateTurn(next, mover, rest.length ? rest : [], depth + 1)
    if (val > best) best = val
  }
  return best
}

/** 为某状态计算"本回合最佳走法"（基于前瞻评分），返回第一步 Move */
function chooseBestMove(state: GameState, mover: Move['player']): Move | null {
  const moves = legalMoves(state)
  if (moves.length === 0) return null

  let bestMove: Move | null = null
  let bestVal = -Infinity
  for (const m of moves) {
    const next = applyMove(state, m)
    const rest = next.remainingPips
    const val = simulateTurn(next, mover, rest.length ? rest : [], 0)
    if (val > bestVal) {
      bestVal = val
      bestMove = m
    }
  }
  return bestMove
}

// ----------------------------------------------------------------------------
// 入口
// ----------------------------------------------------------------------------

export function chooseMove(state: GameState, opts?: GameOptions, level: AiLevel = 'advanced'): Move | null {
  const moves = legalMoves(state, opts)
  if (moves.length === 0) return null

  if (level === 'random') {
    return moves[Math.floor(Math.random() * moves.length)]
  }

  if (level === 'advanced') {
    return chooseBestMove(state, state.turn)
  }

  // greedy（保留）：单步贪心
  let best: Move = moves[0]
  let bestScore = -Infinity
  for (const m of moves) {
    const next = applyMove(state, m)
    const sc = evaluate(next, state.turn) + heuristicBonus(m)
    if (sc > bestScore) {
      bestScore = sc
      best = m
    }
  }
  return best
}

/** 小启发加成：同等局面下优先打马/拈出/入局 */
function heuristicBonus(m: Move): number {
  let b = 0
  if (m.hit) b += 20
  if (m.bearsOff) b += 15
  if (m.reenters) b += 12
  return b
}

export { evaluate as evaluatePosition }