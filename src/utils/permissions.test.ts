import { describe, expect, it } from 'vitest'
import { canDeleteTask, canEditTask, canViewProject } from './permissions'
import type { Project, Task, User } from '@/types'

const project: Project = {
  id: 'project-1',
  name: '测试项目',
  description: '',
  ownerId: 'owner-1',
  memberIds: ['admin-1', 'owner-1', 'member-1', 'member-2'],
  createdAt: '2026-01-01T00:00:00.000Z',
}

const task: Task = {
  id: 'task-1',
  projectId: project.id,
  title: '测试任务',
  description: '',
  status: 'todo',
  priority: 'medium',
  assigneeId: 'member-1',
  tagIds: [],
  createdBy: 'owner-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const user = (id: string, role: User['role']): User => ({
  id,
  name: id,
  email: `${id}@test.dev`,
  role,
})

describe('task permissions', () => {
  it('管理员可以编辑和删除所有项目任务', () => {
    const admin = user('admin-1', 'admin')
    expect(canEditTask(admin, project, task)).toBe(true)
    expect(canDeleteTask(admin, project)).toBe(true)
  })

  it('项目负责人可以编辑和删除当前项目任务', () => {
    const owner = user('owner-1', 'owner')
    expect(canEditTask(owner, project, task)).toBe(true)
    expect(canDeleteTask(owner, project)).toBe(true)
  })

  it('普通成员只能编辑自己负责的任务，不能删除任务', () => {
    const assignee = user('member-1', 'member')
    const otherMember = user('member-2', 'member')
    expect(canEditTask(assignee, project, task)).toBe(true)
    expect(canEditTask(otherMember, project, task)).toBe(false)
    expect(canDeleteTask(assignee, project)).toBe(false)
  })
})

describe('project visibility', () => {
  it('管理员可以查看所有项目', () => {
    expect(canViewProject(user('another-admin', 'admin'), project)).toBe(true)
  })

  it('项目成员可以查看参与的项目', () => {
    expect(canViewProject(user('member-1', 'member'), project)).toBe(true)
  })

  it('无关成员不能查看项目', () => {
    expect(canViewProject(user('outsider', 'member'), project)).toBe(false)
  })
})
