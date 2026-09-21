import type { Comment, CreateTaskInput, Project, Tag, Task, UpdateTaskInput, User } from '@/types'

export interface WorkspaceSnapshot { users: User[]; projects: Project[]; tasks: Task[]; tags: Tag[]; comments: Comment[] }
export interface WorkspaceApi {
  getSnapshot(): Promise<WorkspaceSnapshot>
  createTask(input: CreateTaskInput, createdBy: string): Promise<Task>
  updateTask(taskId: string, input: UpdateTaskInput): Promise<Task>
  deleteTask(taskId: string): Promise<void>
  createComment(taskId: string, authorId: string, content: string): Promise<Comment>
}
export interface ProjectApi { list(): Promise<Project[]>; get(projectId: string): Promise<Project> }
export interface UserApi { list(): Promise<User[]> }
export interface TagApi { list(projectId: string): Promise<Tag[]> }
