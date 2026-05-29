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
          <el-button type="primary" @click="fetchStats">查询</el-button>
        </el-form-item>
      </el-form>
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
import { ElMessage } from 'element-plus'

const suppliers = ref([])
const loading = ref(false)
const timeUnit = ref('month')
const dateValue = ref('')
const queryForm = ref({ supplier_id: null })
const totalAmount = ref(0)
const paymentCount = ref(0)
const details = ref([])

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

const formatMoney = (val) => `¥${val?.toFixed(2) || '0.00'}`
const moneyFormatter = (row, col, val) => formatMoney(val)

async function fetchSuppliers() {
  const { data } = await supabase.from('suppliers').select('id,name')
  suppliers.value = data || []
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
      suppliers ( name )
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
  } else {
    const total = data.reduce((sum, p) => sum + (p.paid_amount || 0), 0)
    totalAmount.value = total
    paymentCount.value = data.length
    
    // 按供应商分组
    const map = new Map()
    for (const p of data) {
      const name = p.suppliers?.name || '未知'
      if (!map.has(name)) {
        map.set(name, { supplier_name: name, paid_amount: 0, payment_count: 0 })
      }
      const item = map.get(name)
      item.paid_amount += p.paid_amount
      item.payment_count += 1
    }
    details.value = Array.from(map.values())
  }
  loading.value = false
}

onMounted(() => {
  fetchSuppliers()
  // 默认本月
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
