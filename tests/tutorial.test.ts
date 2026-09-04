import { describe, it, expect } from 'vitest'
import { TUT_LESSONS, createLessonState, getLesson } from '../src/game/tutorial'
import { legalMoves, rollDice, applyMove } from '../src/game'
import type { GameState } from '../src/game'

/** 模拟：按教案逐步执行，每一步校验"课件期望的走法确实合法存在" */
function replayLesson(lessonIdx: number): string[] {
  const errors: string[] = []
  const lesson = getLesson(lessonIdx)
  let s: GameState = createLessonState(lesson)

  for (let i = 0; i < lesson.steps.length; i++) {
    const st = lesson.steps[i]
    if (st.kind === 'roll') {
      s = rollDice(s, st.dice)
      continue
    }
    if (st.kind === 'note') continue
    const moves = legalMoves(s)
    const found =
      st.kind === 'pick'
        ? moves.some((m) => m.from === st.from)
        : st.kind === 'place'
          ? moves.some((m) => m.from === st.from && m.to === st.to)
          : st.kind === 'enter'
            ? moves.some((m) => m.from === null && m.to === st.to)
            : st.kind === 'bearoff'
              ? moves.some((m) => m.bearsOff && m.from === st.from)
              : false
    if (!found) {
      errors.push(`第${i}步(${st.kind}) 期望${JSON.stringify(st)} 但合法走法=${JSON.stringify(moves)}`)
      // 课程不可解则停，避免连锁
      break
    }
    if (st.kind === 'pick') {
      // pick 仅"点选起点"，不消耗采数、不移动
      continue
    }
    // 执行真正的走子推进状态
    const mv =
      st.kind === 'place'
        ? moves.find((m) => m.from === st.from && m.to === st.to)!
        : st.kind === 'enter'
          ? moves.find((m) => m.from === null && m.to === st.to)!
          : moves.find((m) => m.bearsOff && m.from === st.from)!
    s = applyMove(s, mv)
  }
  return errors
}

describe('互动教学课件可解性', () => {
  it('所有课程步骤都能被引擎接受（坐标与规则自洽）', () => {
    for (let li = 0; li < TUT_LESSONS.length; li++) {
      const errs = replayLesson(li)
      expect(errs, `${TUT_LESSONS[li].title} 错误: ${errs.join('; ')}`).toEqual([])
    }
  })
})