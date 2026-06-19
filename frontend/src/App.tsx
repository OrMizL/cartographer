import { useEffect, useState } from 'react'
import type { Repo } from './types'
import { useQuery } from './hooks/useQuery'
import { RepoSelector } from './components/RepoSelector'
import { QuestionInput } from './components/QuestionInput'
import { Answer } from './components/Answer'
import { ChunkList } from './components/ChunkList'

function App() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [question, setQuestion] = useState('')

  const { answer, chunks, loading, error, submit } = useQuery()

  useEffect(() => {
    fetch('/api/repos')
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
    <div className="min-h-screen bg-gray-900 flex justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 flex flex-col gap-5">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Cartographer</h1>
          <p className="text-sm text-gray-500 mt-1">Ask questions about TypeScript codebases</p>
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
          <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <Answer answer={answer} />

        <ChunkList chunks={chunks} />
      </div>
    </div>
  )
}

export default App
