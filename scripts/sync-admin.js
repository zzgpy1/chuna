import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const adminUsername = process.env.ADMIN_USERNAME
const adminPassword = process.env.ADMIN_PASSWORD

if (!supabaseUrl || !supabaseServiceKey || !adminUsername || !adminPassword) {
  console.error('Missing required env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncAdmin() {
  const passwordHash = crypto.createHash('sha256').update(adminPassword).digest('hex')
  
  // Upsert admin
  const { error: upsertError } = await supabase
    .from('system_users')
    .upsert({ username: adminUsername, password_hash: passwordHash }, { onConflict: 'username' })
  
  if (upsertError) {
    console.error('Admin user upsert error:', upsertError)
  } else {
    console.log('Admin user ensured')
  }
  
  // Check if sample company accounts exist
  const { count, error: countError } = await supabase
    .from('company_bank_accounts')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('Error checking company accounts:', countError)
  } else if (count === 0) {
    const { error: insertError } = await supabase
      .from('company_bank_accounts')
      .insert([
        { account_name: '基本户-对公', account_number: '6217****001', bank_name: '工商银行', account_type: 'public' },
        { account_name: '法人私户', account_number: '6212****888', bank_name: '招商银行', account_type: 'private' }
      ])
    if (insertError) {
      console.error('Insert sample accounts error:', insertError)
    } else {
      console.log('Sample company accounts added')
    }
  } else {
    console.log('Company accounts already exist')
  }
}

syncAdmin().catch(console.error)
