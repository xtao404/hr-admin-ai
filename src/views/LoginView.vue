<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#4f6ef7"><Cpu /></el-icon>
        <h1>HR AI 智能平台</h1>
        <p>智能问答 · 预测分析 · 决策支持</p>
        <ul class="value-points">
          <li>一个对话框：制度问答 + 实时查数 + Text-to-SQL</li>
          <li>管理者：预测预警、图表可视化、决策报告</li>
          <li>企业级：RBAC 权限、问数溯源、行动建议闭环</li>
        </ul>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" class="login-btn" @click="handleLogin">
          登 录
        </el-button>
      </el-form>

      <div class="demo-accounts">
        <p>演示账号（密码均为 123456）：</p>
        <el-space wrap>
          <el-tag class="demo-tag" @click="fillAccount('employee1')">员工</el-tag>
          <el-tag class="demo-tag" type="warning" @click="fillAccount('manager1')">经理</el-tag>
          <el-tag class="demo-tag" type="success" @click="fillAccount('hrbp1')">HRBP</el-tag>
          <el-tag class="demo-tag" type="danger" @click="fillAccount('admin')">管理员</el-tag>
        </el-space>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function fillAccount(username) {
  form.username = username
  form.password = '123456'
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    router.push('/chat')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1f36 0%, #2d3561 50%, #4f6ef7 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 12px 0 8px;
  font-size: 24px;
  color: #1a1f36;
}

.login-header p {
  color: #999;
  font-size: 14px;
  margin-bottom: 8px;
}

.value-points {
  text-align: left;
  margin: 12px 0 0;
  padding-left: 18px;
  font-size: 12px;
  color: #666;
  line-height: 1.8;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
}

.demo-accounts {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.demo-accounts p {
  font-size: 13px;
  color: #999;
  margin-bottom: 10px;
}

.demo-tag {
  cursor: pointer;
}
</style>
