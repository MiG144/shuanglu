// ============================================================================
// 双陆棋（中式打双陆）· 简单走子 AI
// 只负责在给定状态下选择一个合法走子；骰子由游戏内公平随机统一掷出。
// ============================================================================

import type { GameState, Move, GameOptions } from './types'
import { legalMoves } from './engine'

export type AiLevel = 'random' | 'greedy'

function isSafe(state: GameState, move: Move, mover: Move['player']): boolean {
  // 判断目标格是否安全（不会被单立马被击）：
  // 目标格要么已有≥2 己方马（成梁），要么落子后应再留 1 枚成梁。简化为：目标格落子后己方马数 >= 2 为安全。
  if (move.to === null) return true
  const count = state.points[move.to - 1][mover]
  return count + 1 >= 2
}

function score(state: GameState, move: Move, mover: Move['player']): number {
  let s = 0
  // 1) 打马最高优先级
  if (move.hit) s += 1000
  // 2) 拈出（离盘）
  if (move.bearsOff) s += 400
  // 3) 入局
  if (move.reenters) s += 300
  // 4) 落到安全点（成梁）
  if (isSafe(state, move, mover)) s += 50
  // 5) 前进得越远越好（朝家门），坐标越小越接近家
  if (move.to !== null) {
    s += (24 - scoreOfCoord(move, mover)) * 2
  }
  return s
}

// 简单近似：目标位置的"己方坐标"越小越接近家，分数越高
function scoreOfCoord(move: Move, mover: Move['player']): number {
  // 从全局物理格推己方坐标。为保持 engine 解耦，这里做浅层启发：
  // 目标格在环路上愈晚（序号大）对白方愈等价于"更远离"，但双方方向不同。
  // 实用做法：以接近"己方家（内盘坐标1-6）"的程度打分。
  if (move.to === null) return 0
  // 把 to 全局格换算回 mover 坐标（与 engine 相同的映射）
  // white: coord = global ; black: coord = 25 - global
  const coord = mover === 'white' ? move.to : 25 - move.to
  return coord
}

export function chooseMove(state: GameState, opts?: GameOptions, level: AiLevel = 'greedy'): Move | null {
  // opts 缺省时 legalMoves 自动读取 state.options（创建时固化的配置）
  const moves = legalMoves(state, opts)
  if (moves.length === 0) return null
  if (level === 'random') {
    return moves[Math.floor(Math.random() * moves.length)]
  }
  // greedy：取分数最高者
  let best: Move = moves[0]
  let bestScore = -Infinity
  for (const m of moves) {
    const sc = score(state, m, state.turn)
    if (sc > bestScore) {
      bestScore = sc
      best = m
    }
  }
  return best
}
