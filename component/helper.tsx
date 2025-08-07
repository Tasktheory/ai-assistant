import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

export default function MarkdownMessage({ content }: { content: string }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    const convertMarkdown = async () => {
      const raw = await marked.parse(content) // async parse
      const clean = DOMPurify.sanitize(raw)
      setHtml(clean)
    }

    convertMarkdown()
  }, [content])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
