// ============================================================================
// 双陆棋（中式打双陆）· 规则引擎（纯逻辑，可测试、可序列化）
// 依据《谱双》规则定稿 v0.3（《欣赏编》本全书核对）
//
// 引擎输入/输出均使用【全局物理格 1..24】。玩家坐标换算见 geometry.ts。
// ============================================================================

import type { Die, GameOptions, GameState, Move, Player, PointState } from './types'
import { coordToGlobal, globalToCoord, isHomeCoord } from './geometry'

const DEFAULT_OPTIONS: Required<GameOptions> = {
  maxStack: 6,
  doublesFourMoves: true,
  doublesBonusRoll: false,
  entryCanHit: true,
  bearOffTolerance: 'standard',
  diceCount: 2,
  pieceCount: 15,
  variant: 'ping',
}

export const NUM_POINTS = 24
export const NUM_PIECES = 15

/** 全局物理格 1..24 → 数组索引 0..23 */
function idx(globalPoint: number): number {
  return globalPoint - 1
}

function emptyPoints(): PointState[] {
  return Array.from({ length: NUM_POINTS }, () => ({ white: 0, black: 0 }))
}

function clonePoints(points: PointState[]): PointState[] {
  return points.map((p) => ({ white: p.white, black: p.black }))
}

function other(p: Player): Player {
  return p === 'white' ? 'black' : 'white'
}

/**
 * 开局摆位（《谱双·常局格制》+《欣赏编》本 p410 卷二北双陆开局图印证）。
 *
 * 文字原文（卷五·常局格制）：
 *   "右前六梁、左後一梁，各布五馬；右後六梁，二馬；左前二梁，三馬。白黑相偶。"
 * 即每方 15 马按 **5 / 5 / 2 / 3** 四组分布，白黑相偶（镜像）。
 *
 * 开局图（《欣赏编》本 p410）可辨认的标注有：梁頭（起点端）、梁末（终点端）、
 * 前六梁、后梁、右/左方向标，以及"白白白白白/黑黑黑黑黑"（5 马堆）、
 * "白白白/黑黑黑"（3 马堆）、"黑黑"（2 马堆）等马堆 —— 与文字规则互证。
 *
 * 方位词 → 统一编号的映射（呈现层约定，不改规则；白方坐标，黑方镜像）：
 *   右前六梁（起点侧前段）  -> coord 23 : 5 马
 *   左后一梁（家门侧后段）  -> coord 18 : 5 马
 *   右后六梁（家门侧前段）  -> coord 12 : 2 马
 *   左前二梁（起点侧后段）  -> coord 6  : 3 马
 * 注：原文为方位词、图无编号，此映射取对称均衡值；若日后按图精确落位，
 *     仅需改 WHITE_POS 常量，不影响引擎规则。
 * pieceCount=12（佛双陆"各用十二馬"）按 4/4/2/2 同理分布。
 */
export function initialPositionPoints(pieceCount: 12 | 15 = 15): PointState[] {
  const pts = emptyPoints()

  // 白方（coord → 全局 = coord）集群；黑方为镜像（全局 g -> 25-g）
  const WHITE_POS: { coord: number; n: number }[] =
    pieceCount === 12
      ? [
          { coord: 23, n: 4 },
          { coord: 18, n: 4 },
          { coord: 12, n: 2 },
          { coord: 6, n: 2 },
        ]
      : [
          { coord: 23, n: 5 },
          { coord: 18, n: 5 },
          { coord: 12, n: 2 },
          { coord: 6, n: 3 },
        ]

  for (const { coord, n } of WHITE_POS) {
    const g = coordToGlobal('white', coord)
    pts[idx(g)].white = n
  }
  // 黑方镜像（白黑相偶）
  for (const { coord, n } of WHITE_POS) {
    const gW = coordToGlobal('white', coord)
    const gB = 25 - gW
    pts[idx(gB)].black = n
  }

  return pts
}

export function createInitialState(player: Player = 'white', opts?: GameOptions): GameState {
  const options = resolveOptions(opts)
  const points = initialPositionPoints(options.pieceCount)
  return {
    points,
    off: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    turn: player,
    dice: null,
    isDoubles: false,
    phase: 'roll',
    remainingPips: [],
    bonusRollPending: false,
    winner: null,
    doubled: false,
    moves: [],
    options,
  }
}

export function resolveOptions(opts?: GameOptions): Required<GameOptions> {
  return { ...DEFAULT_OPTIONS, ...opts }
}

// ----------------------------------------------------------------------------
// 判定辅助
// ----------------------------------------------------------------------------

