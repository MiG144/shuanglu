import './HomeScreen.css'
import type { GameOptions, Player } from '../game'

const REPO_URL = 'https://github.com/MiG144/shuanglu'

interface HomeScreenProps {
  variant: GameOptions['variant']
  aiLevel: 'random' | 'greedy' | 'advanced'
  mode: 'pve' | 'hotseat'
  playerColor: Player
  winsToWin: number
  onVariant: (v: GameOptions['variant']) => void
  onAiLevel: (l: 'random' | 'greedy' | 'advanced') => void
  onMode: (m: 'pve' | 'hotseat') => void
  onPlayerColor: (p: Player) => void
  onWinsToWin: (n: number) => void
  onStart: () => void
  onTutorial: () => void
  onRules: () => void
  onLoad: () => void
  onSave: () => void
  soundOn: boolean
  onToggleSound: () => void
  isSea: boolean
  onStopSea: () => void
  stats: { total: number; whiteWins: number; blackWins: number; streak: number; streakPlayer?: 'white' | 'black' }
  onResetStats: () => void
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
    soundOn, onToggleSound, isSea, onStopSea,
    stats, onResetStats,
  } = props

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title font-serif">
          双陆棋
          <svg className="home-seal" viewBox="0 0 64 64" width="46" height="46" aria-label="雙陸印">
            <rect x="3" y="3" width="58" height="58" rx="6" fill="#b5523d" />
            <text x="32" y="30" textAnchor="middle" fontSize="20" fill="#f8f2e3">雙</text>
            <text x="32" y="52" textAnchor="middle" fontSize="20" fill="#f8f2e3">陸</text>
          </svg>
        </h1>
        <p className="home-quote font-serif">「雙陸近古號雅戲」</p>
        <p className="home-sub font-serif">打雙陸 · 依《譜雙》古制</p>
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
        <div className="home-settings-title">
          <span>对局设置</span>
          <span className="home-settings-note">开始前按喜好配置</span>
        </div>

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
            <select value={aiLevel} onChange={(e) => onAiLevel(e.target.value as 'random' | 'greedy' | 'advanced')}>
              <option value="advanced">进阶（前瞻）</option>
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

        <div className="home-stats">
          <span>
            战绩：<b>{stats.total}</b> 局 · 白马 <b>{stats.whiteWins}</b> / 黑马 <b>{stats.blackWins}</b>
            {stats.streak > 0 && <> · 连胜 {stats.streak}{stats.streakPlayer ? `（${stats.streakPlayer === 'white' ? '白' : '黑'}）` : ''}</>}
          </span>
          <button className="home-stats-reset" onClick={onResetStats}>清除</button>
        </div>
      </div>

      <div className="home-foot">
        <div className="home-foot-line">
          <a className="home-repo" href={REPO_URL} target="_blank" rel="noreferrer">项目地址：{REPO_URL.replace('https://', '')}</a>
        </div>
        <div className="home-foot-line">
          <span className="home-meta">© 2026 MiG144 · 依据宋·洪遵《谱双》 · MIT License</span>
          <button className="home-sound" onClick={onToggleSound} title={soundOn ? '关闭音效' : '开启音效'}>
            {soundOn ? '🔊' : '🔇'} {soundOn ? '音效开' : '音效关'}
          </button>
          {isSea && (
            <button className="home-sound" onClick={onStopSea} title="退出本地离线服务">⏻ 退出本地服务</button>
          )}
        </div>
      </div>
    </div>
  )
}
