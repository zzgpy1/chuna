<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-title">总付款金额</div>
          <div class="stat-value">{{ formatMoney(totalPaid) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-title">未付款金额</div>
          <div class="stat-value">{{ formatMoney(totalUnpaid) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-title">供应商数量</div>
          <div class="stat-value">{{ supplierCount }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-title">本月付款</div>
          <div class="stat-value">{{ formatMoney(monthPaid) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="recent-card" style="margin-top: 20px">
      <template #header>
        <span>最近付款记录</span>
      </template>
      <el-table :data="recentPayments" stripe v-loading="loading" style="width: 100%" :max-height="400">
        <el-table-column prop="order_date" label="日期" width="100" />
        <el-table-column prop="supplier_name" label="供应商" />
        <el-table-column prop="inbound_amount" label="入库金额" width="120" :formatter="moneyFormatter" />
        <el-table-column prop="paid_amount" label="实付金额" width="120" :formatter="moneyFormatter" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'paid' ? 'success' : 'danger'">{{ row.status === 'paid' ? '已付' : '未付' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/api/supabase'
import { ElMessage } from 'element-plus'

const totalPaid = ref(0)
const totalUnpaid = ref(0)
const supplierCount = ref(0)
const monthPaid = ref(0)
const recentPayments = ref([])
const loading = ref(false)

const formatMoney = (val) => `¥${val?.toFixed(2) || '0.00'}`

const moneyFormatter = (row, col, val) => formatMoney(val)

async function fetchStats() {
  loading.value = true
  try {
    // 总付款金额（已付订单的 paid_amount 总和）
    const { data: paidData, error: paidErr } = await supabase
      .from('payment_orders')
      .select('paid_amount')
      .eq('status', 'paid')
    if (paidErr) throw paidErr
    totalPaid.value = paidData.reduce((sum, p) => sum + (p.paid_amount || 0), 0)

    // 未付款金额（未付订单的 paid_amount 总和）
    const { data: unpaidData, error: unpaidErr } = await supabase
      .from('payment_orders')
      .select('paid_amount')
      .eq('status', 'unpaid')
    if (unpaidErr) throw unpaidErr
    totalUnpaid.value = unpaidData.reduce((sum, p) => sum + (p.paid_amount || 0), 0)

    // 供应商数量
    const { count, error: countErr } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
    if (countErr) throw countErr
    supplierCount.value = count || 0

    // 本月付款
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const start = `${year}-${month.toString().padStart(2,'0')}-01`
    const end = `${year}-${(month+1).toString().padStart(2,'0')}-01`
    const { data: monthData, error: monthErr } = await supabase
      .from('payment_orders')
      .select('paid_amount')
      .eq('status', 'paid')
      .gte('paid_at', start)
      .lt('paid_at', end)
    if (monthErr) throw monthErr
    monthPaid.value = monthData.reduce((sum, p) => sum + (p.paid_amount || 0), 0)

    // 最近付款记录（带供应商名称）
    const { data: recent, error: recentErr } = await supabase
      .from('payment_orders')
      .select(`
        id, order_date, inbound_amount, paid_amount, status, paid_at,
        suppliers ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    if (recentErr) throw recentErr
    recentPayments.value = recent.map(r => ({
      ...r,
      supplier_name: r.suppliers?.name || '-'
    }))
  } catch (err) {
    ElMessage.error('加载数据失败: ' + err.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  border-radius: 12px;
}
.stat-title {
  font-size: 14px;
  color: #909399;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
  color: #409eff;
}
.recent-card {
  border-radius: 12px;
}
@media (max-width: 768px) {
  .stat-value {
    font-size: 22px;
  }
}
</style>
