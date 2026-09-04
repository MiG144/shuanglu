import './Dice.css'

interface DiceProps {
  dice: number[] | null
  rollKey: number // 每次掷骰递增，用于重触发滚动动画
  doubles: boolean
  bonusPending?: boolean
}

/** 骰子显示：每次掷骰以 key 变化重播滚动动画，随后定格显示点数 */
export function Dice({ dice, rollKey, doubles, bonusPending }: DiceProps) {
  if (!dice || dice.length === 0) {
    return <span className="dice-empty">掷骰中…</span>
  }
  return (
    <span className="dice" key={rollKey}>
      {dice.map((v, i) => (
        <span key={i} className={`die ${v}`} data-pips={v} aria-label={`骰子 ${v}`}>
          <span className="pip p1" />
          <span className="pip p2" />
          <span className="pip p3" />
          <span className="pip p4" />
          <span className="pip p5" />
          <span className="pip p6" />
          <span className="pip p7" />
          <span className="pip p8" />
          <span className="pip p9" />
        </span>
      ))}
      {doubles && <em className="dice-tag">（双采）</em>}
      {bonusPending && <em className="dice-tag bonus">（赏一掷）</em>}
    </span>
  )
}