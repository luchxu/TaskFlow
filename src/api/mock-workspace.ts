import { getDemoData, saveDemoData } from '@/mock'
import type { WorkspaceApi, WorkspaceSnapshot } from './contracts'
import type { Comment, CreateTaskInput, Task, UpdateTaskInput } from '@/types'

export const mockWorkspaceApi: WorkspaceApi = {
  async getSnapshot(): Promise<WorkspaceSnapshot> { return getDemoData() },
  async createTask(input: CreateTaskInput, createdBy: string): Promise<Task> {
    const database = getDemoData(); const now = new Date().toISOString()
    const task: Task = { ...input, id: `task-${crypto.randomUUID()}`, createdBy, createdAt: now, updatedAt: now }
    database.tasks.unshift(task); saveDemoData(database); return task
  },
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const database = getDemoData(); const task = database.tasks.find((item) => item.id === taskId)
    if (!task) throw new Error('任务不存在'); Object.assign(task, input, { updatedAt: new Date().toISOString() }); saveDemoData(database); return task
  },
  async deleteTask(taskId: string): Promise<void> {
    const database = getDemoData(); const index = database.tasks.findIndex((task) => task.id === taskId)
    if (index === -1) throw new Error('任务不存在'); database.tasks.splice(index, 1); database.comments = database.comments.filter((comment) => comment.taskId !== taskId); saveDemoData(database)
  },
  async createComment(taskId: string, authorId: string, content: string): Promise<Comment> {
    const database = getDemoData(); const comment: Comment = { id: `comment-${crypto.randomUUID()}`, taskId, authorId, content, createdAt: new Date().toISOString() }
    database.comments.push(comment); saveDemoData(database); return comment
  },
}
