<template>
  <div class="analytics-page">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="24">
        <el-alert
          title="预测分析基于绩效、考勤、满意度等多维特征（演示模型），生产环境可对接 XGBoost / 随机森林等 ML 服务。"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card danger">
          <div class="stat-value">{{ dashboard.highRiskEmployeeCount }}</div>
          <div class="stat-label">高风险离职预警</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card warning">
          <div class="stat-value">{{ dashboard.skillGapCount }}</div>
          <div class="stat-label">技能缺口岗位</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card success">
          <div class="stat-value">{{ (dashboard.avgRecruitmentSuccessRate * 100).toFixed(0) }}%</div>
          <div class="stat-label">招聘成功率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>离职风险预测</span>
              <el-tag type="danger" size="small">ML模型驱动</el-tag>
            </div>
          </template>
          <el-table :data="turnoverList" stripe size="small">
            <el-table-column label="员工" width="90">
              <template #default="{ row }">
                <el-link type="primary" @click="openEmployee(row)">{{ row.employeeName }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="departmentName" label="部门" width="110" />
            <el-table-column label="风险分" width="80">
              <template #default="{ row }">
                <span :style="{ color: riskColor(row.riskLevel) }">
                  {{ (row.riskScore * 100).toFixed(0) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="等级" width="80">
              <template #default="{ row }">
                <el-tag :type="riskTagType(row.riskLevel)" size="small">{{ riskLabel(row.riskLevel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="recommendation" label="建议" show-overflow-tooltip />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="danger" plain @click="createRetentionTask(row)">挽留</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>岗位技能缺口预测</span>
              <el-tag type="warning" size="small">人才盘点</el-tag>
            </div>
          </template>
          <el-table :data="skillGaps" stripe size="small">
            <el-table-column prop="positionName" label="岗位" width="130" />
            <el-table-column prop="requiredSkill" label="关键技能" width="120" />
            <el-table-column label="供给/需求" width="100">
              <template #default="{ row }">{{ row.currentSupply }} / {{ row.projectedDemand }}</template>
            </el-table-column>
            <el-table-column prop="gapCount" label="缺口" width="60" />
            <el-table-column prop="recommendation" label="建议" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>招聘质量分析</span>
          <el-tag type="success" size="small">画像优化</el-tag>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="12" v-for="item in recruitmentList" :key="item.positionName">
          <div class="recruitment-card">
            <h4>{{ item.positionName }}
              <el-tag size="small">成功率 {{ (item.successRate * 100).toFixed(0) }}%</el-tag>
            </h4>
            <p class="section-title">成功入职者特征：</p>
            <el-tag v-for="t in item.successTraits" :key="t" size="small" class="trait-tag">{{ t }}</el-tag>
            <p class="section-title">优化建议：</p>
            <ul>
              <li v-for="s in item.optimizationSuggestions" :key="s">{{ s }}</li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>

  <EmployeeProfileDrawer
    :visible="profileVisible"
    :employee="selectedEmployee"
    @close="profileVisible = false"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { analyticsApi, actionApi } from '../api'
import EmployeeProfileDrawer from '../components/EmployeeProfileDrawer.vue'

const dashboard = ref({
  highRiskEmployeeCount: 0,
  skillGapCount: 0,
  avgRecruitmentSuccessRate: 0
})
const turnoverList = ref([])
const skillGaps = ref([])
const recruitmentList = ref([])
const profileVisible = ref(false)
const selectedEmployee = ref(null)

onMounted(async () => {
  const [dash, turnover, gaps, recruitment] = await Promise.all([
    analyticsApi.dashboard(),
    analyticsApi.turnover(),
    analyticsApi.skillGaps(),
    analyticsApi.recruitment()
  ])
  dashboard.value = dash
  turnoverList.value = turnover
  skillGaps.value = gaps
  recruitmentList.value = recruitment
})

function riskColor(level) {
  const map = { LOW: '#67c23a', MEDIUM: '#e6a23c', HIGH: '#f56c6c', CRITICAL: '#c45656' }
  return map[level] || '#999'
}

function riskTagType(level) {
  const map = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' }
  return map[level] || 'info'
}

function riskLabel(level) {
  const map = { LOW: '低', MEDIUM: '中', HIGH: '高', CRITICAL: '极高' }
  return map[level] || level
}

function openEmployee(row) {
  selectedEmployee.value = { employeeId: row.employeeId, name: row.employeeName }
  profileVisible.value = true
}

async function createRetentionTask(row) {
  const res = await actionApi.createTask({
    actionType: 'RETENTION',
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    title: `安排 ${row.employeeName} 离职风险面谈`,
    description: row.recommendation || '建议尽快安排 1v1 面谈并制定挽留方案。'
  })
  ElMessage.success(res.message)
}
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 12px 0;
}

.stat-card.danger .stat-value { color: #f56c6c; }
.stat-card.warning .stat-value { color: #e6a23c; }
.stat-card.success .stat-value { color: #67c23a; }

.stat-value {
  font-size: 36px;
  font-weight: 700;
}

.stat-label {
  color: #999;
  font-size: 14px;
  margin-top: 4px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recruitment-card {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.recruitment-card h4 {
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  color: #666;
  margin: 10px 0 6px;
}

.trait-tag {
  margin: 0 4px 4px 0;
}

.recruitment-card ul {
  padding-left: 18px;
  font-size: 13px;
  color: #666;
}

.recruitment-card li {
  margin-bottom: 4px;
}
</style>
