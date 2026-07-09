<template>
  <el-container class="main-layout">
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#4f6ef7"><Cpu /></el-icon>
        <span>HR AI 平台</span>
      </div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#1a1f36"
        text-color="#a0aec0"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/chat">
          <el-icon><ChatDotRound /></el-icon>
          <span>智能问答</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isManager" index="/analytics">
          <el-icon><TrendCharts /></el-icon>
          <span>预测分析</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isManager" index="/reports">
          <el-icon><Document /></el-icon>
          <span>决策报告</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/knowledge">
          <el-icon><Collection /></el-icon>
          <span>知识库管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-title">{{ currentTitle }}</div>
        <div class="header-right">
          <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
          <span class="user-name">{{ userStore.userInfo?.name }}</span>
          <el-button text @click="handleLogout">
            <el-icon><SwitchButton /></el-icon> 退出
          </el-button>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentTitle = computed(() => route.meta.title || 'HR AI 平台')

const roleMap = {
  EMPLOYEE: '员工',
  MANAGER: '管理者',
  HRBP: 'HRBP',
  HR_ADMIN: '管理员'
}

const roleLabel = computed(() => roleMap[userStore.userInfo?.role] || '')
const roleTagType = computed(() => {
  const map = { EMPLOYEE: 'info', MANAGER: 'warning', HRBP: 'success', HR_ADMIN: 'danger' }
  return map[userStore.userInfo?.role] || 'info'
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background: var(--sidebar-bg);
  overflow: hidden;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.el-menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 24px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1f36;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  color: #666;
  font-size: 14px;
}

.main-content {
  padding: 20px;
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
