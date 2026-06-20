type QuestionInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
  disabled: boolean
}

export function QuestionInput({ value, onChange, onSubmit, loading, disabled }: QuestionInputProps) {
  const isDisabled = disabled || loading

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label
        htmlFor="question-input"
        className="font-mono-display text-xs uppercase tracking-widest text-ink-soft"
      >
        <span className="text-rust">§02</span> Query
      </label>
      <textarea
        id="question-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        rows={4}
        placeholder="Ask a question about this codebase..."
        className="w-full rounded-xl border border-line/60 bg-white px-3 py-2 font-sans-body text-ink shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-rust/40 focus:border-rust disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isDisabled}
          className="group rounded-lg bg-rust px-4 py-2 text-white font-mono-display text-sm tracking-wide transition-transform hover:bg-rust-dark active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? (
            'Thinking…'
          ) : (
            <span className="inline-flex items-center gap-1.5">
              Ask
              <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