/** 某玩家是否全部马都已在己方内盘（可进入拈出阶段） */
export function allInHome(state: GameState, player: Player): boolean {
  if (state.off[player] > 0) return false
  for (let g = 1; g <= NUM_POINTS; g++) {
    const count = state.points[idx(g)][player]
    if (count > 0) {
      if (!isHomeCoord(globalToCoord(player, g))) return false
    }
  }
  return true
}

/** 某一全局物理格是否被敌方"卡位"（两枚及以上敌马占据） */
function isBlockedFor(state: GameState, global: number, mover: Player): boolean {
  const opp = other(mover)
  return state.points[idx(global)][opp] >= 2
}

/** 目标格上敌马数量（单立 → 可打；>=2 → 卡位） */
function oppCount(state: GameState, global: number, mover: Player): number {
  return state.points[idx(global)][other(mover)]
}

/** 该步是否构成打马（目标格恰好一枚敌马） */
function makesHit(state: GameState, global: number, mover: Player): boolean {
  return oppCount(state, global, mover) === 1
}

/** 落子后是否会超过单梁上限 */
function wouldExceedStack(state: GameState, global: number, mover: Player, maxStack: number): boolean {
  return state.points[idx(global)][mover] + 1 > maxStack
}

// ----------------------------------------------------------------------------
// 走子合法集合（针对"当前回合剩余采数中的首个采数"）
// ----------------------------------------------------------------------------

/**
 * 求当前回合、剩余采数序列中【第一个采数】对应的合法单步走法集合。
 * 采数语义：
 *   - 阶段 move/bearing：用采数 pick 使一马在其坐标上减少 pick（朝家门前进）。
 *   - 阶段 entry：从界外复进，落在坐标 = pick 的梁（"与采相当始得下"）。
 * 配置默认取自 state.options（创建时固化）；显式 opts 仅作覆盖。
 */
export function legalMoves(state: GameState, opts?: GameOptions): Move[] {
  const options = { ...state.options, ...opts }
  if (state.phase === 'ended' || state.phase === 'roll') return []
  if (state.remainingPips.length === 0) return []
  const pip = state.remainingPips[0]
  const mover = state.turn

  if (state.phase === 'entry') {
    return entryMoves(state, mover, pip, options)
  }
  if (state.phase === 'bearing') {
    return bearingMoves(state, mover, pip, options.maxStack, options.bearOffTolerance)
  }
  return moveMoves(state, mover, pip, options.maxStack)
}

/** 单步走法是否合法（M1：applyMove 前校验用） */
export function isLegalMove(state: GameState, move: Move, opts?: GameOptions): boolean {
  return legalMoves(state, opts).some(
    (m) =>
      m.from === move.from &&
      m.to === move.to &&
      m.pip === move.pip &&
      (m.hit ?? false) === (move.hit ?? false),
  )
}

/** 正常行棋：把某马往家门方向前进 pip 格（坐标减小），落点合法。 */
export function moveMoves(state: GameState, mover: Player, pip: number, maxStack = 6): Move[] {
  const result: Move[] = []

  // 枚举所有已在棋盘上的己方马
  for (let g = 1; g <= NUM_POINTS; g++) {
    const c = state.points[idx(g)][mover]
    if (c <= 0) continue
    const coord = globalToCoord(mover, g)
    const targetCoord = coord - pip
    if (targetCoord < 1) continue // 不可退到界外（拈出阶段才可）

    const targetGlobal = coordToGlobal(mover, targetCoord)
    if (isBlockedFor(state, targetGlobal, mover)) continue
    if (wouldExceedStack(state, targetGlobal, mover, maxStack)) continue

    const hit = makesHit(state, targetGlobal, mover)
    result.push({
      player: mover,
      from: g,
      to: targetGlobal,
      pip,
      hit,
      bearsOff: false,
    })
  }
  return result
}

/** 入局（复进）：从界外按采数落子。落点坐标 = pick；须未卡位。 */
export function entryMoves(state: GameState, mover: Player, pip: number, options: Required<GameOptions>): Move[] {
  if (state.off[mover] <= 0) return []
  if (pip < 1 || pip > 6) return []

  const targetGlobal = coordToGlobal(mover, pip)
  if (isBlockedFor(state, targetGlobal, mover)) return []
  if (wouldExceedStack(state, targetGlobal, mover, options.maxStack)) return []

  const hit = options.entryCanHit && makesHit(state, targetGlobal, mover)
  return [
    {
      player: mover,
      from: null,
      to: targetGlobal,
      pip,
      hit,
      bearsOff: false,
      reenters: true,
    },
  ]
}

