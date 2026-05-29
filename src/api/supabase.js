import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 登录验证
export async function login(username, password) {
  const { data, error } = await supabase.rpc('authenticate_user', {
    p_username: username,
    p_password: password
  })
  if (error) throw new Error(error.message)
  return data === true
}

// 通用查询辅助（可选）
export const db = {
  // 供应商
  suppliers: () => supabase.from('suppliers'),
  // 付款记录
  payments: () => supabase.from('payment_orders'),
  // 公司账户
  companyAccounts: () => supabase.from('company_bank_accounts')
}
