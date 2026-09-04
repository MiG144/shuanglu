import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  rollDice,
  legalMoves,
  isLegalMove,
  skipRemaining,
  applyMove,
  initialPositionPoints,
  serializeState,
  loadState,
} from '../src/game'
import type { GameState } from '../src/game'

/** 便捷：构造一个 state，且可手工覆写 points/off 用于定向测试 */
function blankState(): GameState {
  return createInitialState('white')
}

/** 让白方仅在某 coord（白方坐标=全局）放置 n 马，其余清空 */
function setWhite(points: { white: number; black: number }[], coord: number, n: number) {
  points[coord - 1].white = n
}

describe('初始摆位（T3）', () => {
  it('双方各 15 马，白黑对称相偶', () => {
    const pts = initialPositionPoints()
    let w = 0
    let b = 0
    for (const p of pts) {
      w += p.white
      b += p.black
    }
    expect(w).toBe(15)
    expect(b).toBe(15)
    // 白黑相偶：全局格 g 与 25-g 互为镜像
    for (let g = 1; g <= 24; g++) {
      expect(pts[g - 1].white).toBe(pts[25 - g - 1].black)
    }
  })

  it('每方 15 马按 5/5/2/3 四组分布（《谱双·常局格制》）', () => {
    const pts = initialPositionPoints()
    const whiteGroups = pts
      .map((p) => p.white)
      .filter((n) => n > 0)
      .sort((a, b) => b - a)
    expect(whiteGroups).toEqual([5, 5, 3, 2])
    const blackGroups = pts
      .map((p) => p.black)
      .filter((n) => n > 0)
      .sort((a, b) => b - a)
    expect(blackGroups).toEqual([5, 5, 3, 2])
  })
})

describe('掷骰与阶段', () => {
  it('非双采 → 两个采数，阶段为 move', () => {
    let s = blankState()
    s = rollDice(s, [4, 2])
    expect(s.dice).toEqual([4, 2])
    expect(s.isDoubles).toBe(false)
    expect(s.remainingPips).toEqual([4, 2])
    expect(s.phase).toBe('move')
  })

  it('双采且 doublesFourMoves → 四个采数', () => {
    let s = blankState()
    s = rollDice(s, [3, 3])
    expect(s.isDoubles).toBe(true)
    expect(s.remainingPips).toEqual([3, 3, 3, 3])
  })
})

describe('打马', () => {
  it('单立敌马可被打落', () => {
    // 白 vs 黑：白在全局 18 放 1 白马，黑在 18-4=14 放 1 黑马，白掷 8 不行（>6）.
    // 用 pip=4：白从全局 18（白 coord 18）前进 4 → 白 coord 14 → 全局 14。
    // 黑在全局 14 单立马。验证 hit。
    const s0 = createInitialState('white')
    const s = { ...s0, points: JSON.parse(JSON.stringify(s0.points)) } as GameState
    // 清空
    for (const p of s.points) {
      p.white = 0
      p.black = 0
    }
    setWhite(s.points, 18, 1) // 白 coord 18 → 全局 18
    s.points[14 - 1].black = 1 // 全局 14 黑单立马

    let rs = rollDice(s, [4, 1])
    const moves = legalMoves(rs)
    const hitMove = moves.find((m) => m.hit)
    expect(hitMove).toBeDefined()
    expect(hitMove!.from).toBe(18)
    // 白 coord 18-4=14 → 全局 14
    expect(hitMove!.to).toBe(14)

    const after = applyMove(rs, hitMove!)
    expect(after.points[14 - 1].black).toBe(0)
    expect(after.points[14 - 1].white).toBe(1)
    expect(after.off.black).toBe(1) // 被打下盘的黑马进入界外
  })
})

describe('卡位', () => {
  it('敌两马成梁则不能落', () => {
    const s0 = createInitialState('white')
    const s = { ...s0, points: JSON.parse(JSON.stringify(s0.points)) } as GameState
    for (const p of s.points) {
      p.white = 0
      p.black = 0
    }
    setWhite(s.points, 18, 1)
    s.points[14 - 1].black = 2 // 全局 14 黑两马（成梁）
    const rs = rollDice(s, [4, 1])
    const moves = legalMoves(rs)
    // 不应出现到全局 14 的走法
    const to14 = moves.find((m) => m.to === 14)
    expect(to14).toBeUndefined()
  })
})

