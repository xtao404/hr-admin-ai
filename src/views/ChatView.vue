<template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <el-button type="primary" class="new-chat-btn" @click="startNewChat">
        <el-icon><Plus /></el-icon> 新对话
      </el-button>
      <div class="session-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          :class="['session-item', { active: currentSessionId === session.id }]"
          @click="loadSession(session.id)"
        >
          <el-icon><ChatLineSquare /></el-icon>
          <span>{{ session.title }}</span>
        </div>
      </div>
    </div>

    <div class="chat-main">
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="welcome">
          <el-icon :size="48" color="#4f6ef7"><ChatDotRound /></el-icon>
          <h2>HR 智能助手</h2>
          <p>支持制度问答（知识库）与业务数据查询（MySQL）</p>
          <div class="quick-questions">
            <el-tag
              v-for="q in quickQuestions"
              :key="q"
              class="quick-tag"
              effect="plain"
              @click="sendQuestion(q)"
            >{{ q }}</el-tag>
          </div>
        </div>

        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <div class="message-avatar">
            <el-avatar :size="36" :style="{ background: msg.role === 'user' ? '#4f6ef7' : '#10b981' }">
              {{ msg.role === 'user' ? '我' : 'AI' }}
            </el-avatar>
          </div>
          <div class="message-body">
            <div class="message-content" v-html="formatContent(msg.content)"></div>
            <div v-if="msg.charts?.length" class="message-charts">
              <ChatChart v-for="(chart, idx) in msg.charts" :key="idx" :config="chart" />
            </div>
            <div v-if="msg.sources?.length" class="message-sources">
              <p class="sources-title">参考来源：</p>
              <el-tag
                v-for="src in msg.sources"
                :key="src.documentId"
                size="small"
                type="info"
                class="source-tag"
              >{{ src.title }} ({{ (src.relevance * 100).toFixed(0) }}%)</el-tag>
            </div>
          </div>
        </div>

        <div v-if="loading" class="message assistant">
          <div class="message-avatar">
            <el-avatar :size="36" style="background: #10b981">AI</el-avatar>
          </div>
          <div class="message-body">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="2"
          placeholder="输入您的问题，如：年假有多少天？我的假期余额是多少？"
          @keyup.ctrl.enter="sendMessage"
        />
        <el-button type="primary" :loading="loading" :disabled="!inputText.trim()" @click="sendMessage">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { chatApi } from '../api'
import { useUserStore } from '../stores/user'
import { marked } from 'marked'
import ChatChart from '../components/ChatChart.vue'

const userStore = useUserStore()
const sessions = ref([])
const messages = ref([])
const currentSessionId = ref(null)
const inputText = ref('')
const loading = ref(false)
const messagesRef = ref()

const quickQuestions = computed(() => {
  const common = ['年假有多少天？', '我的假期余额是多少？', '五险一金包括哪些？']
  if (userStore.isManager) {
    return [
      ...common,
      '统计本季度部门加班时长',
      '哪些员工有离职风险？',
      '对比各部门加班时长',
      '找出满意度低于7分的员工',
      '查询绩效为C且加班超过50小时的员工'
    ]
  }
  return [...common, '离职需要提前多久申请？', '我的加班时长是多少？']
})

onMounted(() => loadSessions())

async function loadSessions() {
  sessions.value = await chatApi.sessions()
}

async function loadSession(sessionId) {
  currentSessionId.value = sessionId
  messages.value = await chatApi.messages(sessionId)
  scrollToBottom()
}

function startNewChat() {
  currentSessionId.value = null
  messages.value = []
  inputText.value = ''
}

function sendQuestion(q) {
  inputText.value = q
  sendMessage()
}

async function sendMessage() {
  const question = inputText.value.trim()
  if (!question || loading.value) return

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: question
  })
  inputText.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const res = await chatApi.ask({
      question,
      sessionId: currentSessionId.value
    })
    currentSessionId.value = res.sessionId
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: res.answer,
      sources: res.sources,
      charts: res.charts
    })
    await loadSessions()
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function formatContent(text) {
  return marked.parse(text || '')
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 100px);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.chat-sidebar {
  width: 260px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.new-chat-btn {
  width: 100%;
  margin-bottom: 16px;
}

.session-list {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.session-item:hover,
.session-item.active {
  background: var(--primary-light);
  color: var(--primary);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.welcome {
  text-align: center;
  padding: 60px 20px;
}

.welcome h2 {
  margin: 16px 0 8px;
  color: #1a1f36;
}

.welcome p {
  color: #999;
  margin-bottom: 24px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.quick-tag {
  cursor: pointer;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message.user {
  flex-direction: row-reverse;
}

.message.user .message-content {
  background: var(--primary);
  color: #fff;
}

.message-content {
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  max-width: 70%;
  font-size: 14px;
}

.message-charts {
  margin-top: 8px;
  max-width: 85%;
  min-width: 360px;
}

.message-sources {
  margin-top: 8px;
}

.sources-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.source-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  align-items: flex-end;
}

.chat-input .el-textarea {
  flex: 1;
}
</style>
