<template>
  <div class="accounts">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增账户</el-button>
    </div>
    <el-table :data="accounts" stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="account_name" label="账户名称" />
      <el-table-column prop="account_number" label="账号" />
      <el-table-column prop="bank_name" label="开户行" />
      <el-table-column prop="account_type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.account_type === 'public' ? 'primary' : 'success'">{{ row.account_type === 'public' ? '对公' : '私户' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.is_active" @change="toggleActive(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="deleteAccount(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="账户名称" prop="account_name">
          <el-input v-model="form.account_name" />
        </el-form-item>
        <el-form-item label="账号" prop="account_number">
          <el-input v-model="form.account_number" />
        </el-form-item>
        <el-form-item label="开户行" prop="bank_name">
          <el-input v-model="form.bank_name" />
        </el-form-item>
        <el-form-item label="账户类型" prop="account_type">
          <el-radio-group v-model="form.account_type">
            <el-radio label="public">对公账户</el-radio>
            <el-radio label="private">私用账户</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '@/api/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

const accounts = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增账户')
const formRef = ref()
const form = reactive({
  id: null,
  account_name: '',
  account_number: '',
  bank_name: '',
  account_type: 'public'
})
const rules = {
  account_name: [{ required: true, message: '请输入账户名称' }],
  account_number: [{ required: true, message: '请输入账号' }],
  account_type: [{ required: true, message: '请选择账户类型' }]
}

async function fetchAccounts() {
  loading.value = true
  const { data, error } = await supabase.from('company_bank_accounts').select('*').order('created_at', { ascending: false })
  if (error) ElMessage.error('加载失败: ' + error.message)
  else accounts.value = data || []
  loading.value = false
}

function openDialog(row = null) {
  if (row) {
    dialogTitle.value = '编辑账户'
    form.id = row.id
    form.account_name = row.account_name
    form.account_number = row.account_number
    form.bank_name = row.bank_name || ''
    form.account_type = row.account_type
  } else {
    dialogTitle.value = '新增账户'
    form.id = null
    form.account_name = ''
    form.account_number = ''
    form.bank_name = ''
    form.account_type = 'public'
  }
  dialogVisible.value = true
}

async function saveAccount() {
  await formRef.value?.validate()
  const dataToSave = {
    account_name: form.account_name,
    account_number: form.account_number,
    bank_name: form.bank_name,
    account_type: form.account_type,
    is_active: true
  }
  let error
  if (form.id) {
    const { error: updateErr } = await supabase.from('company_bank_accounts').update(dataToSave).eq('id', form.id)
    error = updateErr
  } else {
    const { error: insertErr } = await supabase.from('company_bank_accounts').insert([dataToSave])
    error = insertErr
  }
  if (error) ElMessage.error('保存失败: ' + error.message)
  else {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchAccounts()
  }
}

async function toggleActive(row) {
  const { error } = await supabase.from('company_bank_accounts').update({ is_active: row.is_active }).eq('id', row.id)
  if (error) {
    ElMessage.error('更新状态失败')
    row.is_active = !row.is_active
  }
}

async function deleteAccount(id) {
  ElMessageBox.confirm('删除后不可恢复，确认删除？', '警告', { type: 'warning' }).then(async () => {
    const { error } = await supabase.from('company_bank_accounts').delete().eq('id', id)
    if (error) ElMessage.error('删除失败: ' + error.message)
    else {
      ElMessage.success('删除成功')
      fetchAccounts()
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchAccounts()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