describe('入局', () => {
  it('界外马按采数落子，未复进前只能入局', () => {
    const s0 = createInitialState('white')
    const s = { ...s0, points: JSON.parse(JSON.stringify(s0.points)) } as GameState
    s.off.white = 1
    const rs = rollDice(s, [3, 2])
    expect(rs.phase).toBe('entry')
    const moves = legalMoves(rs)
    // 入局落点应先复用采数 pip=3，落在白 coord 3 → 全局 3
    const entry = moves.filter((m) => m.reenters)
    expect(entry.length).toBeGreaterThan(0)
    expect(entry[0].from).toBeNull()
    expect(entry[0].to).toBe(coordOf('white', 3))
  })
})

describe('拈出（离盘）', () => {
  it('全部过门后可按采数拈出', () => {
    const s0 = createInitialState('white')
    const s = { ...s0, points: JSON.parse(JSON.stringify(s0.points)) } as GameState
    for (const p of s.points) {
      p.white = 0
      p.black = 0
    }
    // 白 15 马全部放入内盘（const coord 1..6）
    for (let c = 1; c <= 6; c++) s.points[c - 1].white = 0
    // 放 15 马到 coord 1..6，任意分布；这里放 coord1 = 15（虽超 maxStack 但用于功能验证)
    // 用合法分布：coord1..6 各 3/3/3/2/2/2=15，且每格<=6
    const dist = [3, 3, 3, 2, 2, 2]
    for (let i = 0; i < 6; i++) s.points[i].white = dist[i]
    const rs = rollDice(s, [4, 2])
    expect(rs.phase).toBe('bearing')
    const moves = legalMoves(rs)
    const bears = moves.filter((m) => m.bearsOff)
    expect(bears.length).toBeGreaterThan(0)
    const after = applyMove(rs, bears[0])
    expect(after.borneOff.white).toBe(1)
  })
})

describe('终局', () => {
  it('拈尽 15 马即胜', () => {
    const s0 = createInitialState('white')
    const s = { ...s0, points: JSON.parse(JSON.stringify(s0.points)) } as GameState
    for (const p of s.points) {
      p.white = 0
      p.black = 0
    }
    s.borneOff.white = 14
    s.points[0].white = 1 // 最后一个白马在 coord1
    const rs = rollDice(s, [1, 2])
    const moves = legalMoves(rs)
    const bears = moves.filter((m) => m.bearsOff)
    expect(bears.length).toBeGreaterThan(0)
    const after = applyMove(rs, bears[0])
    expect(after.winner).toBe('white')
    expect(after.phase).toBe('ended')
  })
})

/** 把玩家坐标换算为全局物理格（与 engine 保持一致） */
function coordOf(player: 'white' | 'black', coord: number): number {
  return player === 'white' ? coord : 25 - coord
}

describe('v0.3 变体配置', () => {
  it('diceCount=3（三梁/大食）→ 三骰，采数序列三个，dice 保有三个', () => {
    const s0 = createInitialState('white', { diceCount: 3 } as any)
    const s = rollDice(s0, [2, 3, 5])
    expect(s.dice).toEqual([2, 3, 5])
    expect(s.remainingPips).toEqual([2, 3, 5])
  })

  it('创建时配置被固化到 state.options（UI/AI 默认读取）', () => {
    const s = createInitialState('white', { bearOffTolerance: 'arbitraryTwo', pieceCount: 12 } as any)
    expect(s.options.pieceCount).toBe(12)
    expect(s.options.bearOffTolerance).toBe('arbitraryTwo')
    expect(s.options.diceCount).toBe(2) // 未指定时取默认
    // state.options 固化后，legalMoves 未传 opts 也会依据它（任取一 phase 冒烟）
    const pts = initialPositionPoints(12)
    expect(pts.filter((p) => p.white > 0).reduce((a, p) => a + p.white, 0)).toBe(12)
  })

  it('pieceCount=12（佛双陆）→ 每方 12 马', () => {
    const pts = initialPositionPoints(12)
    let w = 0
    let b = 0
    for (const p of pts) {
      w += p.white
      b += p.black
    }
    expect(w).toBe(12)
    expect(b).toBe(12)
  })

  it('bearOffTolerance=arbitraryTwo（回回双陆）→ 任意马可拈出', () => {
    // 配置在创建时固化到 state.options（真实用法）；后续 legalMoves 自动读取
    const s0 = createInitialState('white', { bearOffTolerance: 'arbitraryTwo' } as any)
    const s = { ...s0, points: JSON.parse(JSON.stringify(s0.points)) } as GameState
    for (const p of s.points) {
      p.white = 0
      p.black = 0
    }
    // 白 15 马全在 home，其中 coord 6 有 6 马（pip=4 下 standard 拈不到 coord 6）
    s.points[6 - 1].white = 6
    s.points[5 - 1].white = 5
    s.points[4 - 1].white = 4
    const rs = rollDice(s, [4, 4])
    expect(rs.phase).toBe('bearing')
    const moves = legalMoves(rs)
    const bears = moves.filter((m) => m.bearsOff)
    // arbitraryTwo：内盘任意马可拈 → 应包含来自 coord 6 的拈出
    expect(bears.some((m) => coordOf('white', 6) === m.from)).toBe(true)
  })
})

