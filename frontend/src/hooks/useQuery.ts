import { useState } from 'react'
import type { Chunk, QueryResponse } from '../types'

export function useQuery() {
  const [answer, setAnswer] = useState('')
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (question: string, repoId: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, repoId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Request failed with status ${res.status}`)
      }

      const data: QueryResponse = await res.json()
      setAnswer(data.answer)
      setChunks(data.chunks)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return { answer, chunks, loading, error, submit }
}
