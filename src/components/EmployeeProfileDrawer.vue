<template>
  <el-drawer
    :model-value="visible"
    :title="profile?.name ? profile.name + ' · 360° 画像' : '员工画像'"
    size="420px"
    @close="$emit('close')"
  >
    <div v-loading="loading">
      <template v-if="profile">
        <div class="profile-header">
          <el-avatar :size="56" style="background: #4f6ef7">{{ profile.name?.[0] }}</el-avatar>
          <div>
            <h3>{{ profile.name }}</h3>
            <p>{{ profile.position }} · {{ profile.departmentName }}</p>
            <p class="sub">工号 {{ profile.employeeId }}</p>
          </div>
        </div>

        <el-divider />

        <div class="metric-grid">
          <div class="metric-item">
            <div class="metric-label">满意度</div>
            <div class="metric-value">{{ formatNum(profile.satisfactionScore) }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">年假余额</div>
            <div class="metric-value">{{ formatNum(profile.leaveBalance) }}<small>天</small></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">加班时长</div>
            <div class="metric-value">{{ formatNum(profile.overtimeHours) }}<small>h</small></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">绩效分数</div>
            <div class="metric-value">{{ formatNum(profile.performanceScore) }}</div>
          </div>
        </div>

        <el-descriptions :column="1" border size="small" class="desc-block">
          <el-descriptions-item label="入职日期">{{ profile.hireDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学历">{{ profile.education || '-' }}</el-descriptions-item>
          <el-descriptions-item label="绩效评级">{{ profile.performanceRating || '-' }}</el-descriptions-item>
          <el-descriptions-item label="迟到/缺勤">
            {{ profile.lateCount ?? '-' }} 次 / {{ profile.absentDays ?? '-' }} 天
          </el-descriptions-item>
          <el-descriptions-item label="薪酬等级">{{ profile.salaryBand || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="profile.baseSalary" label="基本月薪">
            {{ profile.baseSalary }} 元
          </el-descriptions-item>
        </el-descriptions>

        <el-alert
          v-if="profile.riskLevel"
          :title="'离职风险：' + riskLabel(profile.riskLevel) + ' (' + formatPercent(profile.riskScore) + ')'"
          :type="riskAlertType(profile.riskLevel)"
          :closable="false"
          show-icon
          class="risk-alert"
        >
          <p v-if="profile.riskFactors">因素：{{ profile.riskFactors }}</p>
          <p v-if="profile.riskRecommendation">建议：{{ profile.riskRecommendation }}</p>
        </el-alert>
      </template>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { employeeApi } from '../api'

const props = defineProps({
  visible: Boolean,
  employee: { type: Object, default: null }
})

defineEmits(['close'])

const loading = ref(false)
const profile = ref(null)

watch(() => [props.visible, props.employee], async ([vis, emp]) => {
  if (!vis || !emp) {
    profile.value = null
    return
  }
  loading.value = true
  try {
    if (emp.employeeId) {
      profile.value = await employeeApi.profile(emp.employeeId)
    } else if (emp.name) {
      profile.value = await employeeApi.profileByName(emp.name)
    }
  } finally {
    loading.value = false
  }
}, { immediate: true })

function formatNum(val) {
  return val == null ? '-' : val
}

function formatPercent(val) {
  return val == null ? '-' : (val <= 1 ? (val * 100).toFixed(0) : val.toFixed(0)) + '%'
}

function riskLabel(level) {
  return { LOW: '低', MEDIUM: '中', HIGH: '高', CRITICAL: '极高' }[level] || level
}

function riskAlertType(level) {
  return { LOW: 'success', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error' }[level] || 'info'
}
</script>

<style scoped>
.profile-header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.profile-header h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.profile-header p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.profile-header .sub {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #94a3b8;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-top: 4px;
}

.metric-value small {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
}

.desc-block {
  margin-bottom: 16px;
}

.risk-alert p {
  margin: 4px 0 0;
  font-size: 12px;
}
</style>
