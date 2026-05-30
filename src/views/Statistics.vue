<template>
  <div class="statistics">
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryForm">
        <el-form-item label="时间范围">
          <el-radio-group v-model="timeUnit">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
            <el-radio-button label="year">年</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择日期">
          <el-date-picker
            v-model="dateValue"
            :type="dateType"
            :format="dateFormat"
            :value-format="valueFormat"
            placeholder="选择日期"
          />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="queryForm.supplier_id" placeholder="全部供应商" clearable filterable style="width: 200px">
            <el-option v-for="sup in suppliers" :key="sup.id" :label="sup.name" :value="sup.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchStats">查询统计</el-button>
          <el-button type="success" @click="exportDetails" :disabled="!details.length">导出明细CSV</el-button>
          <el-button type="warning" @click="triggerImport">📂 导入CSV</el-button>
        </el-form-item>
      </el-form>
      <input
        type="file"
        ref="fileInput"
        accept=".csv"
        style="display: none"
        @change="handleImport"
      />
    </el-card>

    <el-card class="result-card" style="margin-top: 20px">
      <template #header>
        <span>付款总额统计</span>
      </template>
      <div class="stats-result">
        <div class="total-amount">¥ {{ totalAmount.toFixed(2) }}</div>
        <div class="sub-info">共 {{ paymentCount }} 笔付款</div>
      </div>
      <el-table :data="details" stripe v-loading="loading" style="margin-top: 20px">
        <el-table-column prop="supplier_name" label="供应商" />
        <el-table-column prop="paid_amount" label="付款金额" :formatter="moneyFormatter" />
        <el-table-column prop="payment_count" label="笔数" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/api/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

const suppliers = ref([])
const loading = ref(false)
const timeUnit = ref('month')
const dateValue = ref('')
const queryForm = ref({ supplier_id: null })
const totalAmount = ref(0)
const paymentCount = ref(0)
const details = ref([])         // 分组汇总结果
let currentDetailRecords = []   // 存储当前查询到的原始付款记录（用于导出）

// 导入相关
const fileInput = ref(null)
let companyAccounts = ref([])   // 存储公司账户列表，用于导入时选择默认账户

const dateType = computed(() => {
  if (timeUnit.value === 'day') return 'date'
  if (timeUnit.value === 'month') return 'month'
  return 'year'
})
const dateFormat = computed(() => {
  if (timeUnit.value === 'day') return 'YYYY-MM-DD'
  if (timeUnit.value === 'month') return 'YYYY-MM'
  return 'YYYY'
})
const valueFormat = computed(() => {
  if (timeUnit.value === 'day') return 'YYYY-MM-DD'
  if (timeUnit.value === 'month') return 'YYYY-MM'
  return 'YYYY'
})

const formatMoney = (val) => `¥${(val || 0).toFixed(2)}`
const moneyFormatter = (row, col, val) => formatMoney(val)

async function fetchSuppliers() {
  const { data } = await supabase.from('suppliers').select('id,name')
  suppliers.value = data || []
}

// 获取启用的公司账户（用于导入时默认使用第一个）
async function fetchCompanyAccounts() {
  const { data } = await supabase
    .from('company_bank_accounts')
    .select('id,account_name,account_number')
    .eq('is_active', true)
  companyAccounts.value = data || []
}

