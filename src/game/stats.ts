// ============================================================================
// 双陆棋 · 战绩统计（localStorage 持久化）
// 记录：总局数 / 白方胜 / 黑方胜 / 平局（无）/ 当前连胜（按执子记录）
// ============================================================================

export interface MatchStats {
  total: number
  whiteWins: number
  blackWins: number
  /** 连续胜利次数（记录最后胜方视角；0 表示上一局非该方胜） */
  streak: number
  /** 连胜的执子方（white/black），用于展示 */
  streakPlayer?: 'white' | 'black'
}

const KEY = 'shuanglu.stats'

const EMPTY: MatchStats = { total: 0, whiteWins: 0, blackWins: 0, streak: 0 }

export function loadStats(): MatchStats {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const p = JSON.parse(raw) as Partial<MatchStats>
    return {
      total: typeof p.total === 'number' ? p.total : 0,
      whiteWins: typeof p.whiteWins === 'number' ? p.whiteWins : 0,
      blackWins: typeof p.blackWins === 'number' ? p.blackWins : 0,
      streak: typeof p.streak === 'number' ? p.streak : 0,
      streakPlayer: p.streakPlayer,
    }
  } catch {
    return { ...EMPTY }
  }
}

export function saveStats(s: MatchStats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* localStorage 不可用时忽略 */
  }
}

/** 终局后记录一局结果（winner：白/黑） */
export function recordResult(winner: 'white' | 'black'): MatchStats {
  const s = loadStats()
  s.total += 1
  if (winner === 'white') s.whiteWins += 1
  else s.blackWins += 1
  // 连胜：与上一局胜方相同则 +1，否则重置
  if (s.streakPlayer === winner) {
    s.streak += 1
  } else {
    s.streak = 1
    s.streakPlayer = winner
  }
  saveStats(s)
  return s
}

export function resetStats(): MatchStats {
  saveStats({ ...EMPTY })
  return { ...EMPTY }
}

/** 胜率（0-100，保留 1 位小数；无对局返回 0） */
export function winRate(s: MatchStats, player: 'white' | 'black'): number {
  if (s.total === 0) return 0
  const wins = player === 'white' ? s.whiteWins : s.blackWins
  return Math.round((wins / s.total) * 1000) / 10
}