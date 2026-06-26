import { useEffect, useState } from 'react'
import type { Repo } from './types'
import { useQuery } from './hooks/useQuery'
import { RepoSelector } from './components/RepoSelector'
import { QuestionInput } from './components/QuestionInput'
import { Answer } from './components/Answer'
import { ChunkList } from './components/ChunkList'
import { LoadingState } from './components/LoadingState'

function App() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [question, setQuestion] = useState('')

  const { answer, chunks, loading, error, submit } = useQuery()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/repos`)
      .then((res) => res.json())
      .then((data: Repo[]) => {
        setRepos(data)
        if (data.length > 0) {
          setSelectedRepo(data[0].id)
        }
      })
  }, [])

  const handleSubmit = () => {
    if (question.trim() === '') {
      return
    }
    submit(question, selectedRepo)
  }

  return (
    <div className="min-h-screen bg-paper map-grid border-t-[3px] border-rust">
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-8">
        <header className="flex items-start justify-between gap-4 pb-6 border-b border-line">
          <div className="flex flex-col gap-1">
            <h1 className="font-mono-display text-2xl font-bold text-ink">Cartographer</h1>
            <p className="font-sans-body text-sm text-ink-soft">Ask questions about TypeScript codebases</p>
          </div>
          <svg
            className="h-8 w-8 shrink-0 mt-1 text-rust"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" />
            <path d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <path d="M12 7.5L14.5 12L12 16.5L9.5 12L12 7.5Z" fill="currentColor" />
          </svg>
        </header>

        <RepoSelector repos={repos} selected={selectedRepo} onChange={setSelectedRepo} disabled={loading} />

        <QuestionInput
          value={question}
          onChange={setQuestion}
          onSubmit={handleSubmit}
          loading={loading}
          disabled={repos.length === 0}
        />

        {error && (
          <div className="rounded-md bg-rust/10 border border-rust/30 text-rust-dark text-sm px-3 py-2">
            {error}
          </div>
        )}

        {loading && <LoadingState />}

        <Answer answer={answer} />

        <ChunkList chunks={chunks} />

        <footer className="flex items-center gap-2 pt-2 font-mono-display text-[10px] uppercase tracking-widest text-ink-soft/70">
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
          <span>scale 1∶1 — local index</span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </footer>
      </div>
    </div>
  )
}

export default App
