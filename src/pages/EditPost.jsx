import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, generateSlug } from '../lib/supabase'
import MarkdownEditor from '../components/MarkdownEditor'

export default function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    published: false
  })

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      alert('加载文章失败')
      navigate('/admin')
    } else if (data) {
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        published: data.published || false
      })
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const autoGenerateSlug = () => {
    if (formData.title) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.title)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('请填写标题')
      return
    }
    if (!formData.content.trim()) {
      alert('请填写内容')
      return
    }
    
    let slug = formData.slug.trim()
    if (!slug) {
      slug = generateSlug(formData.title)
    }
    
    setSaving(true)
    
    const now = new Date().toISOString()
    const postData = {
      title: formData.title.trim(),
      slug: slug,
      content: formData.content,
      published: formData.published,
      updated_at: now
    }
    
    let result
    if (id && id !== 'new') {
      // 更新
      result = await supabase
        .from('articles')
        .update(postData)
        .eq('id', id)
    } else {
      // 新建
      postData.created_at = now
      postData.view_count = 0
      result = await supabase
        .from('articles')
        .insert([postData])
    }
    
    if (result.error) {
      alert('保存失败: ' + result.error.message)
    } else {
      navigate('/admin')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回管理
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {id && id !== 'new' ? '编辑文章' : '发布新文章'}
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">标题 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="请输入文章标题"
              required
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 font-medium">URL 标识 (Slug)</label>
              <button type="button" onClick={autoGenerateSlug} className="text-sm text-indigo-600 hover:text-indigo-800">
                根据标题生成
              </button>
            </div>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="例如: my-first-article"
            />
            <p className="text-xs text-gray-400 mt-1">留空将自动生成，只能包含字母、数字和连字符</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">内容 * (支持 Markdown)</label>
            <MarkdownEditor
              value={formData.content}
              onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
              placeholder="开始书写你的思想..."
            />
          </div>
          
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">立即发布（公开可见）</span>
            </label>
          </div>
          
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary px-6">
              {saving ? '保存中...' : '保存文章'}
            </button>
            <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
