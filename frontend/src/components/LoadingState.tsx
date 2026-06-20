import { useEffect, useState } from 'react'

const STAGES = [
  'Expanding your question',
  'Searching the codebase',
  'Reading matched sources',
  'Writing the answer',
] as const

export function LoadingState() {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev))
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 font-mono-display text-sm text-ink-soft">
      <span className="inline-block h-2 w-2 rounded-full bg-rust animate-pulse" />
      <span key={stageIndex} className="animate-fade-in">
        {STAGES[stageIndex]}
      </span>
    </div>
  )
}
