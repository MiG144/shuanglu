// ============================================================================
// 双陆棋（中式打双陆）· 类型定义
// 依据《谱双》规则定稿 v0.3（《欣赏编》本全书核对）
// ============================================================================

/** 行棋方 */
export type Player = 'white' | 'black'

/** 对局阶段 */
export type Phase =
  | 'roll' // 回合开始，等待掷骰
  | 'move' // 正常行棋
  | 'entry' // 界外马入局（被击马未复进前，盘上马不得走）
  | 'bearing' // 全部过门后，拈出（离盘）
  | 'ended' // 终局

/** 一枚骰子的采数（1–6） */
export type Die = 1 | 2 | 3 | 4 | 5 | 6

/**
 * 一次单步行棋。坐标一律为【全局物理格 1..24】。
 * - from：源于物理格；入局（复进）时为 null
 * - to  ：目标物理格；离盘（拈出）时为 null
 * 所有移动都换算到全局物理格，便于 UI 渲染与复现。
 */
export interface Move {
  player: Player
  /** 全局物理格 1..24；入局则 null */
  from: number | null
  /** 全局物理格 1..24；拈出（离盘）则 null */
  to: number | null
  /** 该步使用的采数 */
  pip: number
  /** 是否是一次"打马"（目标单立敌马被击落） */
  hit?: boolean
  /** 是否离盘（拈出） */
  bearsOff?: boolean
  /** 是否入局（复进） */
  reenters?: boolean
}

/** 某一全局物理格的白/黑马数快照 */
export interface PointState {
  white: number
  black: number
}

/** 完整对局状态（纯逻辑、可序列化） */
export interface GameState {
  /** 24 个全局物理格的白/黑马数，索引 0..23 对应物理格 1..24 */
  points: PointState[]
  /** 界外（被打下、待入局）的马数 */
  off: Record<Player, number>
  /** 已拈出（离盘）的马数 */
  borneOff: Record<Player, number>
  /** 当前行棋方 */
  turn: Player
  /** 本回合采数（长度 = options.diceCount，通常 2；三梁/大食为 3）；null 表示尚未掷骰 */
  dice: Die[] | null
  /** 是否双采（全部骰同点） */
  isDoubles: boolean
  phase: Phase
  /** 本回合剩余待用的采数序列（首位为下一步应使用的采数） */
  remainingPips: number[]
  /** 双采赏一掷待处理（下赞/大食系"又賞一擲"）：本回合 pips 用尽后由上层触发再掷一次 */
  bonusRollPending: boolean
  winner: Player | null
  /** 是否双筹（对手未归梁，或归梁而未拈出任何马） */
  doubled: boolean
  moves: Move[]
  /** 本局规则配置快照（创建时固化；legalMoves/chooseMove 默认从此处读取） */
  options: Required<GameOptions>
  /** 多局计筹（M3）：累计分（1 筹 / 双筹 2 筹）。单局制时可选 */
  score?: Record<Player, number>
  /** 对局标识（M3 存局/复盘用） */
  id?: string
}

/** 规则引擎选项 */
export interface GameOptions {
  /** 单物理梁马数上限（《谱双·南北局例》："两道相比為梁一道，不得過六馬"），默认 6 */
  maxStack?: number
  /** 双采是否按该点走 4 步（卷三下赞/大食"併移四馬"），默认 true */
  doublesFourMoves?: boolean
  /** 双采赏一掷（下赞/大食系"又賞一擲"），默认 false */
  doublesBonusRoll?: boolean
  /** 入局（复进）是否可击中单立敌马（默认 true，同西洋双陆惯例） */
  entryCanHit?: boolean
  /** 拈出方式：'standard' 按采数拈出（常局/平双陆）；'arbitraryTwo' 出局不問點色、任意出兩馬（回回双陆） */
  bearOffTolerance?: 'standard' | 'arbitraryTwo'
  /** 骰子数：2（常局/平/罗嬴等）；3（三梁/大食"以三骰子對彩"），默认 2 */
  diceCount?: 2 | 3
  /** 每方马数：15（常局/平…）；12（佛双陆"各用十二馬"），默认 15 */
  pieceCount?: 12 | 15
  /** 玩法变体（v0.3），默认 'ping'（平双陆＝常局格制） */
  variant?:
    | 'ping'
    | 'da-jian'
    | 'huihui'
    | 'qiliang'
    | 'sanliang'
    | 'luoying'
    | 'xia-zan'
    | 'bu-da'
    | 'fo'
    | 'san-dui'
    | 'si-jia-ba'
    | 'nan-pi'
    | 'da-shi'
    | 'japan'
}
