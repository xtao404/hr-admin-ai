<template>
  <div class="reports-page">
    <el-card class="query-card">
      <template #header>管理者决策支持</template>
      <p class="desc">用自然语言提问，系统将从 HR 系统拉取数据并生成分析报告</p>
      <div class="quick-queries">
        <el-tag
          v-for="q in quickQueries"
          :key="q"
          class="query-tag"
          effect="plain"
          @click="fillQuery(q)"
        >{{ q }}</el-tag>
      </div>
      <el-form :model="form" label-width="80px" style="margin-top: 16px">
        <el-form-item label="查询内容">
          <el-input v-model="form.query" type="textarea" :rows="2" placeholder="输入您的分析问题" />
        </el-form-item>
        <el-form-item label="统计周期">
          <el-select v-model="form.period" placeholder="选择周期">
            <el-option label="上季度" value="上季度" />
            <el-option label="本季度" value="本季度" />
            <el-option label="上半年" value="上半年" />
            <el-option label="本年度" value="本年度" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="generateReport">
            <el-icon><DataAnalysis /></el-icon> 生成报告
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="report" class="report-card">
      <template #header>
        <div class="report-header">
          <span>{{ report.reportTitle }}</span>
          <div class="header-actions">
            <el-tag type="success" size="small">实时数据</el-tag>
            <el-button size="small" @click="exportReport">
              <el-icon><Download /></el-icon> 导出 Markdown
            </el-button>
          </div>
        </div>
      </template>

      <el-alert :title="report.summary" type="info" :closable="false" show-icon style="margin-bottom: 20px" />

      <el-row :gutter="16" class="metrics-row">
        <el-col :span="8" v-for="m in report.metrics" :key="m.name">
          <div class="metric-card">
            <div class="metric-name">{{ m.name }}</div>
            <div class="metric-value">
              {{ m.value }}<span class="metric-unit">{{ m.unit }}</span>
              <el-tag :type="trendType(m.trend)" size="small" class="metric-trend">{{ m.trend }}</el-tag>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="report-detail">
        <h4>详细分析</h4>
        <div class="detail-content" v-html="formatDetail(report.detail)"></div>
      </div>

      <div v-if="report.dataSources?.length" class="data-sources">
        <span class="sources-label">数据来源：</span>
        <el-tag v-for="s in report.dataSources" :key="s.title" size="small" type="info">{{ s.title }}</el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { analyticsApi } from '../api'
import { marked } from 'marked'

const loading = ref(false)
const report = ref(null)
const form = reactive({ query: '', period: '上季度' })

const quickQueries = [
  '帮我统计上季度部门加班时长',
  '对比一下我们和行业的薪酬竞争力',
  '分析本部门离职率趋势',
  '统计在职人数和人员流动情况'
]

function fillQuery(q) {
  form.query = q
}

async function generateReport() {
  if (!form.query.trim()) return
  loading.value = true
  try {
    report.value = await analyticsApi.generateReport({
      query: form.query,
      period: form.period
    })
  } finally {
    loading.value = false
  }
}

function formatDetail(text) {
  return marked.parse(text || '')
}

function trendType(trend) {
  if (trend?.includes('↑')) return 'danger'
  if (trend?.includes('↓')) return 'success'
  return 'info'
}

function exportReport() {
  if (!report.value) return
  const r = report.value
  let md = `# ${r.reportTitle}\n\n`
  md += `> ${r.summary}\n\n`
  md += `## 核心指标\n\n`
  for (const m of r.metrics || []) {
    md += `- **${m.name}**: ${m.value}${m.unit || ''} ${m.trend || ''}\n`
  }
  md += `\n## 详细分析\n\n${r.detail || ''}\n`
  if (r.dataSources?.length) {
    md += `\n## 数据来源\n\n`
    for (const s of r.dataSources) {
      md += `- ${s.title}\n`
    }
  }
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${r.reportTitle || 'HR报告'}.md`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.query-card .desc {
  color: #999;
  font-size: 14px;
}

.quick-queries {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.query-tag {
  cursor: pointer;
}

.report-card {
  margin-top: 20px;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metrics-row {
  margin-bottom: 24px;
}

.metric-card {
  background: #f8f9fc;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.metric-name {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1f36;
}

.metric-unit {
  font-size: 14px;
  font-weight: 400;
  color: #999;
  margin-left: 2px;
}

.metric-trend {
  margin-left: 8px;
  vertical-align: middle;
}

.report-detail h4 {
  margin-bottom: 12px;
  color: #1a1f36;
}

.detail-content {
  line-height: 1.8;
  color: #444;
  font-size: 14px;
}

.data-sources {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.sources-label {
  font-size: 13px;
  color: #999;
  margin-right: 8px;
}
</style>
