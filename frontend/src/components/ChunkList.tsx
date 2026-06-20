import type { Chunk } from '../types'

type ChunkListProps = {
  chunks: Chunk[]
}

export function ChunkList({ chunks }: ChunkListProps) {
  if (chunks.length === 0) {
    return null
  }

  return (
    <section className="w-full mt-2">
      <h3 className="flex items-center gap-1.5 text-xs font-mono-display uppercase tracking-widest text-ink-soft mb-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-rust" aria-hidden="true" />
        Sources
      </h3>
      <ul className="flex flex-col gap-1">
        {chunks.map((chunk, i) => (
          <li
            key={`${chunk.filePath}-${chunk.startLine}-${i}`}
            className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5 text-sm"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rust" aria-hidden="true" />
            <span className="font-mono-display text-ink truncate">{chunk.filePath}</span>
            <span className="text-ink-soft whitespace-nowrap">
              {chunk.startLine}–{chunk.endLine}
            </span>
            <span className="ml-auto shrink-0 rounded-full bg-sage/15 px-2 py-0.5 font-mono-display text-xs text-sage">
              {chunk.type}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
