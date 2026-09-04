import { useState } from 'react'
import './RulesManual.css'
import { Board } from './Board'
import type { GameState } from '../game'
import { createInitialState, initialPositionPoints } from '../game'

interface RulesManualProps {
  open: boolean
  onClose: () => void
}

/** 构造演示状态：白方视角，phase 视用途而定（move/entry/bearing 均可，仅作静态渲染） */
function demoState(white: [number, number][], black: [number, number][] = []): GameState {
  const s = createInitialState('white')
  const pts = initialPositionPoints()
  for (let g = 1; g <= 24; g++) {
    // 复用以开局为底再覆盖？不——演示局应完全干净
    pts[g - 1].white = 0
    pts[g - 1].black = 0
  }
  for (const [g, n] of white) pts[g - 1].white = n
  for (const [g, n] of black) pts[g - 1].black = n
  s.points = pts
  return s
}

interface Section {
  id: string
  title: string
  icon?: string
  body: () => React.ReactNode
}

function DemoBoard({ state, caption }: { state: GameState; caption: string }) {
  return (
    <div className="rule-board">
      <Board state={state} legal={[]} />
      <p className="rule-board-caption">{caption}</p>
    </div>
  )
}

export function RulesManual({ open, onClose }: RulesManualProps) {
  const [sec, setSec] = useState(0)
  if (!open) return null

  const SECTIONS: Section[] = [
    {
      id: 'intro',
      title: '棋具与总览',
      body: () => (
        <>
          <p>
            <b>双陆棋（打双陆）</b>：源自唐宋的经典双人对弈棋，双方各执 15 枚「马」，掷骰行棋，先把全部马移出棋盘者获胜。
          </p>
          <p>棋盘为长方形，两长边各刻 12 个落子格（共 <b>24 梁</b>），中央以「门」分隔；四面区域各 6 梁（"以六为限"）。实物如辽代叶茂台漆木盘即此形制。</p>
          <DemoBoard
            state={demoState([[24, 1], [13, 1]])}
            caption="示意：24 梁 + 中央两个门标（梁頭=起点端 / 梁末=终点端）。实际对局双方各 15 马，此处仅标注关键术语。"
          />
          <ul>
            <li><b>马</b> = 棋子（白/黑各 15）</li>
            <li><b>梁</b> = 落子格（24 路）</li>
            <li><b>门</b> = 中线分隔标记</li>
            <li><b>采</b> = 骰子点数</li>
            <li><b>双采</b> = 两骰同点</li>
          </ul>
          <p className="rule-quote">《谱双·总录》："雙陸率以六為限……左右各十二路，號曰梁，白黑各十五馬。"</p>
        </>
      ),
    },
    {
      id: 'setup',
      title: '开局摆位',
      body: () => (
        <>
          <p>每方 15 马按 <b>5 / 5 / 2 / 3</b> 四组分布（"右前六梁、左後一梁各布五馬；右後六梁二馬；左前二梁三馬"），白黑相偶（镜像）。</p>
          <DemoBoard
            state={demoState([[23, 5], [18, 5], [12, 2], [6, 3]])}
            caption="本作默认摆位（对称均衡映射）：白方 5/5/2/3 分布于 23、18、12、6 梁；黑方为其镜像。"
          />
          <p className="rule-quote">《谱双》："右前六梁、左後一梁，各布五馬；右後六梁，二馬；左前二梁，三馬。白黑相偶。"</p>
        </>
      ),
    },
    {
      id: 'move',
      title: '走子',
      body: () => (
        <>
          <p>每回合掷两枚骰（三梁/大食变体为三枚）。假设掷出 6 和 3：</p>
          <ul>
            <li><b>分走</b>：两匹不同的马分别走 6 步、3 步；</li>
            <li><b>合走一马</b>：同一匹马先走 6 步再走 3 步（分两次，不能一次跳 9 步）；</li>
            <li><b>双采</b>：两骰同点时按该点数走 <b>4 步</b>（如双三即四个 3 步）。</li>
          </ul>
          <p className="rule-quote">《谱双》："用骰子二，各以其采行……或以二骰之數，共行一馬，或行二馬，或移或疊。"</p>
          <DemoBoard
            state={demoState([[24, 1]])}
            caption="示例：白马在第 24 梁，掷出 3 时走 3 步到第 21 梁（朝门方向推进，坐标减小）。"
          />
        </>
      ),
    },
    {
      id: 'hit',
      title: '打马与卡位',
      body: () => (
        <>
          <p><b>打马</b>：某梁只有一匹敌马（单立），你的马落上去，这匹敌马被击下棋盘（进入界外）。</p>
          <p><b>卡位（成梁）</b>：两匹以上己方马同梁即形成可防守的「梁」——敌方既不能落、也不能打（但可从上方越过）。单梁上限 <b>6 马</b>。</p>
          <ul>
            <li>白马在 10 梁，前方 3 步（第 7 梁）恰有一匹单立黑马 → 白马落第 7 梁会将其打掉。</li>
          </ul>
          <DemoBoard
            state={demoState([[10, 1], [16, 1]], [[7, 1]])}
            caption="打马示例：白马走 3 步到第 7 梁，击落单立黑马（黑马进入界外待入局）。"
          />
          <p className="rule-quote">《谱双》："凡馬單立，則敵馬可擊。兩馬相比為一梁，它馬既不得打，亦不得同途。"</p>
        </>
      ),
    },
    {
      id: 'entry',
      title: '入局',
      body: () => (
        <>
          <p>被打下棋盘的马必须<b>先重新入局</b>，才能继续走其余的马——"所打者未下，则它马不得行"。</p>
          <p>入局时按骰子点数落子：掷出 3 即落到己方第 3 梁（坐标 3）；若落点被敌方卡位挡住则这一步走不了（自动跳过该点数）。</p>
          <DemoBoard
            state={demoState([[20, 1], [12, 1]], [[5, 1]])}
            caption="白方界外有 1 马（off=1）：掷出 2 时须先落到第 2 梁入局，其余盘上马在入局前不可移动。"
          />
          <p className="rule-quote">《谱双》："凡遭打，必候元入局處空位、與采相當，始得下……所打者未下，則它馬不得行。"</p>
        </>
      ),
    },
    {
      id: 'bearing',
      title: '过门与拈出',
      body: () => (
        <>
          <p><b>过门</b>：己方全部 15 马都越过门、进入己方内区 6 梁（叠梁）后，才可「拈出」。</p>
          <p><b>拈出</b>：掷出点数 N，可把坐标 ≤ N 的内区马移出棋盘（"有余则取，不足则否"）；若某个点数无法拈出，可用该点数在内区继续推进整理。</p>
          <DemoBoard
            state={demoState([[2, 2], [4, 1], [5, 1]], [[17, 1]])}
            caption="终局阶段：白方全部马已过门进入内区（第 1–6 梁）。掷出 4、2 时可依次拈出第 4、2 梁的马。"
          />
          <p className="rule-quote">《谱双》："凡馬盡過門後，方許對彩拈出……每擲視其彩拈出二馬，數有餘則取，不足則否。"</p>
        </>
      ),
    },
    {
      id: 'win',
      title: '胜负与计筹',
      body: () => (
        <>
          <ul>
            <li><b>胜</b>：先拈尽（全部 15 马出盘）者胜。</li>
            <li><b>计筹</b>：胜一局记 <b>1 筹</b>；若对方尚未全部过门、或已过门却一匹都没拈出，则记 <b>2 筹（双筹）</b>。</li>
            <li>比赛目标可配置（单局 / 先胜 2、3、5 局）。</li>
          </ul>
          <DemoBoard
            state={demoState([[2, 1]])}
            caption="终局画面示意：一方只剩最后一马待拈出，拈出即胜（对局判断是否双筹由引擎按对方状态计算）。"
          />
          <p className="rule-quote">《谱双》："馬先出盡為勝，而他馬未歸梁，或歸梁而無一馬出局，則勝雙籌。"</p>
        </>
      ),
    },
    {
      id: 'variants',
      title: '玩法变体',
      body: () => (
        <>
          <p>本作开放《谱双》记载的多种地域玩法（顶栏「变体」切换）：</p>
          <table className="rule-table">
            <thead><tr><th>变体</th><th>差异</th></tr></thead>
            <tbody>
              <tr><td>平双陆（默认）</td><td>常局格制，标准规则</td></tr>
              <tr><td>回回双陆</td><td>拈出时不问点数，任意出两匹</td></tr>
              <tr><td>三梁双陆</td><td>用 <b>三枚骰子</b>对彩行棋</td></tr>
              <tr><td>佛双陆</td><td>每方仅 12 马，不预先布局</td></tr>
              <tr><td>下赞双陆</td><td>双采移四马，且<b>赏一掷</b>（再掷一次）</td></tr>
              <tr><td>大食双陆</td><td>三骰，马分七处</td></tr>
            </tbody>
          </table>
          <p className="rule-quote">《谱双·雜記》："北雙有五：平雙陸、三梁、七梁、打間、回回……番禺雙名有五：下讚、三堆、羅嬴、不打、佛雙陸。"</p>
        </>
      ),
    },
    {
      id: 'terms',
      title: '术语表（南北局例）',
      body: () => (
        <>
          <p>《谱双·南北局例》记录的中式术语，游戏在对局中会使用部分概念：</p>
          <table className="rule-table">
            <thead><tr><th>术语</th><th>含义</th></tr></thead>
            <tbody>
              <tr><td>把核 / 拆核</td><td>两马占据后梁（核）称把核；拆走一马称拆核</td></tr>
              <tr><td>把门 / 拆门</td><td>两马占据前梁（门）称把门；拆一走一称拆门</td></tr>
              <tr><td>宫马 / 入宫</td><td>进入己方后六梁（内区）的马；归梁称入宫</td></tr>
              <tr><td>做屋 / 一门屋…六头屋</td><td>南式：两子相比成"屋"，按路数分命名</td></tr>
              <tr><td>外六门 / 落子</td><td>内区外的六梁；已出复入称落子</td></tr>
              <tr><td>缚 / 喫子</td><td>两子相比成缚；走出称喫子</td></tr>
              <tr><td>合碎</td><td>南人劣势时的"翻局"打法（频打不许成屋）</td></tr>
            </tbody>
          </table>
        </>
      ),
    },
  ]

  const current = SECTIONS[sec]

  return (
    <div className="rules-overlay" onClick={onClose}>
      <div className="rules" onClick={(e) => e.stopPropagation()}>
        <div className="rules-header">
          <h2>📖 规则手册</h2>
          <button className="rules-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className="rules-nav">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className={`rules-tab ${i === sec ? 'active' : ''}`}
              onClick={() => setSec(i)}
            >
              {s.icon ?? ''}{s.title}
            </button>
          ))}
        </div>

        <div className="rules-body">
          <h3>{current.title}</h3>
          {current.body()}
        </div>

        <div className="rules-footer">
          <button onClick={() => setSec(Math.max(0, sec - 1))} disabled={sec === 0}>◀ 上一节</button>
          <span>{sec + 1} / {SECTIONS.length}</span>
          {sec < SECTIONS.length - 1 ? (
            <button onClick={() => setSec(Math.min(SECTIONS.length - 1, sec + 1))}>下一节 ▶</button>
          ) : (
            <button className="primary" onClick={onClose}>开始游戏</button>
          )}
        </div>
      </div>
    </div>
  )
}