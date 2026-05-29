import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import fs from 'fs'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const adminUsername = process.env.ADMIN_USERNAME
const adminPassword = process.env.ADMIN_PASSWORD

if (!supabaseUrl || !supabaseServiceKey || !adminUsername || !adminPassword) {
  console.error('Missing required env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initDatabase() {
  // 读取SQL文件（需要在项目中放置database-schema.sql）
  const sql = fs.readFileSync('./database-schema.sql', 'utf8')
  // 执行SQL（Supabase不支持多语句一次执行，简单拆分或使用rpc，这里简化假设表已存在，仅插入用户）
  // 实际生产可更严谨，但通常表手动创建一次，这里仅确保管理员存在
  console.log('Checking tables...')
  
  // 检查管理员用户
  const { data: existing } = await supabase
    .from('system_users')
    .select('id')
    .eq('username', adminUsername)
    .single()
  
  const passwordHash = crypto.createHash('sha256').update(adminPassword).digest('hex')
  
  if (!existing) {
    const { error } = await supabase
      .from('system_users')
      .insert({ username: adminUsername, password_hash: passwordHash })
    if (error) console.error('Insert admin error:', error)
    else console.log('Admin user created')
  } else {
    // 更新密码（可选）
    const { error } = await supabase
      .from('system_users')
      .update({ password_hash: passwordHash })
      .eq('username', adminUsername)
    if (error) console.error('Update admin error:', error)
    else console.log('Admin password updated')
  }
  
  // 确保至少有一个示例公司账户
  const { count } = await supabase
    .from('company_bank_accounts')
    .select('*', { count: 'exact', head: true })
  if (count === 0) {
    await supabase.from('company_bank_accounts').insert([
      { account_name: '基本户-对公', account_number: '6217****001', bank_name: '工商银行', account_type: 'public' },
      { account_name: '法人私户', account_number: '6212****888', bank_name: '招商银行', account_type: 'private' }
    ])
    console.log('Sample company accounts added')
  }
}

initDatabase().catch(console.error)
