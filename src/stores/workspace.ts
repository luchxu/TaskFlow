import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getDemoData, resetDemoData, saveDemoData, type DemoDatabase } from '@/mock'
import type {
  Comment,
  CreateTaskInput,
  Project,
  Task,
  TaskFilters,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from '@/types'
import { canCommentOnTask, canCreateTask, canDeleteTask, canEditTask } from '@/utils/permissions'
import { workspaceApi } from '@/api'

export const useWorkspaceStore = defineStore('workspace', () => {
  const database = ref<DemoDatabase>(getDemoData())
  const currentProjectId = ref<string | null>(null)
  const filters = ref<TaskFilters>({ keyword: '' })
  const isMutating = ref(false)
  const errorMessage = ref<string | null>(null)
  const isInitialized = ref(false)

  const projects = computed(() => database.value.projects)
  const currentProject = computed<Project | undefined>(() =>
    database.value.projects.find((project) => project.id === currentProjectId.value),
  )

  const currentProjectTasks = computed(() => {
    const projectId = currentProjectId.value

    if (!projectId) {
      return []
    }

    return database.value.tasks.filter((task) => task.projectId === projectId)
  })

  const currentProjectMembers = computed(() => {
    const memberIds = currentProject.value?.memberIds ?? []
    return database.value.users.filter((user) => memberIds.includes(user.id))
  })

  const currentProjectTags = computed(() =>
    database.value.tags.filter((tag) => tag.projectId === currentProjectId.value),
  )

  const filteredTasks = computed(() => {
    const keyword = filters.value.keyword.trim().toLowerCase()

    return currentProjectTasks.value.filter((task) => {
      const matchesKeyword =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.description.toLowerCase().includes(keyword)
      const matchesStatus = !filters.value.status || task.status === filters.value.status
      const matchesPriority = !filters.value.priority || task.priority === filters.value.priority
      const matchesAssignee =
        !filters.value.assigneeId || task.assigneeId === filters.value.assigneeId
      const matchesTag = !filters.value.tagId || task.tagIds.includes(filters.value.tagId)

      return matchesKeyword && matchesStatus && matchesPriority && matchesAssignee && matchesTag
    })
  })

  function persist(): void {
    database.value = saveDemoData(database.value)
  }

  async function initialize(): Promise<void> {
    if (isInitialized.value) return
    isMutating.value = true
    errorMessage.value = null
    try {
      database.value = await workspaceApi.getSnapshot()
      isInitialized.value = true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '加载工作区失败'
    } finally { isMutating.value = false }
  }

  function selectProject(projectId: string): void {
    const exists = database.value.projects.some((project) => project.id === projectId)

    if (exists) {
      currentProjectId.value = projectId
      filters.value = { keyword: '' }
    }
  }

  function setKeyword(keyword: string): void {
    filters.value.keyword = keyword
  }

  function setStatus(status?: TaskStatus): void {
    filters.value.status = status
  }

  function setPriority(priority?: TaskPriority): void {
    filters.value.priority = priority
  }

  function setAssignee(assigneeId?: string): void {
    filters.value.assigneeId = assigneeId
  }

  function setTag(tagId?: string): void {
    filters.value.tagId = tagId
  }

  function clearFilters(): void {
    filters.value = { keyword: '' }
  }

  function getTaskById(taskId: string): Task | undefined {
    return database.value.tasks.find((task) => task.id === taskId)
  }

  function getTaskComments(taskId: string): Comment[] {
    return database.value.comments.filter((comment) => comment.taskId === taskId)
  }

  async function addComment(taskId: string, authorId: string, content: string): Promise<Comment | undefined> {
    const task = getTaskById(taskId)
    const author = database.value.users.find((user) => user.id === authorId)
    const project = task
      ? database.value.projects.find((item) => item.id === task.projectId)
      : undefined
    const trimmedContent = content.trim()

    if (!task || !author || !project || !canCommentOnTask(author, project) || !trimmedContent) {
      return undefined
    }

    try {
      const comment = await workspaceApi.createComment(taskId, authorId, trimmedContent)
      database.value.comments.push(comment)
      return comment
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '发表评论失败'
      return undefined
    }
  }

  async function createTask(input: CreateTaskInput, createdBy: string): Promise<Task | undefined> {
    const creator = database.value.users.find((user) => user.id === createdBy)
    const project = database.value.projects.find((item) => item.id === input.projectId)

    if (!creator || !project || !canCreateTask(creator, project)) {
      return undefined
    }

    isMutating.value = true
    errorMessage.value = null
    try {
      const task = await workspaceApi.createTask(input, createdBy)
      database.value.tasks.unshift(task)
      return task
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '创建任务失败'
      return undefined
    } finally { isMutating.value = false }
  }

  async function updateTask(taskId: string, input: UpdateTaskInput, actorId: string): Promise<Task | undefined> {
    const task = getTaskById(taskId)
    const actor = database.value.users.find((user) => user.id === actorId)
    const project = task
      ? database.value.projects.find((item) => item.id === task.projectId)
      : undefined

    if (!task || !actor || !project || !canEditTask(actor, project, task)) {
      return undefined
    }

    isMutating.value = true
    errorMessage.value = null
    try {
      const updatedTask = await workspaceApi.updateTask(taskId, input)
      Object.assign(task, updatedTask)
      return task
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '更新任务失败'
      return undefined
    } finally { isMutating.value = false }
  }

  async function deleteTask(taskId: string, actorId: string): Promise<boolean> {
    const taskIndex = database.value.tasks.findIndex((task) => task.id === taskId)

    if (taskIndex === -1) {
      return false
    }

    const task = database.value.tasks[taskIndex]
    const actor = database.value.users.find((user) => user.id === actorId)
    const project = database.value.projects.find((item) => item.id === task.projectId)

    if (!actor || !project || !canDeleteTask(actor, project)) {
      return false
    }

    isMutating.value = true
    errorMessage.value = null
    try {
      await workspaceApi.deleteTask(taskId)
      database.value.tasks.splice(taskIndex, 1)
      database.value.comments = database.value.comments.filter((comment) => comment.taskId !== taskId)
      return true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '删除任务失败'
      return false
    } finally { isMutating.value = false }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus, actorId: string): Promise<boolean> {
    return Boolean(await updateTask(taskId, { status }, actorId))
  }

  function resetWorkspace(): void {
    database.value = resetDemoData()
    currentProjectId.value = null
    filters.value = { keyword: '' }
  }

  return {
    database,
    projects,
    currentProject,
    currentProjectTasks,
    currentProjectMembers,
    currentProjectTags,
    filteredTasks,
    currentProjectId,
    filters,
    isInitialized,
    isMutating,
    errorMessage,
    selectProject,
    initialize,
    setKeyword,
    setStatus,
    setPriority,
    setAssignee,
    setTag,
    clearFilters,
    getTaskById,
    getTaskComments,
    addComment,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    resetWorkspace,
  }
})
