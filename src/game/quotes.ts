// ============================================================================
// 双陆棋 · 《谱双》原文映射（古籍浮签用）
// 对局事件 → 原文引文（思源宋体展示）。
// ============================================================================

export const RULE_QUOTES: Record<string, string> = {
  roll: '以采行馬',
  hit: '凡馬單立，則敵馬可擊',
  entry: '所打者未下，則它馬不得行',
  bearOff: '凡馬盡過門後，方許對彩拈出',
  doubles: '雙彩，併移四馬',
  win: '馬先出盡為勝',
}

/** 最近一步走子的浮签原文（无则空串） */
export function quoteForMove(hit?: boolean, bearsOff?: boolean, reenters?: boolean): string {
  if (hit) return RULE_QUOTES.hit
  if (bearsOff) return RULE_QUOTES.bearOff
  if (reenters) return RULE_QUOTES.entry
  return ''
}