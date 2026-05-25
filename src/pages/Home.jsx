import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, created_at, view_count, content')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取文章失败:', error)
    } else {
      // 为每篇文章生成摘要（取纯文本前150字符）
      const postsWithExcerpt = data.map(post => {
        const plainText = post.content?.replace(/[#*`>\[\]()！？。，、；：“”‘’\n]/g, ' ').substring(0, 150)
        return { ...post, excerpt: plainText + (plainText?.length >= 150 ? '...' : '') }
      })
      setPosts(postsWithExcerpt)
    }
    setLoading(false)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          笔墨生花
        </h1>
        <p className="text-gray-500 text-lg">记录思考，分享生活，在文字中相遇</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-2xl">
          <p className="text-gray-400">暂无文章，敬请期待~</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl shadow-md card-hover overflow-hidden border border-gray-100">
              <Link to={`/post/${post.slug}`} className="block p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 hover:text-indigo-600 transition mb-3">
                  {post.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(post.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {post.view_count || 0} 次阅读
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed line-clamp-3">
                  {post.excerpt || '暂无摘要...'}
                </p>
                <div className="mt-4 text-indigo-600 font-medium inline-flex items-center gap-1">
                  阅读全文
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
