import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownEditor({ value, onChange, placeholder = '使用 Markdown 编写内容...' }) {
  const [preview, setPreview] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="flex border-b bg-gray-50">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`px-4 py-2 text-sm font-medium transition ${!preview ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          编辑
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`px-4 py-2 text-sm font-medium transition ${preview ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          预览
        </button>
      </div>
      
      {!preview ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={20}
          className="w-full p-4 font-mono text-sm focus:outline-none resize-y"
        />
      ) : (
        <div className="p-6 prose max-w-none min-h-[400px] overflow-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || '*暂无内容*'}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