describe('M1 架构健全化', () => {
  it('双采赏一掷标记（doublesBonusRoll）', () => {
    const s0 = createInitialState('white', { doublesBonusRoll: true } as any)
    const s = rollDice(s0, [3, 3])
    expect(s.isDoubles).toBe(true)
    expect(s.bonusRollPending).toBe(true)
    const s2 = createInitialState('white', { doublesBonusRoll: false } as any)
    const t = rollDice(s2, [3, 3])
    expect(t.bonusRollPending).toBe(false)
  })

  it('skipRemaining：入局被卡位挡住时跳过该采数，不卡死', () => {
    const s0 = createInitialState('white')
    const s = { ...s0, points: JSON.parse(JSON.stringify(s0.points)) } as GameState
    // 清空：白方界外 1 马必须入局；黑方两马卡住全局 3（白 coord 3 入局点）
    for (const p of s.points) {
      p.white = 0
      p.black = 0
    }
    s.off.white = 1
    s.points[3 - 1].black = 2 // 卡位：全局 3
    const rs = rollDice(s, [3, 2])
    expect(rs.phase).toBe('entry')
    // pip=3 入局被卡 → 无合法走子
    expect(legalMoves(rs).length).toBe(0)
    // 跳过当前采数（pip=3），剩 [2]
    const after = skipRemaining(rs)
    expect(after.remainingPips).toEqual([2])
    expect(after.phase).toBe('entry') // 界外马仍在，仍需入局
    // pip=2 入局点（全局 2）未被卡 → 有合法入局
    expect(legalMoves(after).length).toBeGreaterThan(0)
    // 整回合计跳过 → 直接切换回合
    const afterTurn = skipRemaining(rs, 'turn')
    expect(afterTurn.remainingPips.length).toBe(0)
    expect(afterTurn.turn).toBe('black')
  })

  it('isLegalMove：合法走子通过，非法被拒', () => {
    const s0 = createInitialState('white')
    const s = { ...s0, points: JSON.parse(JSON.stringify(s0.points)) } as GameState
    for (const p of s.points) {
      p.white = 0
      p.black = 0
    }
    // 白马在 coord 10（全局 10）
    setWhite(s.points, 10, 1)
    const rs = rollDice(s, [3, 2])
    const moves = legalMoves(rs)
    // pip=3 的合法走子：coord 10 → coord 7（全局 7）
    const legal = moves.find((m) => m.pip === 3 && m.from === 10 && m.to === 7)
    expect(legal).toBeDefined()
    if (legal) {
      expect(isLegalMove(rs, legal)).toBe(true)
    }
    // 非法走子：source 无马
    const fake = { player: 'white' as const, from: 1, to: 3, pip: 3 }
    expect(isLegalMove(rs, fake)).toBe(false)
  })

  it('序列化/反序列化往返一致（存局同步用）', () => {
    let s = createInitialState('black', { variant: 'xia-zan', doublesBonusRoll: true } as any)
    s = rollDice(s, [3, 3])
    const json = serializeState(s)
    const back = loadState(json)
    expect(back).not.toBeNull()
    expect(back!.turn).toBe('black')
    expect(back!.dice).toEqual([3, 3])
    expect(back!.isDoubles).toBe(true)
    expect(back!.bonusRollPending).toBe(true)
    expect(JSON.stringify(back)).toBe(json)
    // 非法 JSON → null
    expect(loadState('not json {')).toBeNull()
  })
})
