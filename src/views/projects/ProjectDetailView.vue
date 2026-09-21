<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, useWorkspaceStore } from '@/stores'
import type { CreateTaskInput, Task, TaskPriority, TaskStatus } from '@/types'
import { canCommentOnTask, canCreateTask, canDeleteTask, canEditTask, canViewProject } from '@/utils/permissions'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()

const columns: Array<{ status: TaskStatus; label: string; tone: string }> = [
  { status: 'todo', label: '待处理', tone: 'todo' },
  { status: 'doing', label: '进行中', tone: 'doing' },
  { status: 'done', label: '已完成', tone: 'done' },
]

const priorityLabels: Record<TaskPriority, string> = {
  low: '低优先级',
  medium: '中优先级',
  high: '高优先级',
}

const draggedTaskId = ref<string | null>(null)
const selectedTask = ref<Task | null>(null)
const taskDrawerVisible = ref(false)
const commentContent = ref('')
const taskDialogVisible = ref(false)
const editingTaskId = ref<string | null>(null)
const taskFormRef = ref<FormInstance>()
const taskForm = ref<CreateTaskInput>({ projectId: '', title: '', description: '', status: 'todo', priority: 'medium', assigneeId: undefined, tagIds: [] })
const taskRules: FormRules = { title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }] }
const searchKeyword = ref('')
let searchTimer: number | undefined
const isDarkMode = ref(document.documentElement.classList.contains('dark'))

const tasksByStatus = computed(() =>
  columns.reduce<Record<TaskStatus, Task[]>>(
    (result, column) => {
      result[column.status] = workspaceStore.filteredTasks.filter(
        (task) => task.status === column.status,
      )
      return result
    },
    { todo: [], doing: [], done: [] },
  ),
)

const canCreate = computed(() =>
  Boolean(authStore.user && workspaceStore.currentProject && canCreateTask(authStore.user, workspaceStore.currentProject)),
)
const canEditSelectedTask = computed(() =>
  Boolean(authStore.user && workspaceStore.currentProject && selectedTask.value && canEditTask(authStore.user, workspaceStore.currentProject, selectedTask.value)),
)
const canDeleteSelectedTask = computed(() =>
  Boolean(authStore.user && workspaceStore.currentProject && canDeleteTask(authStore.user, workspaceStore.currentProject)),
)
const canComment = computed(() =>
  Boolean(authStore.user && workspaceStore.currentProject && canCommentOnTask(authStore.user, workspaceStore.currentProject)),
)
const currentProjectRole = computed(() => {
  if (!authStore.user || !workspaceStore.currentProject) return ''
  if (authStore.user.role === 'admin') return '管理员'
  if (workspaceStore.currentProject.ownerId === authStore.user.id) return '项目负责人'
  return '项目成员'
})

onMounted(async () => {
  await workspaceStore.initialize()
  const projectId = String(route.params.projectId)
  const project = workspaceStore.projects.find((item) => item.id === projectId)

  if (!authStore.user || !project || !canViewProject(authStore.user, project)) {
    ElMessage.error(project ? '你没有访问该项目的权限' : '项目不存在')
    await router.replace('/projects')
    return
  }

  workspaceStore.selectProject(projectId)
  searchKeyword.value = workspaceStore.filters.keyword
})

watch(searchKeyword, (value) => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => workspaceStore.setKeyword(value), 250)
})

onBeforeUnmount(() => window.clearTimeout(searchTimer))

function toggleTheme(): void {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  localStorage.setItem('taskflow:theme', isDarkMode.value ? 'dark' : 'light')
}

function getUserName(userId?: string): string {
  return workspaceStore.database.users.find((user) => user.id === userId)?.name ?? '未分配'
}

function getTagName(tagId: string): string {
  return workspaceStore.database.tags.find((tag) => tag.id === tagId)?.name ?? tagId
}

