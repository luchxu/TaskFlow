export type UserRole = 'admin' | 'owner' | 'member'

/** 看板中的任务状态。值同时也是后续 API 和 Store 里的稳定标识。 */
export type TaskStatus = 'todo' | 'doing' | 'done'

/** 任务优先级。 */
export type TaskPriority = 'low' | 'medium' | 'high'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
}

export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  memberIds: string[]
  createdAt: string
}

export interface Tag {
  id: string
  projectId: string
  name: string
  color: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  tagIds: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  taskId: string
  authorId: string
  content: string
  createdAt: string
}

/** 登录接口返回的数据，避免页面直接依赖 User 的完整结构。 */
export interface AuthSession {
  token: string
  user: User
  expiresAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

/** 新建任务时由表单提交的数据，不要求调用方生成系统字段。 */
export type CreateTaskInput = Pick<
  Task,
  'projectId' | 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'tagIds'
>

/** 编辑任务时所有字段都是可选的，只提交发生变化的字段。 */
export type UpdateTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'tagIds'>
>

export interface TaskFilters {
  keyword: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  tagId?: string
}
