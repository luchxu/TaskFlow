import { apiClient } from './client'
import type { WorkspaceApi, WorkspaceSnapshot } from './contracts'
import type { Comment, CreateTaskInput, Task, UpdateTaskInput } from '@/types'

export const realWorkspaceApi: WorkspaceApi = {
  async getSnapshot(): Promise<WorkspaceSnapshot> { return (await apiClient.get<WorkspaceSnapshot>('/workspace/snapshot')).data },
  async createTask(input: CreateTaskInput, createdBy: string): Promise<Task> { return (await apiClient.post<Task>('/tasks', { ...input, createdBy })).data },
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> { return (await apiClient.patch<Task>(`/tasks/${taskId}`, input)).data },
  async deleteTask(taskId: string): Promise<void> { await apiClient.delete(`/tasks/${taskId}`) },
  async createComment(taskId: string, authorId: string, content: string): Promise<Comment> { return (await apiClient.post<Comment>(`/tasks/${taskId}/comments`, { authorId, content })).data },
}
