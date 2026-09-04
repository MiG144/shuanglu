import { useState } from 'react'
import './Tutorial.css'

interface TutorialProps {
  open: boolean
  onClose: () => void
}

/** 教学步骤（内容依据《谱双》规则定稿 v0.3） */
const STEPS = [
  {
    title: '这是一款什么棋？',
    body: (
      <>
        <p><strong>双陆棋（打双陆）</strong>是源自唐宋的经典双人对弈棋，由印度传入中国，宋代洪遵《谱双》详载其制。双方各执 15 枚「马」，掷两枚骰子按点数行棋，先把自己全部马移出棋盘者获胜。</p>
        <p>棋盘 24 个落子格叫「<strong>梁</strong>」，中央以「<strong>门</strong>」分隔；白马自右归左、黑马自左归右，相向而行。</p>
      </>
    ),
  },
  {
    title: '目标 & 基本流程',
    body: (
      <>
        <ol>
          <li>轮流掷骰（也可由游戏自动掷骰）</li>
          <li>按骰子点数，把己方马一格一格朝自家方向前进（朝「门」再朝「家」）</li>
          <li>所有马都进入己方内区（过门）后，开始「拈出」——把马移出棋盘</li>
          <li>先把 15 匹马全部移出棋盘者获胜</li>
        </ol>
        <p className="tip"><strong>计分</strong>：胜一局记 1 筹；若对方尚未全部过门、或已过门却一匹都没拈出，则本方得 <strong>2 筹（双筹）</strong>。</p>
      </>
    ),
  },
  {
    title: '掷骰 & 走子',
    body: (
      <>
        <p>每回合掷两枚骰子（三梁/大食变体为三枚）。假设掷出 6 和 3：</p>
        <ul>
          <li>可以<b>两匹不同的马</b>分别走 6 步、3 步；</li>
          <li>也可以让<b>同一匹马</b>先走 6 步再走 3 步（分两次走，不能一次跳 9 步）；</li>
          <li>掷出<b>双采</b>（两骰同点）时，按该点数走 <strong>4 步</strong>（如双三即走四步各 3）。</li>
        </ul>
        <p className="tip">落子规则：可以落到空梁、己方马所在的梁；若对方只有一匹单立马在此也可落。</p>
      </>
    ),
  },
  {
    title: '打马 & 卡位（攻防核心）',
    body: (
      <>
        <p><strong>打马</strong>：某梁上只有一匹敌马（单立），你的马落上去，就把这匹敌马「打」下棋盘，它必须重新入场。</p>
        <p><strong>卡位（成梁）</strong>：同一梁上有两匹以上己方马，就形成可防守的「梁」——敌方既不能落在上面（也没法打它），但可从上方越过。</p>
        <p className="tip">单梁最多叠 6 匹马（《谱双》"一道不得过六马"）。防守时尽量留两匹马镇守关键位（"固两马"）。</p>
      </>
    ),
  },
  {
    title: '入局（被打下后）',
    body: (
      <>
        <p>被打下棋盘的马必须<b>先重新入场</b>，才能继续走其余的马——这是《谱双》"所打者未下，则它马不得行"。</p>
        <p>入局时按骰子点数落在对应梁上（如掷出 3，落到己方第 3 梁）；若落点被敌方卡位挡住，这一步走不了（自动跳过该点数）。</p>
        <p className="tip">这是最容易被新手忽视的规则：<strong>界外有马时，盘上其它马一律不能动，只能先入局。</strong></p>
      </>
    ),
  },
  {
    title: '过门 & 拈出（终局阶段）',
    body: (
      <>
        <p><strong>过门</strong>：己方全部 15 匹马都越过门、进入己方内区 6 梁（叠梁）后，才可以「拈出」。</p>
        <p><strong>拈出</strong>：掷出的点数，可以把位于该点数位置（或更近门一侧）的马移出棋盘（"有余则取，不足则否"）。</p>
        <p className="tip">操作提示：<b>点击可拈出的马，再点一次即可离盘</b>；高亮绿色格 = 可拈出。</p>
      </>
    ),
  },
  {
    title: '操作说明（上手即用）',
    body: (
      <>
        <ul>
          <li><b>选择起点</b>：点击你的一匹马（黄色高亮表示它有合法走法）</li>
          <li><b>选择落点</b>：点击黄色高亮的目标梁完成走子</li>
          <li><b>拈出</b>：绿色高亮格可拈出，点击后<b>再点一次</b>离盘</li>
          <li><b>入局</b>：黄色高亮的落点可直接点击入场</li>
          <li>无合法走子时会自动跳过；<b>悔棋</b>、<b>复盘</b>、<b>存档</b>在顶栏</li>
        </ul>
      </>
    ),
  },
  {
    title: '多种玩法（变体）',
    body: (
      <>
        <p>除了标准的「平双陆」，本作还开放《谱双》记载的其它地域玩法：</p>
        <ul>
          <li><b>回回双陆</b>：拈出时不问点数、任意出两匹马</li>
          <li><b>三梁双陆 / 大食双陆</b>：用<b>三枚骰子</b>对彩行棋</li>
          <li><b>佛双陆</b>：每方仅 12 匹马，不预先布局</li>
          <li><b>下赞双陆</b>：双采移四马，且<b>赏一掷</b>（再掷一次）</li>
        </ul>
        <p className="tip">在顶部「变体」下拉框切换，开局前选定即可。</p>
      </>
    ),
  },
]

export function Tutorial({ open, onClose }: TutorialProps) {
  const [step, setStep] = useState(0)
  if (!open) return null

  const total = STEPS.length
  const go = (i: number) => setStep(Math.max(0, Math.min(total - 1, i)))

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-header">
          <h2>双陆棋 · 新手教学</h2>
          <button className="tutorial-close" onClick={onClose} aria-label="关闭教学">✕</button>
        </div>

        <div className="tutorial-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              className={`tutorial-tab ${i === step ? 'active' : ''}`}
              onClick={() => go(i)}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>

        <div className="tutorial-body">{STEPS[step].body}</div>

        <div className="tutorial-footer">
          <button onClick={() => go(step - 1)} disabled={step === 0}>◀ 上一步</button>
          <span>{step + 1} / {total}</span>
          {step < total - 1 ? (
            <button onClick={() => go(step + 1)}>下一步 ▶</button>
          ) : (
            <button className="primary" onClick={onClose}>开始游戏！</button>
          )}
        </div>
      </div>
    </div>
  )
}