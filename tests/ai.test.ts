import { describe, it, expect } from 'vitest'
import { createInitialState, rollDice, applyMove, legalMoves } from '../src/game'
import { chooseMove, evaluatePosition } from '../src/game/ai'
import type { GameState } from '../src/game'

describe('AI 局面评估（evaluatePosition）', () => {
  it('领先局面评分高于落后局面', () => {
    const s0 = createInitialState('white')
    // 白领先构造：白马都在家门附近，黑都远
    const s = { ...s0, points: s0.points.map((p) => ({ ...p })) } as GameState
    for (const p of s.points) { p.white = 0; p.black = 0 }
    s.points[1 - 1].white = 5   // 白 coord 1（家门）
    s.points[2 - 1].white = 5
    s.points[3 - 1].white = 5
    s.points[24 - 1].black = 15 // 黑最远
    const ahead = evaluatePosition(s, 'white')
    // 反过来：白最远黑近
    const s2 = { ...s0, points: s0.points.map((p) => ({ ...p })) } as GameState
    for (const p of s2.points) { p.white = 0; p.black = 0 }
    s2.points[24 - 1].white = 15
    s2.points[1 - 1].black = 5
    s2.points[2 - 1].black = 5
    s2.points[3 - 1].black = 5
    const behind = evaluatePosition(s2, 'white')
    expect(ahead).toBeGreaterThan(behind)
  })

  it('暴露单立马会降分', () => {
    const s0 = createInitialState('white')
    const base = { ...s0, points: s0.points.map((p) => ({ ...p })) } as GameState
    for (const p of base.points) { p.white = 0; p.black = 0 }
    // 白 2 马成梁（safe）vs 1+1 两落点（blot）
    const safe = { ...base, points: base.points.map((p) => ({ ...p })) } as GameState
    safe.points[10 - 1].white = 2
    const blotted = { ...base, points: base.points.map((p) => ({ ...p })) } as GameState
    blotted.points[10 - 1].white = 1
    blotted.points[20 - 1].white = 1
    expect(evaluatePosition(safe, 'white')).toBeGreaterThan(evaluatePosition(blotted, 'white'))
  })
})

describe('AI 选步（advanced）', () => {
  it('advanced 不崩且返回合法步', () => {
    let s = createInitialState('white')
    s = rollDice(s, [4, 2])
    const m = chooseMove(s, undefined, 'advanced')
    expect(m).not.toBeNull()
    if (m) {
      expect(legalMoves(s).some((x) => x.from === m!.from && x.to === m!.to)).toBe(true)
      const next = applyMove(s, m)
      expect(next.turn).toBe('white') // 仍在本回合（还有剩余骰）
    }
  })

  it('advanced 走完一个完整回合不崩（20 回合冒烟）', () => {
    let s = createInitialState('white')
    // 用固定骰子循环掷，AI 走子推进，直到回合切换或结束（限 20 次防死循环）
    for (let i = 0; i < 40; i++) {
      if (s.phase === 'ended') break
      if (s.phase === 'roll') {
        s = rollDice(s, [3, 1])
        continue
      }
      const m = chooseMove(s, undefined, 'advanced')
      if (!m) {
        // 无可走：跳过首骰推进
        s = { ...s, remainingPips: s.remainingPips.slice(1) } as GameState
        if (s.remainingPips.length === 0) {
          s = { ...s, turn: s.turn === 'white' ? 'black' : 'white', phase: 'roll' } as GameState
        }
        continue
      }
      s = applyMove(s, m)
    }
    expect(s.phase === 'ended' || s.turn === 'black' || s.remainingPips.length < 2).toBe(true)
  })
})