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
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
        Sources
      </h3>
      <ul className="flex flex-col gap-1">
        {chunks.map((chunk, i) => (
          <li
            key={`${chunk.filePath}-${chunk.startLine}-${i}`}
            className="flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm"
          >
            <span className="font-mono text-gray-800 truncate">{chunk.filePath}</span>
            <span className="text-gray-400 whitespace-nowrap">
              {chunk.startLine}–{chunk.endLine}
            </span>
            <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {chunk.type}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
