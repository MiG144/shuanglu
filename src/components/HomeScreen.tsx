import './HomeScreen.css'
import type { GameOptions, Player } from '../game'

interface HomeScreenProps {
  variant: GameOptions['variant']
  aiLevel: 'random' | 'greedy'
  mode: 'pve' | 'hotseat'
  playerColor: Player
  winsToWin: number
  onVariant: (v: GameOptions['variant']) => void
  onAiLevel: (l: 'random' | 'greedy') => void
  onMode: (m: 'pve' | 'hotseat') => void
  onPlayerColor: (p: Player) => void
  onWinsToWin: (n: number) => void
  onStart: () => void
  onTutorial: () => void
  onRules: () => void
  onLoad: () => void
  onSave: () => void
}

/** 变体选项（与 App 一致） */
const VARIANTS: { value: GameOptions['variant']; label: string; hint: string }[] = [
  { value: 'ping', label: '平双陆', hint: '常局格制' },
  { value: 'huihui', label: '回回双陆', hint: '出局任意两马' },
  { value: 'sanliang', label: '三梁双陆', hint: '三骰对彩' },
  { value: 'fo', label: '佛双陆', hint: '十二马不布局' },
  { value: 'xia-zan', label: '下赞双陆', hint: '双采移四+赏一掷' },
  { value: 'da-shi', label: '大食双陆', hint: '三骰马分七' },
]

/** 游戏主菜单（启动页）：标题 + 入口 + 对局设置 */
export function HomeScreen(props: HomeScreenProps) {
  const {
    variant, aiLevel, mode, playerColor, winsToWin,
    onVariant, onAiLevel, onMode, onPlayerColor, onWinsToWin,
    onStart, onTutorial, onRules, onLoad, onSave,
  } = props

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">🀄 双陆棋</h1>
        <p className="home-sub">打双陆 · 依据宋《谱双》规则（v0.3）</p>
        <p className="home-desc">
          中式双陆：24 梁双门，白马右归左、黑马左归右——掷骰行马，打马卡位，先拈尽者胜。
        </p>
      </div>

      <div className="home-actions">
        <button className="home-start" onClick={onStart}>▶ 开始对局</button>
        <div className="home-actions-row">
          <button onClick={onTutorial}>🎮 互动教学</button>
          <button onClick={onRules}>📖 完整规则</button>
          <button onClick={onSave}>💾 存档</button>
          <button onClick={onLoad}>📂 读档</button>
        </div>
      </div>

      <div className="home-settings">
        <div className="home-settings-title">对局设置</div>

        <div className="home-field">
          <label>模式</label>
          <select value={mode} onChange={(e) => onMode(e.target.value as 'pve' | 'hotseat')}>
            <option value="pve">人机对战（PVE）</option>
            <option value="hotseat">本地双人（热座）</option>
          </select>
        </div>

        {mode === 'pve' && (
          <div className="home-field">
            <label>执子</label>
            <select value={playerColor} onChange={(e) => onPlayerColor(e.target.value as Player)}>
              <option value="white">白马</option>
              <option value="black">黑马</option>
            </select>
          </div>
        )}

        <div className="home-field">
          <label>变体</label>
          <select value={variant ?? 'ping'} onChange={(e) => onVariant(e.target.value as GameOptions['variant'])}>
            {VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>{v.label} — {v.hint}</option>
            ))}
          </select>
        </div>

        {mode === 'pve' && (
          <div className="home-field">
            <label>AI</label>
            <select value={aiLevel} onChange={(e) => onAiLevel(e.target.value as 'random' | 'greedy')}>
              <option value="greedy">启发式</option>
              <option value="random">随机</option>
            </select>
          </div>
        )}

        <div className="home-field">
          <label>先胜几局</label>
          <select value={winsToWin} onChange={(e) => onWinsToWin(Number(e.target.value))}>
            <option value={1}>单局</option>
            <option value={2}>先赢 2 局</option>
            <option value={3}>先赢 3 局</option>
            <option value={5}>先赢 5 局</option>
          </select>
        </div>
      </div>

      <p className="home-foot">规则考据：宋·洪遵《谱双》· 《欣赏编》本 · 公有领域古籍</p>
    </div>
  )
}