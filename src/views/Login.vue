<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>出纳管理系统</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const formRef = ref()

const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }]
}

async function handleLogin() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const ok = await login(form.username, form.password)
    if (ok) {
      authStore.setAuthenticated(true)
      router.push('/')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; }
.login-card { width: 400px; max-width: 90%; padding: 20px; border-radius: 12px; }
h2 { text-align: center; margin-bottom: 24px; color: #409eff; }
</style>
