<template>
  <div class="suppliers">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增供应商</el-button>
    </div>
    <el-table :data="suppliers" stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="name" label="供应商名称" />
      <el-table-column prop="products_note" label="供应产品" show-overflow-tooltip />
      <el-table-column label="收款账户" width="200">
        <template #default="{ row }">
          <el-tag v-for="(acc, idx) in row.accounts" :key="idx" size="small" style="margin:2px">{{ acc.accountName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="deleteSupplier(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="供应产品" prop="products_note">
          <el-input v-model="form.products_note" type="textarea" rows="2" />
        </el-form-item>
        <el-form-item label="收款账户列表">
          <div v-for="(acc, idx) in form.accounts" :key="idx" class="account-item">
            <el-input v-model="acc.accountName" placeholder="账户名称" style="width: 140px; margin-right: 8px" />
            <el-input v-model="acc.accountNumber" placeholder="账号" style="width: 180px; margin-right: 8px" />
            <el-input v-model="acc.bank" placeholder="开户行" style="width: 160px; margin-right: 8px" />
            <el-select v-model="acc.type" placeholder="类型" style="width: 100px; margin-right: 8px">
              <el-option label="对公" value="public" />
              <el-option label="私户" value="private" />
            </el-select>
            <el-button type="danger" :icon="Delete" circle @click="removeAccount(idx)" />
          </div>
          <el-button type="primary" link @click="addAccount">+ 添加收款账户</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSupplier">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '@/api/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const suppliers = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增供应商')
const formRef = ref()
const form = reactive({
  id: null,
  name: '',
  products_note: '',
  accounts: []
})

const rules = {
  name: [{ required: true, message: '请输入供应商名称' }]
}

const addAccount = () => {
  form.accounts.push({ accountName: '', accountNumber: '', bank: '', type: 'public' })
}
const removeAccount = (idx) => {
  form.accounts.splice(idx, 1)
}

async function fetchSuppliers() {
  loading.value = true
  const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
  if (error) ElMessage.error('加载失败: ' + error.message)
  else suppliers.value = data || []
  loading.value = false
}

function openDialog(row = null) {
  if (row) {
    dialogTitle.value = '编辑供应商'
    form.id = row.id
    form.name = row.name
    form.products_note = row.products_note || ''
    form.accounts = row.accounts ? JSON.parse(JSON.stringify(row.accounts)) : []
  } else {
    dialogTitle.value = '新增供应商'
    form.id = null
    form.name = ''
    form.products_note = ''
    form.accounts = []
  }
  dialogVisible.value = true
}

async function saveSupplier() {
  await formRef.value?.validate()
  const dataToSave = {
    name: form.name,
    products_note: form.products_note,
    accounts: form.accounts
  }
  let error
  if (form.id) {
    const { error: updateErr } = await supabase.from('suppliers').update(dataToSave).eq('id', form.id)
    error = updateErr
  } else {
    const { error: insertErr } = await supabase.from('suppliers').insert([dataToSave])
    error = insertErr
  }
  if (error) {
    ElMessage.error('保存失败: ' + error.message)
  } else {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchSuppliers()
  }
}

async function deleteSupplier(id) {
  ElMessageBox.confirm('删除后不可恢复，确认删除？', '警告', { type: 'warning' }).then(async () => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) ElMessage.error('删除失败: ' + error.message)
    else {
      ElMessage.success('删除成功')
      fetchSuppliers()
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchSuppliers()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
.account-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 768px) {
  .account-item {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
