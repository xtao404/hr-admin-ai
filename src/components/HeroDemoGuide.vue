<template>
  <el-dialog
    v-model="visible"
    title="3 分钟产品演示"
    width="520px"
    :close-on-click-modal="false"
    @closed="handleClose"
  >
    <div class="demo-content">
      <el-steps :active="step" finish-status="success" align-center>
        <el-step title="制度问答" />
        <el-step title="数据查询" />
        <el-step title="智能分析" />
      </el-steps>

      <div class="step-detail">
        <h4>{{ currentStep.title }}</h4>
        <p>{{ currentStep.desc }}</p>
        <el-tag effect="plain" class="demo-query">{{ currentStep.query }}</el-tag>
      </div>
    </div>

    <template #footer>
      <el-button v-if="step > 0" @click="step--">上一步</el-button>
      <el-button v-if="step < steps.length - 1" type="primary" @click="step++">下一步</el-button>
      <el-button v-else type="primary" @click="startDemo">开始体验</el-button>
      <el-button text @click="skip">跳过引导</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'

const emit = defineEmits(['start-demo'])

const visible = ref(false)
const step = ref(0)
const userStore = useUserStore()

defineExpose({
  open: () => {
    step.value = 0
    visible.value = true
  }
})

const steps = computed(() => {
  const base = [
    {
      title: '员工自助：制度问答',
      desc: '普通员工可询问年假、福利、入离职等政策，系统从知识库检索并引用来源。',
      query: '年假有多少天？'
    },
    {
      title: '个人数据：实时查数',
      desc: '员工可查询自己的假期余额、加班时长等 HR 业务数据，结果附带图表。',
      query: '我的假期余额是多少？'
    }
  ]
  if (userStore.isManager) {
    return [
      ...base,
      {
        title: '管理者：复杂分析 + 溯源',
        desc: '支持 Text-to-SQL 复杂分析，展示问数溯源、图表和行动建议。',
        query: '对比各部门加班时长'
      }
    ]
  }
  return base
})

const currentStep = computed(() => steps.value[step.value] || steps.value[0])

onMounted(() => {
  if (!localStorage.getItem('hr_demo_completed')) {
    visible.value = true
  }
})

function startDemo() {
  localStorage.setItem('hr_demo_completed', '1')
  visible.value = false
  emit('start-demo', currentStep.value.query)
}

function skip() {
  localStorage.setItem('hr_demo_completed', '1')
  visible.value = false
}

function handleClose() {
  localStorage.setItem('hr_demo_completed', '1')
}
</script>

<style scoped>
.demo-content {
  padding: 8px 0 16px;
}

.step-detail {
  margin-top: 24px;
  text-align: center;
}

.step-detail h4 {
  margin: 0 0 8px;
  color: #1a1f36;
}

.step-detail p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.demo-query {
  font-size: 13px;
  padding: 8px 16px;
}
</style>
