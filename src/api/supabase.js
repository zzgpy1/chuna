import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 登录验证（调用数据库函数）
export async function login(username, password) {
  const { data, error } = await supabase.rpc('authenticate_user', {
    p_username: username,
    p_password: password
  })
  if (error) throw new Error(error.message)
  return data === true
}