async function fetchStats() {
  if (!dateValue.value) {
    ElMessage.warning('请先选择日期')
    return
  }
  loading.value = true
  let startDate, endDate
  if (timeUnit.value === 'day') {
    startDate = dateValue.value
    endDate = dateValue.value
  } else if (timeUnit.value === 'month') {
    startDate = `${dateValue.value}-01`
    const nextMonth = new Date(startDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    endDate = nextMonth.toISOString().slice(0,10)
  } else {
    startDate = `${dateValue.value}-01-01`
    endDate = `${dateValue.value}-12-31`
  }
  
  let query = supabase
    .from('payment_orders')
    .select(`
      paid_amount,
      supplier_id,
      suppliers ( name ),
      order_date,
      inbound_amount,
      payment_type,
      status,
      paid_at,
      notes
    `)
    .eq('status', 'paid')
    .gte('paid_at', startDate)
    .lte('paid_at', endDate)
  
  if (queryForm.value.supplier_id) {
    query = query.eq('supplier_id', queryForm.value.supplier_id)
  }
  
  const { data, error } = await query
  if (error) {
    ElMessage.error('查询失败: ' + error.message)
    loading.value = false
    return
  }
  currentDetailRecords = data || []
  const total = currentDetailRecords.reduce((sum, p) => sum + (p.paid_amount || 0), 0)
  totalAmount.value = total
  paymentCount.value = currentDetailRecords.length
  
  const map = new Map()
  for (const p of currentDetailRecords) {
    const name = p.suppliers?.name || '未知'
    if (!map.has(name)) {
      map.set(name, { supplier_name: name, paid_amount: 0, payment_count: 0 })
    }
    const item = map.get(name)
    item.paid_amount += p.paid_amount
    item.payment_count += 1
  }
  details.value = Array.from(map.values())
  loading.value = false
}

// 导出当前查询到的原始付款明细
function exportDetails() {
  if (!currentDetailRecords.length) {
    ElMessage.warning('没有可导出的数据，请先进行查询')
    return
  }
  const headers = ['日期', '供应商', '入库金额', '实付金额', '付款类型', '状态', '付款时间', '备注']
  const rows = currentDetailRecords.map(p => [
    p.order_date || '',
    p.suppliers?.name || '-',
    p.inbound_amount || 0,
    p.paid_amount || 0,
    p.payment_type === 'prepay' ? '预付款' : '后付款',
    p.status === 'paid' ? '已付款' : '未付款',
    p.paid_at || '',
    p.notes || ''
  ])
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.setAttribute('download', `payment_export_${new Date().toISOString().slice(0,19)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 触发文件选择
function triggerImport() {
  fileInput.value.click()
}

// 处理导入CSV
async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 确保有公司账户可用
  if (!companyAccounts.value.length) {
    ElMessage.error('请先在“公司账户”页面添加并启用至少一个付款账户')
    fileInput.value.value = ''
    return
  }
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    const content = e.target.result
    const lines = content.trim().split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) {
      ElMessage.warning('CSV 文件至少包含标题行和一行数据')
      return
    }
    // 跳过标题行（假设第一行为标题）
    const dataRows = lines.slice(1)
    const newRecords = []
    for (const line of dataRows) {
      // 简单解析 CSV（支持引号内逗号）
      const parts = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)
      if (!parts || parts.length < 6) continue
      const clean = parts.map(p => p.replace(/^"|"$/g, '').replace(/""/g, '"'))
      // 期望列：日期,供应商,入库金额,实付金额,付款类型,状态,付款时间,备注
      const [order_date, supplierName, inbound_amount, paid_amount, paymentTypeText, statusText, paid_at, notes] = clean
      // 查找供应商 ID
      const supplier = suppliers.value.find(s => s.name === supplierName)
      if (!supplier) {
        console.warn(`未找到供应商: ${supplierName}，跳过该行`)
        continue
      }
      const payment_type = paymentTypeText === '预付款' ? 'prepay' : 'postpay'
      const status = statusText === '已付款' ? 'paid' : 'unpaid'
      // 默认使用第一个启用账户（简单处理）
      const defaultAccount = companyAccounts.value[0]
      newRecords.push({
        supplier_id: supplier.id,
        inbound_amount: parseFloat(inbound_amount) || 0,
        paid_amount: parseFloat(paid_amount) || 0,
        payment_type,
        company_account_id: defaultAccount.id,
        notes: notes || '',
        status,
        order_date: order_date || new Date().toISOString().slice(0,10),
        paid_at: status === 'paid' ? (paid_at || new Date().toISOString()) : null
      })
    }
    if (!newRecords.length) {
      ElMessage.warning('没有有效的记录可导入，请检查CSV格式和供应商名称是否匹配')
      return
    }
    // 批量插入
    const { error } = await supabase.from('payment_orders').insert(newRecords)
    if (error) {
      ElMessage.error('导入失败: ' + error.message)
    } else {
      ElMessage.success(`成功导入 ${newRecords.length} 条付款记录`)
      // 导入成功后，若当前有查询条件，自动刷新统计（可选）
      if (dateValue.value) {
        fetchStats()
      }
    }
    // 清空 file input，以便再次导入同一个文件
    fileInput.value.value = ''
  }
  reader.readAsText(file, 'UTF-8')
}

onMounted(async () => {
  await fetchSuppliers()
  await fetchCompanyAccounts()
  const now = new Date()
  dateValue.value = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}`
  fetchStats()
})
</script>

<style scoped>
.stats-result {
  text-align: center;
  padding: 20px;
}
.total-amount {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
}
.sub-info {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
.filter-card :deep(.el-form-item) {
  margin-bottom: 12px;
}
@media (max-width: 768px) {
  .filter-card :deep(.el-form--inline) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .total-amount {
    font-size: 28px;
  }
}
</style>
