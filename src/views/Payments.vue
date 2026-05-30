<template>
  <div class="payments">
    <!-- 工具栏：新增 + 导出/导入/清除 -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreateDialog">➕ 新增付款单</el-button>
      <el-button type="success" @click="exportToCSV" :disabled="!payments.length">📎 导出CSV</el-button>
      <el-button type="warning" @click="triggerImport">📂 导入CSV</el-button>
      <el-button type="danger" @click="clearAllData" plain>⚠️ 清除所有数据</el-button>
      <el-select
        v-model="statusFilter"
        placeholder="状态筛选"
        clearable
        style="width: 120px; margin-left: 12px"
      >
        <el-option label="未付款" value="unpaid" />
        <el-option label="已付款" value="paid" />
      </el-select>
      <!-- 隐藏的文件上传 input，用于导入 -->
      <input
        type="file"
        ref="fileInput"
        accept=".csv"
        style="display: none"
        @change="handleImport"
      />
    </div>

    <!-- 付款记录表格 -->
    <el-table
      :data="filteredPayments"
      stripe
      v-loading="loading"
      style="width: 100%"
      :max-height="600"
    >
      <el-table-column prop="order_date" label="日期" width="100" />
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column
        prop="inbound_amount"
        label="入库金额"
        width="120"
        :formatter="moneyFormatter"
      />
      <el-table-column
        prop="paid_amount"
        label="实付金额"
        width="120"
        :formatter="moneyFormatter"
      />
      <el-table-column prop="payment_type" label="付款类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.payment_type === 'prepay' ? 'info' : 'success'">
            {{ row.payment_type === 'prepay' ? '预付款' : '后付款' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'paid' ? 'success' : 'danger'">
            {{ row.status === 'paid' ? '已付' : '未付' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="deletePayment(row.id)">删除</el-button>
          <el-button
            v-if="row.status === 'unpaid'"
            link
            type="success"
            @click="openConfirmDialog(row)"
          >确认打款</el-button>
          <el-button link type="info" @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗（复用） -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="550px"
      @close="resetForm"
    >
      <el-form
        :model="paymentForm"
        :rules="paymentRules"
        ref="paymentFormRef"
        label-width="100px"
      >
        <el-form-item label="供应商" prop="supplier_id">
          <el-select
            v-model="paymentForm.supplier_id"
            placeholder="请选择供应商"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="sup in suppliers"
              :key="sup.id"
              :label="sup.name"
              :value="sup.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入库金额" prop="inbound_amount">
          <el-input-number
            v-model="paymentForm.inbound_amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="实付金额" prop="paid_amount">
          <el-input-number
            v-model="paymentForm.paid_amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="付款类型" prop="payment_type">
          <el-radio-group v-model="paymentForm.payment_type">
            <el-radio label="prepay">预付款</el-radio>
            <el-radio label="postpay">后付款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="公司账户" prop="company_account_id">
          <el-select
            v-model="paymentForm.company_account_id"
            placeholder="请选择付款账户"
            style="width: 100%"
          >
            <el-option
              v-for="acc in companyAccounts"
              :key="acc.id"
              :label="`${acc.account_name} (${acc.account_number})`"
              :value="acc.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="paymentForm.notes" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePayment">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗（不变） -->
    <el-dialog v-model="detailVisible" title="付款单详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="日期">{{ detail.order_date }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detail.supplier_name }}</el-descriptions-item>
        <el-descriptions-item label="入库金额">{{ formatMoney(detail.inbound_amount) }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">{{ formatMoney(detail.paid_amount) }}</el-descriptions-item>
        <el-descriptions-item label="付款类型">{{ detail.payment_type === 'prepay' ? '预付款' : '后付款' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status === 'paid' ? '已付款' : '未付款' }}</el-descriptions-item>
        <el-descriptions-item label="付款时间">{{ detail.paid_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '@/api/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

// ---------- 数据 ----------
const payments = ref([])
const suppliers = ref([])
const companyAccounts = ref([])
const loading = ref(false)
const statusFilter = ref('')

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增付款单')
const paymentFormRef = ref()
const paymentForm = reactive({
  id: null,
  supplier_id: null,
  inbound_amount: 0,
  paid_amount: 0,
  payment_type: 'postpay',
  company_account_id: null,
  notes: ''
})
const paymentRules = {
  supplier_id: [{ required: true, message: '请选择供应商' }],
  inbound_amount: [{ required: true, message: '请输入入库金额' }],
  paid_amount: [{ required: true, message: '请输入实付金额' }],
  company_account_id: [{ required: true, message: '请选择公司账户' }]
}

// 详情弹窗
const detailVisible = ref(false)
const detail = ref({})

// 文件导入ref
const fileInput = ref(null)

// ---------- 辅助函数 ----------
const formatMoney = (val) => `¥${(val || 0).toFixed(2)}`
const moneyFormatter = (row, col, val) => formatMoney(val)

const filteredPayments = computed(() => {
  if (!statusFilter.value) return payments.value
  return payments.value.filter(p => p.status === statusFilter.value)
})

// ---------- API 交互 ----------
async function fetchPayments() {
  loading.value = true
  const { data, error } = await supabase
    .from('payment_orders')
    .select(`
      *,
      suppliers ( name )
    `)
    .order('order_date', { ascending: false })
  if (error) {
    ElMessage.error('加载付款记录失败: ' + error.message)
  } else {
    payments.value = data.map(p => ({
      ...p,
      supplier_name: p.suppliers?.name || '-'
    }))
  }
  loading.value = false
}

async function fetchSuppliersAndAccounts() {
  const [supRes, accRes] = await Promise.all([
    supabase.from('suppliers').select('id,name'),
    supabase.from('company_bank_accounts').select('id,account_name,account_number').eq('is_active', true)
  ])
  if (supRes.error) ElMessage.error('加载供应商失败: ' + supRes.error.message)
  else suppliers.value = supRes.data || []
  if (accRes.error) ElMessage.error('加载公司账户失败: ' + accRes.error.message)
  else companyAccounts.value = accRes.data || []
}

function resetForm() {
  paymentForm.id = null
  paymentForm.supplier_id = null
  paymentForm.inbound_amount = 0
  paymentForm.paid_amount = 0
  paymentForm.payment_type = 'postpay'
  paymentForm.company_account_id = null
  paymentForm.notes = ''
  if (paymentFormRef.value) paymentFormRef.value.resetFields()
}

function openCreateDialog() {
  dialogTitle.value = '新增付款单'
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑付款单'
  paymentForm.id = row.id
  paymentForm.supplier_id = row.supplier_id
  paymentForm.inbound_amount = row.inbound_amount
  paymentForm.paid_amount = row.paid_amount
  paymentForm.payment_type = row.payment_type
  paymentForm.company_account_id = row.company_account_id
  paymentForm.notes = row.notes || ''
  dialogVisible.value = true
}

async function savePayment() {
  try {
    await paymentFormRef.value?.validate()
  } catch {
    return
  }
  const dataToSave = {
    supplier_id: paymentForm.supplier_id,
    inbound_amount: paymentForm.inbound_amount,
    paid_amount: paymentForm.paid_amount,
    payment_type: paymentForm.payment_type,
    company_account_id: paymentForm.company_account_id,
    notes: paymentForm.notes,
    status: 'unpaid'   // 编辑时保留原有状态，新增时默认未付
  }
  let error
  if (paymentForm.id) {
    // 编辑：保留原有 status 和 paid_at 不变
    const current = payments.value.find(p => p.id === paymentForm.id)
    dataToSave.status = current?.status || 'unpaid'
    if (current?.status === 'paid') dataToSave.paid_at = current.paid_at
    const { error: updateErr } = await supabase
      .from('payment_orders')
      .update(dataToSave)
      .eq('id', paymentForm.id)
    error = updateErr
  } else {
    const { error: insertErr } = await supabase
      .from('payment_orders')
      .insert([dataToSave])
    error = insertErr
  }
  if (error) {
    ElMessage.error('保存失败: ' + error.message)
  } else {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchPayments()
  }
}

// 删除记录
async function deletePayment(id) {
  ElMessageBox.confirm('删除后不可恢复，确认删除该付款记录？', '警告', {
    type: 'warning',
    confirmButtonText: '确认删除'
  }).then(async () => {
    const { error } = await supabase.from('payment_orders').delete().eq('id', id)
    if (error) {
      ElMessage.error('删除失败: ' + error.message)
    } else {
      ElMessage.success('删除成功')
      fetchPayments()
    }
  }).catch(() => {})
}

// 确认打款
function openConfirmDialog(row) {
  ElMessageBox.confirm(
    `确认已向 ${row.supplier_name} 支付 ${formatMoney(row.paid_amount)} 元？`,
    '确认打款',
    {
      type: 'info',
      confirmButtonText: '确认打款'
    }
  ).then(async () => {
    const { error } = await supabase
      .from('payment_orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', row.id)
    if (error) {
      ElMessage.error('打款确认失败: ' + error.message)
    } else {
      ElMessage.success('打款确认成功')
      fetchPayments()
    }
  }).catch(() => {})
}

function viewDetail(row) {
  detail.value = row
  detailVisible.value = true
}

// ---------- 导入导出功能 ----------
function exportToCSV() {
  // 准备 CSV 数据（基于当前过滤后的数据，也可全部导出）
  const dataToExport = filteredPayments.value.length ? filteredPayments.value : payments.value
  if (!dataToExport.length) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  // 定义 CSV 列头（中文）
  const headers = [
    '日期', '供应商', '入库金额', '实付金额', '付款类型', '状态', '付款时间', '备注'
  ]
  const rows = dataToExport.map(p => [
    p.order_date,
    p.supplier_name,
    p.inbound_amount,
    p.paid_amount,
    p.payment_type === 'prepay' ? '预付款' : '后付款',
    p.status === 'paid' ? '已付款' : '未付款',
    p.paid_at || '',
    p.notes || ''
  ])
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  // 添加 BOM 以支持中文 Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.setAttribute('download', `payment_records_${new Date().toISOString().slice(0,19)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function triggerImport() {
  fileInput.value.click()
}

async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const content = e.target.result
    // 解析 CSV（简单按行和逗号分割，忽略 BOM）
    const lines = content.trim().split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) {
      ElMessage.warning('CSV 文件至少包含标题行和一行数据')
      return
    }
    // 跳过标题行，从第二行开始解析
    const dataRows = lines.slice(1)
    const newRecords = []
    for (const line of dataRows) {
      const parts = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) // 简单处理引号
      if (!parts || parts.length < 6) continue
      const clean = parts.map(p => p.replace(/^"|"$/g, '').replace(/""/g, '"'))
      const [
        order_date, supplierName, inbound_amount, paid_amount, paymentTypeText, statusText, paid_at, notes
      ] = clean
      // 查找供应商 ID（根据名称匹配）
      const supplier = suppliers.value.find(s => s.name === supplierName)
      if (!supplier) {
        console.warn(`未找到供应商: ${supplierName}`)
        continue
      }
      // 查找公司账户（这里先默认使用第一个启用账户，实际可优化）
      const defaultAccount = companyAccounts.value[0]
      if (!defaultAccount) {
        ElMessage.error('请先配置公司账户')
        return
      }
      const payment_type = paymentTypeText === '预付款' ? 'prepay' : 'postpay'
      const status = statusText === '已付款' ? 'paid' : 'unpaid'
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
      ElMessage.warning('没有有效的记录可导入')
      return
    }
    // 批量插入
    const { error } = await supabase.from('payment_orders').insert(newRecords)
    if (error) {
      ElMessage.error('导入失败: ' + error.message)
    } else {
      ElMessage.success(`成功导入 ${newRecords.length} 条记录`)
      fetchPayments()
    }
    // 清空 file input
    fileInput.value.value = ''
  }
  reader.readAsText(file, 'UTF-8')
}

// 清除所有数据（危险操作，需二次确认）
async function clearAllData() {
  ElMessageBox.confirm(
    '⚠️ 此操作将删除所有付款记录，不可恢复！确认清除吗？',
    '危险操作',
    {
      type: 'error',
      confirmButtonText: '确认清除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    const { error } = await supabase.from('payment_orders').delete().neq('id', 0) // 删除所有
    if (error) {
      ElMessage.error('清除失败: ' + error.message)
    } else {
      ElMessage.success('已清除所有付款记录')
      fetchPayments()
    }
  }).catch(() => {})
}

// ---------- 生命周期 ----------
onMounted(() => {
  fetchPayments()
  fetchSuppliersAndAccounts()
})
</script>

<style scoped>
.payments {
  padding: 0;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar .el-select {
    margin-left: 0 !important;
    width: 100% !important;
  }
}
</style>
