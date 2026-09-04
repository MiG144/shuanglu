// ============================================================================
// 互动式教学课件（guided play lessons）
// 每课在真实棋盘上构造专用局面，逐步引导玩家亲手完成关键规则动作：
//   走子（含连续两步）→ 打马 → 入局 → 拈出 → 双采
// 坐标一律为【全局物理格 1..24】；玩家统一执白（turn='white'）。
// ============================================================================

import { createInitialState, rollDice } from './engine'
import type { Die, GameState } from './types'

export type TutStep =
  | { kind: 'roll'; dice: [Die, Die]; text: string } // 自动掷骰并展示
  | { kind: 'pick'; from: number; text: string } // 玩家点选起点
  | { kind: 'place'; from: number; to: number; text: string } // 玩家落子
  | { kind: 'enter'; to: number; text: string } // 入局：直接点落点
  | { kind: 'bearoff'; from: number; text: string } // 拈出：点已选格再点一次
  | { kind: 'note'; text: string; done?: boolean } // 说明；done 标记课程结束

export interface TutLesson {
  id: string
  title: string
  /** 开局局面：全为白子（turn 固定 white）；可选 off/bornOff */
  points: Record<number, number> // 全局格 -> 白子数
  black?: Record<number, number> // 全局格 -> 黑子数
  off?: number // 白方界外马数
  steps: TutStep[]
}

export const TUT_LESSONS: TutLesson[] = [
  {
    id: 'move',
    title: '第一课 · 走子',
    points: { 24: 1 },
    black: { 13: 1 },
    steps: [
      { kind: 'roll', dice: [3, 2], text: '看到骰子 3、2。先用第一颗骰子（3 步）走一匹自己的马。' },
      { kind: 'pick', from: 24, text: '点击这匹橙色脉冲的马（第 24 梁）——它是当前唯一能走的马。' },
      { kind: 'place', from: 24, to: 21, text: '好的！现在点击黄色闪光的目标梁（第 21 梁），它就走 3 步到那里。' },
      { kind: 'pick', from: 21, text: '漂亮！第二颗骰子是 2，继续点击这匹橙马。' },
      { kind: 'place', from: 21, to: 19, text: '再点目标梁（第 19 梁），走完这 2 步。' },
      {
        kind: 'note',
        text: '完成！规则：按骰子点数把马朝「门」的方向推进；两步可以走同一匹，也可以分给两匹不同的马。',
      },
    ],
  },
  {
    id: 'hit',
    title: '第二课 · 打马',
    points: { 10: 1, 16: 1 },
    black: { 7: 1 },
    steps: [
      { kind: 'roll', dice: [3, 2], text: '本课教你核心招式——打马！骰子 3、2。' },
      { kind: 'pick', from: 10, text: '点击第 10 梁的橙马：它往前 3 步（第 7 梁）正好有一匹孤立的黑马。' },
      { kind: 'place', from: 10, to: 7, text: '点击第 7 梁——那里只有一匹黑马（单立），你的马落上去会把它打掉！' },
      { kind: 'note', text: '打马成功！那匹黑马被击落到「界外」，必须重新入局才能继续走（下一课）。' },
    ],
  },
  {
    id: 'entry',
    title: '第三课 · 入局',
    points: { 20: 1, 12: 1 },
    black: { 5: 1 },
    off: 1,
    steps: [
      { kind: 'roll', dice: [2, 4], text: '现在你有一匹被打落的马在界外。规则：界外马必须先入局，盘上其它马一律不能动！' },
      { kind: 'enter', to: 2, text: '掷出 2：点击黄色闪烁的落点（第 2 梁），把界外那匹马放回棋盘。' },
      { kind: 'pick', from: 12, text: '入局完成！现在可以使用剩余点数（4）走其它马了，点击第 12 梁的橙马。' },
      { kind: 'place', from: 12, to: 8, text: '走 4 步到第 8 梁。' },
      { kind: 'note', text: '这就是入局——被打的马要先回来，其它马才允许行动（《谱双》"所打者未下，则它马不得行"）。' },
    ],
  },
  {
    id: 'bearoff',
    title: '第四课 · 拈出',
    points: { 2: 2, 4: 1, 5: 1 },
    black: { 17: 1 },
    steps: [
      { kind: 'roll', dice: [4, 2], text: '终局阶段！你的马已经全部「过门」（进入己方内区），现在按点数把马「拈出」（移出棋盘）。' },
      { kind: 'pick', from: 2, text: '第 2 梁有一匹可拈出的马（绿色）。先点击它选中。' },
      { kind: 'bearoff', from: 2, text: '再点一次第 2 梁——这匹马就离开了棋盘！' },
      { kind: 'pick', from: 2, text: '第二颗骰子是 2：第 2 梁还有一匹可拈出的马，再选中它。' },
      { kind: 'bearoff', from: 2, text: '再点一次，又拈出一匹！' },
      {
        kind: 'note',
        text: '所有马拈出即获胜；若对方还没全部过门、或已过门但一匹都没拈出，你赢双筹（2 分）。',
      },
    ],
  },
  {
    id: 'doubles',
    title: '第五课 · 双采',
    points: { 24: 1 },
    steps: [
      { kind: 'roll', dice: [3, 3], text: '掷出双三（两骰同点）！双采按该点数走 4 步——也就是 4 个 "3 步"。' },
      { kind: 'pick', from: 24, text: '第 1 步（3 步）：点击第 24 梁的橙马。' },
      { kind: 'place', from: 24, to: 21, text: '走到第 21 梁。' },
      { kind: 'pick', from: 21, text: '第 2 步：继续点这匹橙马。' },
      { kind: 'place', from: 21, to: 18, text: '走到第 18 梁。' },
      { kind: 'pick', from: 18, text: '第 3 步：再点它。' },
      { kind: 'place', from: 18, to: 15, text: '走到第 15 梁。' },
      { kind: 'pick', from: 15, text: '第 4 步（最后一步）：点它。' },
      { kind: 'place', from: 15, to: 12, text: '走到第 12 梁，完成双采！' },
      {
        kind: 'note',
        text: '双采完成！互动教学到此结束，你已经掌握全部核心规则——开始自由对局吧！',
        done: true,
      },
    ],
  },
]

/** 构造某课的初始局面（玩家执白；返回 phase='roll' 的初态，等待步骤向导掷骰） */
export function createLessonState(lesson: TutLesson): GameState {
  const s = createInitialState('white', { variant: 'ping' })
  // 清空后按课件放子
  for (let g = 1; g <= 24; g++) {
    s.points[g - 1].white = 0
    s.points[g - 1].black = 0
  }
  for (const [g, n] of Object.entries(lesson.points)) {
    s.points[Number(g) - 1].white = n
  }
  for (const [g, n] of Object.entries(lesson.black ?? {})) {
    s.points[Number(g) - 1].black = n
  }
  s.off.white = lesson.off ?? 0
  s.borneOff.white = 0
  s.turn = 'white'
  s.dice = null
  s.phase = 'roll'
  s.remainingPips = []
  s.bonusRollPending = false
  return s
}

/** 对课件第 step 步做一次自动掷骰（仅 roll 步骤），返回新状态 */
export function applyLessonRoll(state: GameState, step: TutStep): GameState {
  if (step.kind !== 'roll') return state
  return rollDice(state, step.dice)
}

/** 获取课件（越界防御） */
export function getLesson(i: number): TutLesson {
  return TUT_LESSONS[Math.max(0, Math.min(TUT_LESSONS.length - 1, i))]
}