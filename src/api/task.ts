import { getDemoData, saveDemoData } from '@/mock'
import type { CreateTaskInput, Task, UpdateTaskInput } from '@/types'

/**
 * 任务 API 的 Mock 实现。
 * 页面和 Store 只依赖这些方法，未来切换真实后端时替换此文件即可。
 */
export const taskApi = {
  async list(projectId: string): Promise<Task[]> {
    return getDemoData().tasks.filter((task) => task.projectId === projectId)
  },

  async create(input: CreateTaskInput, createdBy: string): Promise<Task> {
    const database = getDemoData()
    const now = new Date().toISOString()
    const task: Task = {
      ...input,
      id: `task-${crypto.randomUUID()}`,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    database.tasks.unshift(task)
    saveDemoData(database)
    return task
  },

  async update(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const database = getDemoData()
    const task = database.tasks.find((item) => item.id === taskId)

    if (!task) {
      throw new Error('任务不存在')
    }

    Object.assign(task, input, { updatedAt: new Date().toISOString() })
    saveDemoData(database)
    return task
  },

  async remove(taskId: string): Promise<void> {
    const database = getDemoData()
    const taskIndex = database.tasks.findIndex((task) => task.id === taskId)

    if (taskIndex === -1) {
      throw new Error('任务不存在')
    }

    database.tasks.splice(taskIndex, 1)
    database.comments = database.comments.filter((comment) => comment.taskId !== taskId)
    saveDemoData(database)
  },
}
