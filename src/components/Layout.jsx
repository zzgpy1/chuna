import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase, isAdmin } from '../lib/supabase'
import MusicPlayer from './MusicPlayer'
import { SITE_CONFIG } from '../config'

export default function Layout() {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      checkAdmin(session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      checkAdmin(session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAdmin = async (user) => {
    if (user) {
      const adminStatus = await isAdmin()
      setAdmin(adminStatus)
    } else {
      setAdmin(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 头部导航 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition">
              {SITE_CONFIG.title}
            </Link>
            
            <div className="flex items-center gap-4">
              {admin && (
                <Link to="/admin" className="text-gray-600 hover:text-indigo-600 transition font-medium">
                  管理后台
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{user.email}</span>
                  <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 transition">
                    退出
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 transition">
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* 底部 */}
      <footer className="bg-white/50 border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 {SITE_CONFIG.title} · 用文字记录时光</p>
        </div>
      </footer>

      {/* 背景音乐 */}
      <MusicPlayer />
    </div>
  )
}
