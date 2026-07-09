<template>
  <div class="knowledge-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>知识库管理</span>
          <div class="header-actions">
            <el-button type="success" @click="openUploadDialog">
              <el-icon><Upload /></el-icon> 上传文件
            </el-button>
            <el-button type="primary" @click="showDialog = true">
              <el-icon><Plus /></el-icon> 手动添加
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="documents" stripe>
        <el-table-column prop="title" label="标题" width="220" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ categoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容摘要" show-overflow-tooltip />
        <el-table-column prop="sourceFile" label="来源" width="160" />
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" text size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 文件上传 -->
    <el-dialog v-model="showUploadDialog" title="上传 PDF / Word 文档" width="560px" @closed="resetUpload">
      <el-form label-width="80px">
        <el-form-item label="文档分类">
          <el-select v-model="uploadCategory" placeholder="自动识别（推荐）" clearable style="width: 100%">
            <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.doc,.docx"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
            <template #tip>
              <div class="upload-tip">支持 PDF、Word（.doc / .docx），单文件最大 20MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!selectedFile" @click="handleUpload">
          解析并入库
        </el-button>
      </template>
    </el-dialog>

    <!-- 手动添加 -->
    <el-dialog v-model="showDialog" title="手动添加知识文档" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择分类">
            <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="8" />
        </el-form-item>
        <el-form-item label="来源文件">
          <el-input v-model="form.sourceFile" placeholder="如：员工手册.pdf" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">保存并向量化</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { knowledgeApi } from '../api'

const documents = ref([])
const showDialog = ref(false)
const showUploadDialog = ref(false)
const saving = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const uploadCategory = ref('')
const uploadRef = ref()

const form = reactive({
  title: '',
  content: '',
  category: 'GENERAL',
  sourceFile: ''
})

const categories = [
  { value: 'ATTENDANCE', label: '考勤' },
  { value: 'LEAVE', label: '假期' },
  { value: 'SALARY_POLICY', label: '薪酬政策' },
  { value: 'BENEFITS', label: '福利' },
  { value: 'ONBOARDING', label: '入职' },
  { value: 'OFFBOARDING', label: '离职' },
  { value: 'GENERAL', label: '通用' }
]

onMounted(loadDocuments)

async function loadDocuments() {
  documents.value = await knowledgeApi.list()
}

function openUploadDialog() {
  showUploadDialog.value = true
}

function handleFileChange(file) {
  selectedFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('每次只能上传一个文件')
}

function resetUpload() {
  selectedFile.value = null
  uploadCategory.value = ''
  uploadRef.value?.clearFiles()
}

async function handleUpload() {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    const result = await knowledgeApi.upload(selectedFile.value, uploadCategory.value || undefined)
    ElMessage.success(
      `「${result.title}」解析成功，共 ${result.chunkCount} 个片段、${result.totalCharacters} 字已入库`
    )
    showUploadDialog.value = false
    resetUpload()
    await loadDocuments()
  } finally {
    uploading.value = false
  }
}

async function handleCreate() {
  if (!form.title || !form.content) return
  saving.value = true
  try {
    await knowledgeApi.create({ ...form })
    ElMessage.success('文档已保存并向量化')
    showDialog.value = false
    form.title = ''
    form.content = ''
    form.sourceFile = ''
    await loadDocuments()
  } finally {
    saving.value = false
  }
}

async function handleDelete(id) {
  await ElMessageBox.confirm('确定删除该文档？删除后将从向量库中移除。', '确认')
  await knowledgeApi.delete(id)
  await loadDocuments()
}

function categoryLabel(cat) {
  return categories.find(c => c.value === cat)?.label || cat
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.upload-icon {
  font-size: 48px;
  color: #4f6ef7;
  margin-bottom: 8px;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}
</style>
