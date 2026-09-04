import { describe, it, expect, beforeEach } from 'vitest'
import { recordResult, resetStats, loadStats, winRate } from '../src/game/stats'

/** 在内存中模拟 localStorage（SSR/node 环境无 localStorage） */
const mem = new Map<string, string>()
beforeEach(() => {
  mem.clear()
  ;(globalThis as unknown as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => mem.set(k, v),
  }
})

describe('战绩统计', () => {
  it('累计总局数与胜负', () => {
    resetStats()
    recordResult('white')
    recordResult('black')
    recordResult('white')
    const s = loadStats()
    expect(s.total).toBe(3)
    expect(s.whiteWins).toBe(2)
    expect(s.blackWins).toBe(1)
  })

  it('连胜：同方连胜累计，对方胜则重置', () => {
    resetStats()
    recordResult('white')
    recordResult('white')
    expect(loadStats().streak).toBe(2)
    recordResult('black')
    expect(loadStats().streak).toBe(1)
    expect(loadStats().streakPlayer).toBe('black')
    recordResult('black')
    expect(loadStats().streak).toBe(2)
  })

  it('胜率计算（保留 1 位小数）', () => {
    resetStats()
    recordResult('white')
    recordResult('black')
    const s = loadStats()
    expect(winRate(s, 'white')).toBe(50)
    expect(winRate(s, 'black')).toBe(50)
    recordResult('white')
    expect(winRate(loadStats(), 'white')).toBe(66.7) // (2/3)*100 ≈ 66.7
  })

  it('重置清零', () => {
    resetStats()
    recordResult('white')
    const cleared = resetStats()
    expect(cleared.total).toBe(0)
    expect(cleared.streak).toBe(0)
    expect(loadStats().total).toBe(0)
  })
})