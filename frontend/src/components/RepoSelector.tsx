import type { Repo } from '../types'

type RepoSelectorProps = {
  repos: Repo[]
  selected: string
  onChange: (repoId: string) => void
  disabled: boolean
}

export function RepoSelector({ repos, selected, onChange, disabled }: RepoSelectorProps) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {repos.map((repo) => (
        <option key={repo.id} value={repo.id} title={repo.description}>
          {repo.name}
          {repo.description ? ` — ${repo.description}` : ''}
        </option>
      ))}
    </select>
  )
}
