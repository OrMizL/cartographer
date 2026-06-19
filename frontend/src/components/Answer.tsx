import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Components } from 'react-markdown'

type AnswerProps = {
  answer: string
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? '')
    const code = String(children).replace(/\n$/, '')

    if (!match) {
      return (
        <code className={className} {...props}>
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
    <div className="w-full rounded-lg bg-gray-50 p-4">
      <ReactMarkdown components={components}>{answer}</ReactMarkdown>
    </div>
  )
}