function handleDragStart(task: Task): void {
  if (!authStore.user || !workspaceStore.currentProject || !canEditTask(authStore.user, workspaceStore.currentProject, task)) {
    ElMessage.warning('你没有修改该任务的权限')
    return
  }
  draggedTaskId.value = task.id
}

async function handleDrop(status: TaskStatus): Promise<void> {
  if (!draggedTaskId.value) return
  if (!authStore.user) return
  const updated = await workspaceStore.updateTaskStatus(draggedTaskId.value, status, authStore.user.id)
  if (updated) ElMessage.success('任务状态已更新')
  else ElMessage.error('你没有修改该任务的权限')
  draggedTaskId.value = null
}

function handleDragEnd(): void {
  draggedTaskId.value = null
}

function clearFilters(): void {
  workspaceStore.clearFilters()
}

function openCreateDialog(): void {
  taskForm.value = { projectId: workspaceStore.currentProjectId ?? '', title: '', description: '', status: 'todo', priority: 'medium', assigneeId: undefined, tagIds: [] }
  editingTaskId.value = null
  taskDialogVisible.value = true
}

function openEditDialog(task: Task): void {
  taskForm.value = { projectId: task.projectId, title: task.title, description: task.description, status: task.status, priority: task.priority, assigneeId: task.assigneeId, tagIds: [...task.tagIds] }
  editingTaskId.value = task.id
  taskDrawerVisible.value = false
  taskDialogVisible.value = true
}

const selectedTaskComments = computed(() =>
  selectedTask.value ? workspaceStore.getTaskComments(selectedTask.value.id) : [],
)

function getCommentAuthor(authorId: string): string {
  return workspaceStore.database.users.find((user) => user.id === authorId)?.name ?? '未知用户'
}

async function submitComment(): Promise<void> {
  if (!selectedTask.value || !authStore.user) return
  const comment = await workspaceStore.addComment(selectedTask.value.id, authStore.user.id, commentContent.value)
  if (!comment) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  commentContent.value = ''
  ElMessage.success('评论已发布')
}

async function submitTask(): Promise<void> {
  const valid = await taskFormRef.value?.validate().catch(() => false)
  if (!valid || !authStore.user) return
  if (editingTaskId.value) {
    const updated = await workspaceStore.updateTask(editingTaskId.value, taskForm.value, authStore.user.id)
    if (!updated) {
      ElMessage.error('你没有编辑该任务的权限')
      return
    }
    ElMessage.success('任务已更新')
  } else {
    const created = await workspaceStore.createTask(taskForm.value, authStore.user.id)
    if (!created) {
      ElMessage.error('你没有创建任务的权限')
      return
    }
    ElMessage.success('任务已创建')
  }
  taskDialogVisible.value = false
}

