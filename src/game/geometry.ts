// ============================================================================
// 双陆棋（中式打双陆）· 坐标与几何工具
// ============================================================================

import type { Player } from './types'

/**
 * 每个玩家有一套 1..24 的坐标（沿自身行马方向编号）：
 *  - 坐标 1..6   = 己方内盘（叠梁/家）：入局落点 & 拈出区；"元入局处"
 *  - 坐标 24     = 己方最远点
 *  - 行马方向     = 坐标从大到小（24 → 1），朝己方家（坐标小）前进
 *  - 全局物理梁   = 共享 24 格，白黑各自坐标映射到同一物理格
 *
 * 《谱双》："白马自右归左，黑马自左归右"，两方相向而行、白黑相偶。
 * 因此采用全局索引映射：白方 coord c → 物理格 c；黑方 coord c → 物理格 25 - c。
 */

/** 玩家坐标 → 全局物理格（1..24） */
export function coordToGlobal(player: Player, coord: number): number {
  return player === 'white' ? coord : 25 - coord
}

/** 全局物理格（1..24） → 玩家坐标 */
export function globalToCoord(player: Player, global: number): number {
  return player === 'white' ? global : 25 - global
}

/** 某玩家的"内盘/家"坐标集合（1..6），即入局落点与拈出区 */
export function homeCoords(): number[] {
  return [1, 2, 3, 4, 5, 6]
}

/** 某个玩家坐标是否为内盘区 */
export function isHomeCoord(coord: number): boolean {
  return coord >= 1 && coord <= 6
}

/** 玩家坐标是否位于棋盘上（1..24，不含界外/离盘） */
export function isOnBoard(coord: number): boolean {
  return coord >= 1 && coord <= 24
}
