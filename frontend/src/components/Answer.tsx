import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Components } from 'react-markdown'

type AnswerProps = {
  answer: string
}

const components: Components = {
  h1: ({ children }) => <h1 className="text-xl font-bold text-ink mt-6 mb-3 font-sans-body">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold text-ink mt-5 mb-2 font-sans-body">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-bold text-ink mt-4 mb-2 font-sans-body">{children}</h3>,
  p: ({ children }) => <p className="text-ink leading-relaxed mb-3">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-ink">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? '')
    const code = String(children).replace(/\n$/, '')

    if (!match) {
      return (
        <code
          className="bg-sage/10 text-rust-dark px-1.5 py-0.5 rounded font-mono-display text-sm"
          {...props}
        >
          {code}
        </code>
      )
    }

    return (
      <SyntaxHighlighter language={match[1]} style={oneDark} PreTag="div">
        {code}
      </SyntaxHighlighter>
    )
  },
}

export function Answer({ answer }: AnswerProps) {
  if (answer === '') {
    return null
  }

  return (
    <div className="w-full rounded-xl bg-white border border-line/60 border-l-2 border-l-rust shadow-sm p-4 font-sans-body text-ink">
      <div className="flex items-center gap-1.5 font-mono-display text-xs uppercase tracking-widest text-ink-soft mb-3 pb-3 border-b border-line/60">
        <span className="h-1.5 w-1.5 rounded-full bg-rust" aria-hidden="true" />
        Findings
      </div>
      <ReactMarkdown components={components}>{answer}</ReactMarkdown>
    </div>
  )
}
