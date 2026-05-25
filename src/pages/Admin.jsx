import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取文章失败:', error)
    } else {
      setPosts(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) return
    
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert('删除失败: ' + error.message)
    } else {
      setPosts(posts.filter(p => p.id !== id))
    }
  }

  const handleTogglePublish = async (id, currentStatus) => {
    const { error } = await supabase
      .from('articles')
      .update({ published: !currentStatus })
      .eq('id', id)
    
    if (error) {
      alert('更新失败: ' + error.message)
    } else {
      setPosts(posts.map(p => 
        p.id === id ? { ...p, published: !currentStatus } : p
      ))
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">文章管理</h1>
        <Link to="/admin/new" className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          写新文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <p className="text-gray-400">暂无文章，点击"写新文章"开始创作</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">标题</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">发布日期</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">阅读量</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">状态</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <Link to={`/post/${post.slug}`} target="_blank" className="text-indigo-600 hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">{formatDate(post.created_at)}</td>
                  <td className="py-3 px-4 text-center text-gray-500">{post.view_count || 0}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {post.published ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-2">
                      <Link to={`/admin/edit/${post.id}`} className="text-blue-500 hover:text-blue-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button onClick={() => handleTogglePublish(post.id, post.published)} className="text-yellow-500 hover:text-yellow-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
