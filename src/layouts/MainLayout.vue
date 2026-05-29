<template>
  <el-container class="layout-container">
    <el-aside :width="isMobile ? '0px' : '220px'" class="aside">
      <div class="logo">💰 出纳系统</div>
      <el-menu
        :collapse="isMobile"
        :default-active="activeMenu"
        router
        class="menu"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/suppliers">
          <el-icon><OfficeBuilding /></el-icon>
          <span>供应商管理</span>
        </el-menu-item>
        <el-menu-item index="/payments">
          <el-icon><Money /></el-icon>
          <span>付款记录</span>
        </el-menu-item>
        <el-menu-item index="/statistics">
          <el-icon><DataLine /></el-icon>
          <span>统计查询</span>
        </el-menu-item>
        <el-menu-item index="/accounts">
          <el-icon><CreditCard /></el-icon>
          <span>公司账户</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button :icon="isMobile ? Expand : Fold" @click="toggleSidebar" text />
          <span class="title">出纳管理系统</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              管理员 <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isMobile = ref(window.innerWidth <= 768)

const activeMenu = computed(() => route.path)

const toggleSidebar = () => {
  isMobile.value = !isMobile.value
}

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' }).then(() => {
      authStore.setAuthenticated(false)
      router.push('/login')
    }).catch(() => {})
  }
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow-x: hidden;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  background-color: #263445;
}
.menu {
  border-right: none;
  background-color: #304156;
}
.menu :deep(.el-menu-item) {
  color: #bfcbd9;
}
.menu :deep(.el-menu-item.is-active) {
  color: #409eff;
  background-color: #263445;
}
.header {
  background-color: white;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}
.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.main {
  background-color: #f5f7fa;
  padding: 20px;
}
@media (max-width: 768px) {
  .main {
    padding: 12px;
  }
  .logo {
    font-size: 14px;
  }
}
</style>
