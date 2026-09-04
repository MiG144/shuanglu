// ============================================================================
// 双陆棋 · Web Audio 音效合成器（无音频素材，纯 Oscillator 合成）
// 提供：掷骰 / 打马 / 拈出 / 胜利 四类短音效；全局开关持久化于 localStorage。
// ============================================================================

const KEY = 'shuanglu.soundOn'

let ctx: AudioContext | null = null
let muted = false

try {
  muted = localStorage.getItem(KEY) !== '1'
} catch {
  muted = false
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    } catch {
      return null
    }
  }
  return ctx
}

/** 播放一个短音（振荡器 + 增益包络） */
function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, when = 0) {
  if (muted) return
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + when
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain)
  gain.connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export const sfx = {
  /** 掷骰：短促高频双音 */
  roll() {
    tone(660, 0.08, 'triangle', 0.16)
    tone(880, 0.08, 'triangle', 0.14, 0.09)
    tone(520, 0.12, 'triangle', 0.12, 0.18)
  },
  /** 打马：清脆"嗒"，带下扫 */
  hit() {
    tone(220, 0.12, 'square', 0.2)
    tone(160, 0.16, 'triangle', 0.18, 0.03)
  },
  /** 拈出（离盘）：上升音 */
  bearOff() {
    tone(440, 0.12, 'sine', 0.18)
    tone(660, 0.14, 'sine', 0.16, 0.08)
  },
  /** 入局：中频短促 */
  reenter() {
    tone(392, 0.1, 'triangle', 0.16)
  },
  /** 胜利：三连升调 */
  win() {
    tone(523, 0.16, 'sine', 0.2)
    tone(659, 0.16, 'sine', 0.2, 0.14)
    tone(784, 0.22, 'sine', 0.2, 0.28)
  },
  /** 切换静音状态；返回当前是否已静音 */
  toggle(): boolean {
    muted = !muted
    try {
      localStorage.setItem(KEY, muted ? '0' : '1')
    } catch {
      /* ignore */
    }
    return muted
  },
  isMuted(): boolean {
    return muted
  },
  /** 恢复音频上下文（浏览器要求用户手势后创建） */
  unlock() {
    const a = ac()
    if (a && a.state === 'suspended') void a.resume()
  },
}