async function removeTask(task: Task): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除“${task.title}”吗？删除后无法恢复。`, '删除任务', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    if (!authStore.user || !(await workspaceStore.deleteTask(task.id, authStore.user.id))) {
      ElMessage.error('你没有删除该任务的权限')
      return
    }
    selectedTask.value = null
    taskDrawerVisible.value = false
    ElMessage.success('任务已删除')
  } catch {
    // 用户取消
  }
}

async function handleLogout(): Promise<void> {
  await authStore.logout()
  await router.replace('/login')
}
</script>

<template>
  <div v-if="workspaceStore.currentProject" class="detail-page">
    <header class="topbar">
      <div class="topbar-left">
        <button class="back-button" aria-label="返回项目列表" @click="router.push('/projects')">←</button>
        <span class="logo">TaskFlow</span>
        <span class="separator">/</span>
        <span class="project-name">{{ workspaceStore.currentProject.name }}</span>
      </div>
      <div class="account-actions">
        <span>{{ authStore.user?.name }}</span>
        <el-button text @click="toggleTheme">{{ isDarkMode ? '浅色模式' : '深色模式' }}</el-button>
        <el-button @click="handleLogout">退出登录</el-button>
      </div>
    </header>

    <main class="detail-content">
      <el-alert v-if="workspaceStore.errorMessage" :title="workspaceStore.errorMessage" type="error" closable show-icon class="error-alert" @close="workspaceStore.errorMessage = null" />
      <section class="project-heading">
        <div>
          <p class="eyebrow">项目看板</p>
          <h1>{{ workspaceStore.currentProject.name }}</h1>
          <span class="role-badge">{{ currentProjectRole }}</span>
          <p class="description">{{ workspaceStore.currentProject.description }}</p>
        </div>
        <el-button v-if="canCreate" type="primary" :loading="workspaceStore.isMutating" @click="openCreateDialog">新建任务</el-button>
      </section>

      <section class="filters" aria-label="任务筛选">
        <el-input
          v-model="searchKeyword"
          clearable
          placeholder="搜索任务标题或描述"
          class="keyword-input"
          @update:model-value="workspaceStore.setKeyword"
        />
        <el-select
          :model-value="workspaceStore.filters.status"
          clearable
          placeholder="全部状态"
          @update:model-value="workspaceStore.setStatus"
        >
          <el-option label="待处理" value="todo" />
          <el-option label="进行中" value="doing" />
          <el-option label="已完成" value="done" />
        </el-select>
        <el-select
          :model-value="workspaceStore.filters.priority"
          clearable
          placeholder="全部优先级"
          @update:model-value="workspaceStore.setPriority"
        >
          <el-option label="低优先级" value="low" />
          <el-option label="中优先级" value="medium" />
          <el-option label="高优先级" value="high" />
        </el-select>
        <el-select
          :model-value="workspaceStore.filters.assigneeId"
          clearable
          placeholder="全部负责人"
          @update:model-value="workspaceStore.setAssignee"
        >
          <el-option v-for="member in workspaceStore.currentProjectMembers" :key="member.id" :label="member.name" :value="member.id" />
        </el-select>
        <el-select
          :model-value="workspaceStore.filters.tagId"
          clearable
          placeholder="全部标签"
          @update:model-value="workspaceStore.setTag"
        >
          <el-option v-for="tag in workspaceStore.currentProjectTags" :key="tag.id" :label="tag.name" :value="tag.id" />
        </el-select>
        <el-button text @click="clearFilters">清除筛选</el-button>
      </section>

      <section class="board" aria-label="任务看板">
        <div
          v-for="column in columns"
          :key="column.status"
          class="board-column"
          @dragover.prevent
          @drop="handleDrop(column.status)"
        >
          <header class="column-header">
            <div class="column-title"><span class="status-dot" :class="column.tone" />{{ column.label }}</div>
            <span class="task-count">{{ tasksByStatus[column.status].length }}</span>
          </header>
          <div class="task-list">
            <article
              v-for="task in tasksByStatus[column.status]"
              :key="task.id"
              class="task-card"
              :draggable="Boolean(authStore.user && workspaceStore.currentProject && canEditTask(authStore.user, workspaceStore.currentProject, task))"
              @dragstart="handleDragStart(task)"
              @dragend="handleDragEnd"
              @click="selectedTask = task; commentContent = ''; taskDrawerVisible = true"
            >
              <div class="task-card-top"><span class="priority" :class="task.priority">{{ priorityLabels[task.priority] }}</span><span class="task-id">#{{ task.id.replace('task-', '') }}</span></div>
              <h2>{{ task.title }}</h2>
              <p>{{ task.description }}</p>
              <footer>
                <span class="assignee">{{ getUserName(task.assigneeId) }}</span>
                <span v-for="tagId in task.tagIds" :key="tagId" class="tag">{{ getTagName(tagId) }}</span>
              </footer>
            </article>
            <div v-if="!tasksByStatus[column.status].length" class="empty-column">暂无任务</div>
          </div>
        </div>
      </section>
    </main>

    <el-drawer v-model="taskDrawerVisible" title="任务详情" size="420px">
      <template v-if="selectedTask">
        <p class="drawer-label">任务标题</p>
        <h2>{{ selectedTask.title }}</h2>
        <p class="drawer-label">任务描述</p>
        <p class="drawer-description">{{ selectedTask.description || '暂无描述' }}</p>
        <p class="drawer-label">负责人</p>
        <p>{{ getUserName(selectedTask.assigneeId) }}</p>
        <p class="drawer-label">状态</p>
        <el-select :model-value="selectedTask.status" :disabled="!canEditSelectedTask || workspaceStore.isMutating" @update:model-value="authStore.user && workspaceStore.updateTaskStatus(selectedTask.id, $event, authStore.user.id)">
          <el-option label="待处理" value="todo" />
          <el-option label="进行中" value="doing" />
          <el-option label="已完成" value="done" />
        </el-select>
        <div class="drawer-actions"><el-button v-if="canEditSelectedTask" type="primary" :loading="workspaceStore.isMutating" @click="openEditDialog(selectedTask)">编辑任务</el-button><el-button v-if="canDeleteSelectedTask" type="danger" plain :loading="workspaceStore.isMutating" @click="removeTask(selectedTask)">删除任务</el-button></div>
        <div class="comments-section">
          <p class="drawer-label">评论（{{ selectedTaskComments.length }}）</p>
          <div v-if="selectedTaskComments.length" class="comment-list">
            <article v-for="comment in selectedTaskComments" :key="comment.id" class="comment-item">
              <div class="comment-meta"><strong>{{ getCommentAuthor(comment.authorId) }}</strong><time>{{ new Date(comment.createdAt).toLocaleString('zh-CN') }}</time></div>
              <p>{{ comment.content }}</p>
            </article>
          </div>
          <p v-else class="no-comments">还没有评论，开始讨论吧。</p>
          <template v-if="canComment"><el-input v-model="commentContent" type="textarea" :rows="3" maxlength="300" show-word-limit placeholder="写下你的评论" /><el-button class="comment-button" type="primary" @click="submitComment">发表评论</el-button></template>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="taskDialogVisible" :title="editingTaskId ? '编辑任务' : '新建任务'" width="520px" destroy-on-close>
      <el-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-position="top">
        <el-form-item label="任务标题" prop="title"><el-input v-model="taskForm.title" maxlength="80" show-word-limit /></el-form-item>
        <el-form-item label="任务描述"><el-input v-model="taskForm.description" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item>
        <div class="form-row">
          <el-form-item label="状态" prop="status"><el-select v-model="taskForm.status" class="form-control"><el-option label="待处理" value="todo" /><el-option label="进行中" value="doing" /><el-option label="已完成" value="done" /></el-select></el-form-item>
          <el-form-item label="优先级" prop="priority"><el-select v-model="taskForm.priority" class="form-control"><el-option label="低优先级" value="low" /><el-option label="中优先级" value="medium" /><el-option label="高优先级" value="high" /></el-select></el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="负责人"><el-select v-model="taskForm.assigneeId" clearable class="form-control"><el-option v-for="member in workspaceStore.currentProjectMembers" :key="member.id" :label="member.name" :value="member.id" /></el-select></el-form-item>
          <el-form-item label="标签"><el-select v-model="taskForm.tagIds" multiple collapse-tags class="form-control"><el-option v-for="tag in workspaceStore.currentProjectTags" :key="tag.id" :label="tag.name" :value="tag.id" /></el-select></el-form-item>
        </div>
      </el-form>
        <template #footer><el-button @click="taskDialogVisible = false">取消</el-button><el-button type="primary" :loading="workspaceStore.isMutating" @click="submitTask">保存任务</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detail-page { min-height: 100vh; background: #f5f6f8; color: #17202d; }
.topbar { height: 64px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dfe3e8; background: #fff; }
.topbar-left, .account-actions { display: flex; align-items: center; gap: 12px; }
.back-button { border: 0; background: transparent; color: #596273; cursor: pointer; font-size: 24px; line-height: 1; }
.logo { font-weight: 750; }.separator { color: #c4cad3; }.project-name { color: #687284; font-size: 14px; }.account-actions { color: #596273; font-size: 14px; }
.detail-content { width: min(1420px, calc(100% - 48px)); margin: 0 auto; padding: 42px 0; }.project-heading { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; }.eyebrow { margin: 0 0 7px; color: #16856d; font-size: 13px; font-weight: 700; }.project-heading h1 { margin: 0; font-size: 30px; }.description { margin: 10px 0 0; color: #687284; }
.role-badge { display: inline-block; margin-top: 10px; padding: 3px 8px; border-radius: 3px; color: #176e5c; background: #e3f2ee; font-size: 12px; font-weight: 700; }
.filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }.keyword-input { width: min(300px, 100%); }.filters .el-select { width: 150px; }
.board { display: grid; grid-template-columns: repeat(3, minmax(260px, 1fr)); gap: 16px; align-items: start; }.board-column { min-height: 520px; padding: 12px; border: 1px solid #dfe3e8; border-radius: 8px; background: #edf0f3; }.column-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 4px 14px; }.column-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }.status-dot { width: 8px; height: 8px; border-radius: 50%; }.status-dot.todo { background: #98a2b3; }.status-dot.doing { background: #d28a16; }.status-dot.done { background: #16856d; }.task-count { color: #7a8492; font-size: 12px; }.task-list { display: grid; gap: 10px; }.task-card { padding: 16px; border: 1px solid #e0e4e8; border-radius: 6px; background: #fff; cursor: grab; transition: box-shadow .15s, transform .15s; }.task-card:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgb(23 32 45 / 8%); }.task-card:active { cursor: grabbing; }.task-card-top, .task-card footer { display: flex; align-items: center; gap: 8px; }.task-card-top { justify-content: space-between; }.priority { font-size: 11px; font-weight: 700; }.priority.high { color: #c2413b; }.priority.medium { color: #b7791f; }.priority.low { color: #687284; }.task-id { color: #a0a8b4; font-size: 11px; }.task-card h2 { margin: 12px 0 7px; font-size: 15px; line-height: 1.4; }.task-card p { display: -webkit-box; overflow: hidden; margin: 0; color: #687284; font-size: 13px; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.task-card footer { flex-wrap: wrap; margin-top: 14px; }.assignee { color: #596273; font-size: 12px; }.tag { padding: 3px 7px; border-radius: 3px; color: #37615b; background: #e4f3ef; font-size: 11px; }.empty-column { padding: 38px 0; color: #929baa; text-align: center; font-size: 13px; }.drawer-label { margin: 24px 0 7px; color: #7a8492; font-size: 12px; font-weight: 700; }.drawer-label:first-child { margin-top: 0; }.drawer-description { color: #596273; line-height: 1.7; }
.drawer-actions { display: flex; gap: 10px; margin-top: 32px; }.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }.form-control { width: 100%; }
.error-alert { margin-bottom: 18px; }
.comments-section { margin-top: 30px; }.comment-list { display: grid; gap: 10px; }.comment-item { padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa; }.comment-meta { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }.comment-meta time { color: #8b95a3; }.comment-item p { margin: 8px 0 0; color: #596273; line-height: 1.55; }.no-comments { color: #8b95a3; font-size: 13px; }.comment-button { width: 100%; margin-top: 10px; }
@media (max-width: 900px) { .board { grid-template-columns: 1fr; }.board-column { min-height: 180px; }.detail-content { width: calc(100% - 32px); } }
@media (max-width: 640px) { .topbar { height: auto; padding: 14px 16px; align-items: flex-start; }.account-actions { flex-wrap: wrap; justify-content: flex-end; }.account-actions span { display: none; }.project-heading { align-items: flex-start; flex-direction: column; gap: 18px; }.filters .el-select { flex: 1; min-width: 140px; } }
</style>
