<template>
  <div v-if="trace" class="trace-panel">
    <div class="trace-header" @click="expanded = !expanded">
      <el-icon><Connection /></el-icon>
      <span>问数溯源</span>
      <el-tag size="small" :type="routeTagType">{{ routeLabel }}</el-tag>
      <el-icon class="expand-icon" :class="{ expanded }"><ArrowDown /></el-icon>
    </div>
    <el-collapse-transition>
      <div v-show="expanded" class="trace-body">
        <div class="trace-row">
          <span class="label">意图识别</span>
          <span>{{ trace.intentLabel || trace.intent }}</span>
        </div>
        <div class="trace-row">
          <span class="label">数据来源</span>
          <span>{{ trace.dataSource }}</span>
        </div>
        <div class="trace-row">
          <span class="label">查询方式</span>
          <span>{{ methodLabel }}</span>
        </div>
        <div v-if="trace.rowCount != null" class="trace-row">
          <span class="label">结果行数</span>
          <span>{{ trace.rowCount }} 行</span>
        </div>
        <div class="trace-row">
          <span class="label">权限说明</span>
          <span>{{ trace.permissionNote }}</span>
        </div>
        <div v-if="trace.employees?.length" class="trace-row">
          <span class="label">涉及员工</span>
          <div class="employee-tags">
            <el-tag
              v-for="emp in trace.employees"
              :key="emp.employeeId || emp.name"
              size="small"
              class="emp-tag"
              @click="$emit('view-employee', emp)"
            >{{ emp.name }}</el-tag>
          </div>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  trace: { type: Object, default: null }
})

defineEmits(['view-employee'])

const expanded = ref(true)

const routeLabel = computed(() => ({
  KNOWLEDGE: '知识库 RAG',
  PRESET_QUERY: '预设查询',
  TEXT_TO_SQL: 'Text-to-SQL'
}[props.trace?.routeType] || '未知'))

const routeTagType = computed(() => ({
  KNOWLEDGE: 'success',
  PRESET_QUERY: 'warning',
  TEXT_TO_SQL: 'danger'
}[props.trace?.routeType] || 'info'))

const methodLabel = computed(() => ({
  rag: '向量/关键词检索',
  preset: 'Repository 固定查询',
  'text-to-sql': 'LLM 生成 SQL'
}[props.trace?.queryMethod] || props.trace?.queryMethod || '-'))
</script>

<style scoped>
.trace-panel {
  margin-top: 8px;
  max-width: 85%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafbfc;
  overflow: hidden;
}

.trace-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.expand-icon {
  margin-left: auto;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.trace-body {
  padding: 0 12px 12px;
}

.trace-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.trace-row .label {
  flex-shrink: 0;
  width: 72px;
  color: #9ca3af;
}

.employee-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.emp-tag {
  cursor: pointer;
}
</style>
