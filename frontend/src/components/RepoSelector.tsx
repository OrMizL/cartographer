import type { Repo } from '../types'

type RepoSelectorProps = {
  repos: Repo[]
  selected: string
  onChange: (repoId: string) => void
  disabled: boolean
}

export function RepoSelector({ repos, selected, onChange, disabled }: RepoSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="repo-select"
        className="font-mono-display text-xs uppercase tracking-widest text-ink-soft"
      >
        <span className="text-rust">§01</span> Repository
      </label>
      <div className="relative">
        <select
          id="repo-select"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-line/60 bg-white px-3 py-2 pr-9 font-sans-body text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-rust/40 focus:border-rust disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {repos.map((repo) => (
            <option key={repo.id} value={repo.id} title={repo.description}>
              {repo.name}
              {repo.description ? ` — ${repo.description}` : ''}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-rust"
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}