/** 拈出（离盘）：仅在"全部过门"后。tolerance='arbitraryTwo'（回回双陆）则不問點色任意出。 */
export function bearingMoves(
  state: GameState,
  mover: Player,
  pip: number,
  maxStack = 6,
  tolerance: 'standard' | 'arbitraryTwo' = 'standard',
): Move[] {
  const result: Move[] = []

  // 内盘内的常规行棋（整理马位）
  result.push(...moveMoves(state, mover, pip, maxStack))

  // 拈出：standard 按采数（可拈出的马须位于坐标 <= pip）；
  // arbitraryTwo（回回双陆"出局时不问点色多少，任意出两马"）→ 池内任意马均可拈出。
  for (let g = 1; g <= NUM_POINTS; g++) {
    const c = state.points[idx(g)][mover]
    if (c <= 0) continue
    const coord = globalToCoord(mover, g)
    if (tolerance === 'arbitraryTwo' || coord <= pip) {
      result.push({
        player: mover,
        from: g,
        to: null,
        pip,
        hit: false,
        bearsOff: true,
      })
    }
  }

  return dedupe(result)
}

function dedupe(moves: Move[]): Move[] {
  const seen = new Set<string>()
  const out: Move[] = []
  for (const m of moves) {
    const key = `${m.from ?? 'x'}->${m.to ?? 'x'}:${m.pip}:${m.bearsOff ? 'B' : ''}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(m)
    }
  }
  return out
}

// ----------------------------------------------------------------------------
// 应用走子（单步）
// ----------------------------------------------------------------------------

/**
 * 应用单步走子，更新状态、段位（phase）、切换回合、判定终局。
 * 返回应用后的新状态（不变异入参）。
 * 在应用前做合法性校验（isLegalMove），非法即抛错。
 */
export function applyMove(state: GameState, move: Move): GameState {
  if (!isLegalMove(state, move)) {
    throw new Error(`非法走子被拒绝：from=${move.from} to=${move.to} pip=${move.pip}`)
  }
  const next: GameState = {
    ...state,
    points: clonePoints(state.points),
    off: { ...state.off },
    borneOff: { ...state.borneOff },
    remainingPips: [...state.remainingPips],
    moves: [...state.moves],
  }

  const mover = move.player
  const movingCount = 1

  // 1) 取走源点
  if (move.from !== null) {
    const gi = idx(move.from)
    next.points[gi][mover] -= movingCount
    if (next.points[gi][mover] < 0) throw new Error(`非法走子：${move.from} 无马`)
  } else {
    // 入局：从界外取
    if (next.off[mover] < movingCount) throw new Error('非法入局：界外无马')
    next.off[mover] -= movingCount
  }

  // 2) 处理落点
  if (move.to !== null) {
    if (move.hit) {
      // 打马：该格恰有一枚敌马，将其击下盘
      const opp = other(mover)
      const oppOnTarget = next.points[idx(move.to)][opp]
      if (oppOnTarget !== 1) throw new Error('非法打马：目标格敌马数不为 1')
      next.points[idx(move.to)][opp] = 0
      next.off[opp] += 1
    }
    next.points[idx(move.to)][mover] += movingCount
  } else {
    // 拈出：离盘
    next.borneOff[mover] += movingCount
  }

  // 3) 消耗当前采数
  next.remainingPips.shift()
  next.moves.push({ ...move })

  // 4) 终局判定
  if (next.borneOff[mover] >= NUM_PIECES) {
    next.winner = mover
    next.doubled = computeDoubled(next, mover)
    next.phase = 'ended'
    return next
  }

  // 5) 段位推进
  if (next.remainingPips.length === 0) {
    // 本回合已无剩余采数：
    //  - 若双采赏一掷待处理（且对局未结束），保持本回合、要求上层再掷一次
    //  - 否则回合结束 → 交给对方
    if (next.bonusRollPending && next.phase !== 'ended') {
      next.dice = null
      next.isDoubles = false
      next.bonusRollPending = false
      next.phase = 'roll'
      // 注意：不切换 turn —— 赏一掷由同一位玩家再掷
      return next
    }
    next.turn = other(mover)
    next.dice = null
    next.isDoubles = false
    next.phase = 'roll'
  } else {
    // 仍在同一回合，但需依据"是否仍有界外马"决定是否能继续用盘上马
    if (next.off[mover] > 0) {
      next.phase = 'entry'
    } else if (next.phase !== 'bearing') {
      // 若该方此时全部过门，则切换到拈出
      next.phase = allInHome(next, mover) ? 'bearing' : 'move'
    }
  }

  return next
}

/** 计算是否"双筹" */
export function computeDoubled(state: GameState, winner: Player): boolean {
  const loser = other(winner)
  // "而他马未归梁，或归梁而无马出局，则胜双筹"
  // 即输家尚未全部过门，或已过门但还未拈出任何马
  const loserAllInHome = allInHome(state, loser)
  if (!loserAllInHome) return true
  if (state.borneOff[loser] === 0) return true
  return false
}

/**
 * 无合法走子时推进（M1）：丢弃当前首个采数（"能走则走，无则跳过该步"）。
 * - 若仍剩采数，仅丢弃一个并推进段位；
 * - 若为整回合计（mode='turn'），丢弃全部剩余采数并切换回合。
 * 入局被卡位挡住、拈出点数过高等场景走此路径，保证对局不卡死。
 */
export function skipRemaining(state: GameState, mode: 'pip' | 'turn' = 'pip'): GameState {
  const next: GameState = {
    ...state,
    points: clonePoints(state.points),
    off: { ...state.off },
    borneOff: { ...state.borneOff },
    remainingPips: [...state.remainingPips],
    moves: [...state.moves],
  }

  if (mode === 'turn') {
    next.remainingPips = []
  } else {
    next.remainingPips.shift()
  }

  if (next.remainingPips.length === 0) {
    // 本回合结束
    if (next.bonusRollPending) {
      next.dice = null
      next.isDoubles = false
      next.bonusRollPending = false
      next.phase = 'roll'
      return next
    }
    next.turn = other(next.turn)
    next.dice = null
    next.isDoubles = false
    next.phase = 'roll'
  } else {
    // 仍有采数未用
    if (next.off[next.turn] > 0) {
      next.phase = 'entry'
    } else if (next.phase !== 'bearing') {
      next.phase = allInHome(next, next.turn) ? 'bearing' : 'move'
    }
  }
  return next
}

// ----------------------------------------------------------------------------
// 掷骰
// ----------------------------------------------------------------------------

/** 掷骰，设置本回合采数与段位。生产用法应传入随机骰子；此处暴露纯函数便于测试。 */
export function rollDice(state: GameState, dice: Die[], opts?: GameOptions): GameState {
  // 配置默认取自 state.options（创建时固化）；显式 opts 仅作覆盖（不得用默认值覆盖已固化配置）
  const options = opts ? { ...state.options, ...opts } : state.options
  const ds = dice.length >= options.diceCount ? dice.slice(0, options.diceCount) : dice
  const isDoubles = ds.length > 1 && ds.every((d) => d === ds[0])
  const next: GameState = {
    ...state,
    points: clonePoints(state.points),
    off: { ...state.off },
    borneOff: { ...state.borneOff },
    remainingPips: [...state.remainingPips],
    moves: [...state.moves],
  }
  next.dice = [...ds]
  next.isDoubles = isDoubles

  // 采数序列：
  //  - 双采且 doublesFourMoves → 4 个同点（《谱双》"併移四馬"；三骰时亦按全等四步兜底）
  //  - 否则按各骰点数
  if (isDoubles && options.doublesFourMoves) {
    next.remainingPips = [ds[0], ds[0], ds[0], ds[0]]
  } else {
    next.remainingPips = [...ds]
  }

  // 双采赏一掷（下赞/大食系"又賞一擲"）：标记由上层在本回合 pips 用尽后触发再掷
  next.bonusRollPending = isDoubles && options.doublesBonusRoll

  // 确定段位：优先入局；否则过门则拈出；否则正常行棋
  if (next.off[next.turn] > 0) {
    next.phase = 'entry'
  } else if (allInHome(next, next.turn)) {
    next.phase = 'bearing'
  } else {
    next.phase = 'move'
  }
  return next
}

/**
 * 便捷：对当前状态，能否在"当前剩余采数"上无任何合法走子（轮空前兆）。
 * 引擎主动跳过由 skipRemaining 负责；上层（UI/AI）据此提示"无可走之步"。
 */
export function hasAnyLegalMove(state: GameState, opts?: GameOptions): boolean {
  return legalMoves(state, opts).length > 0
}

// ----------------------------------------------------------------------------
// 序列化（M3：存局 / 同步 / 快照）
// ----------------------------------------------------------------------------

/** 序列化对局状态为 JSON 字符串（纯数据：points/off/borneOff/…全量） */
export function serializeState(state: GameState): string {
  return JSON.stringify(state)
}

/** 反序列化（校验基本形状；非法返回 null） */
export function loadState(json: string): GameState | null {
  try {
    const parsed = JSON.parse(json) as Partial<GameState>
    if (!parsed || !Array.isArray(parsed.points) || parsed.points.length !== NUM_POINTS) return null
    if (!parsed.off || !parsed.borneOff || !parsed.turn) return null
    return parsed as GameState
  } catch {
    return null
  }
}
