import type { Project, Task, User } from '@/types'

export function isProjectMember(user: User, project: Project): boolean {
  return project.memberIds.includes(user.id)
}

export function canViewProject(user: User, project: Project): boolean {
  return user.role === 'admin' || project.ownerId === user.id || isProjectMember(user, project)
}

export function canCreateTask(user: User, project: Project): boolean {
  return user.role === 'admin' || isProjectMember(user, project)
}

export function canEditTask(user: User, project: Project, task: Task): boolean {
  if (user.role === 'admin' || project.ownerId === user.id) {
    return true
  }

  return user.role === 'member' && task.assigneeId === user.id
}

export function canDeleteTask(user: User, project: Project): boolean {
  return user.role === 'admin' || project.ownerId === user.id
}

export function canCommentOnTask(user: User, project: Project): boolean {
  return user.role === 'admin' || isProjectMember(user, project)
}
