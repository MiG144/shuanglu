import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import App from '../src/App'
import { Board } from '../src/components/Board'
import { createInitialState, rollDice, applyMove, chooseMove } from '../src/game'

describe('UI 渲染冒烟（SSR，renderToString）', () => {
  it('App 可渲染', () => {
    const html = renderToString(React.createElement(App))
    expect(html).toContain('双陆棋')
    expect(html).toContain('平双陆')
  })

  it('Board 可渲染 24 梁且含门标', () => {
    const state = createInitialState('white')
    const html = renderToString(
      React.createElement(Board, { state, legal: [] }),
    )
    // 24 个点 + 梁頭/梁末/门 标注
    expect((html.match(/class="point/g) ?? []).length).toBe(24)
    expect(html).toContain('梁頭')
    expect(html).toContain('门')
  })

  it('掷骰→走子→轮空 全流程不崩（AI 驱动一个完整回合）', () => {
    let s = createInitialState('white')
    s = rollDice(s, [5, 2])
    // 总有合法走子或自动轮空；这里仅验证 applyMove 接受 AI 选步
    const moves = chooseMove(s)
    if (moves) {
      s = applyMove(s, moves)
    }
    const html = renderToString(React.createElement(Board, { state: s, legal: [] }))
    expect(html).toContain('梁')
  })
})