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
    <div className="w-full flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        rows={4}
        placeholder="Ask a question about this codebase..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isDisabled}
          className="rounded-lg bg-purple-600 px-4 py-2 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </div>
    </div>
  )
}
