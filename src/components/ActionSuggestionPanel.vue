<template>
  <div v-if="actions?.length" class="action-panel">
    <div class="action-title">
      <el-icon><Bell /></el-icon>
      <span>AI 行动建议</span>
    </div>
    <div v-for="(action, idx) in actions" :key="idx" class="action-item">
      <div class="action-content">
        <strong>{{ action.title }}</strong>
        <p>{{ action.description }}</p>
      </div>
      <el-button
        size="small"
        type="primary"
        plain
        :loading="loadingIdx === idx"
        @click="createTask(action, idx)"
      >创建任务</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { actionApi } from '../api'

defineProps({
  actions: { type: Array, default: () => [] }
})

const loadingIdx = ref(-1)

async function createTask(action, idx) {
  loadingIdx.value = idx
  try {
    const res = await actionApi.createTask({
      actionType: action.actionType,
      employeeId: action.employeeId,
      employeeName: action.employeeName,
      title: action.title,
      description: action.description
    })
    ElMessage.success(res.message)
  } finally {
    loadingIdx.value = -1
  }
}
</script>

<style scoped>
.action-panel {
  margin-top: 8px;
  max-width: 85%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
}

.action-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1d4ed8;
  margin-bottom: 10px;
}

.action-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #dbeafe;
}

.action-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.action-content strong {
  font-size: 13px;
  color: #1e3a8a;
}

.action-content p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}
</style>
