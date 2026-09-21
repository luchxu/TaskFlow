import type { Comment, Project, Tag, Task, User } from '../types'

export interface DemoDatabase {
  users: User[]
  projects: Project[]
  tasks: Task[]
  tags: Tag[]
  comments: Comment[]
}


export function createInitialDemoData(): DemoDatabase {
  return {
    users: [
      {
        id: 'user-admin',
        name: '林晓',
        email: 'admin@taskflow.dev',
        role: 'admin',
      },
      {
        id: 'user-owner',
        name: '陈默',
        email: 'owner@taskflow.dev',
        role: 'owner',
      },
      {
        id: 'user-member-1',
        name: '周然',
        email: 'member1@taskflow.dev',
        role: 'member',
      },
      {
        id: 'user-member-2',
        name: '许宁',
        email: 'member2@taskflow.dev',
        role: 'member',
      },
    ],
    projects: [
      {
        id: 'project-taskflow',
        name: 'TaskFlow 产品迭代',
        description: '完成团队任务协作项目',
        ownerId: 'user-owner',
        memberIds: ['user-admin', 'user-owner', 'user-member-1', 'user-member-2'],
        createdAt: '2026-09-01T01:00:00.000Z',
      },
      {
        id: 'project-website',
        name: '官网改版',
        description: '优化产品官网的信息结构、视觉设计和移动端体验。',
        ownerId: 'user-admin',
        memberIds: ['user-admin', 'user-member-2'],
        createdAt: '2026-08-18T03:30:00.000Z',
      },
    ],
    tags: [
      {
        id: 'tag-feature',
        projectId: 'project-taskflow',
        name: '功能',
        color: '#2563eb',
      },
      {
        id: 'tag-bug',
        projectId: 'project-taskflow',
        name: '缺陷',
        color: '#dc2626',
      },
      {
        id: 'tag-design',
        projectId: 'project-taskflow',
        name: '设计',
        color: '#7c3aed',
      },
      {
        id: 'tag-docs',
        projectId: 'project-taskflow',
        name: '文档',
        color: '#0891b2',
      },
      {
        id: 'tag-website-content',
        projectId: 'project-website',
        name: '内容',
        color: '#ca8a04',
      },
    ],
    tasks: [
      {
        id: 'task-login',
        projectId: 'project-taskflow',
        title: '完成登录和路由守卫',
        description: '实现 Mock 登录、会话恢复以及未登录用户的路由拦截。',
        status: 'done',
        priority: 'high',
        assigneeId: 'user-owner',
        tagIds: ['tag-feature'],
        createdBy: 'user-admin',
        createdAt: '2026-09-02T02:00:00.000Z',
        updatedAt: '2026-09-06T08:20:00.000Z',
      },
      {
        id: 'task-project-list',
        projectId: 'project-taskflow',
        title: '实现项目列表页',
        description: '展示当前用户可访问的项目，并处理加载、空数据和错误状态。',
        status: 'doing',
        priority: 'high',
        assigneeId: 'user-member-1',
        tagIds: ['tag-feature', 'tag-design'],
        createdBy: 'user-owner',
        createdAt: '2026-09-03T05:10:00.000Z',
        updatedAt: '2026-09-08T09:15:00.000Z',
      },
      {
        id: 'task-board-drag',
        projectId: 'project-taskflow',
        title: '支持看板任务拖拽',
        description: '拖拽结束后更新任务状态，并为接口失败预留回滚能力。',
        status: 'todo',
        priority: 'medium',
        assigneeId: 'user-member-2',
        tagIds: ['tag-feature'],
        createdBy: 'user-owner',
        createdAt: '2026-09-05T06:30:00.000Z',
        updatedAt: '2026-09-05T06:30:00.000Z',
      },
      {
        id: 'task-filter',
        projectId: 'project-taskflow',
        title: '增加任务搜索和筛选',
        description: '支持按关键词、状态、优先级、负责人和标签筛选任务。',
        status: 'todo',
        priority: 'medium',
        tagIds: ['tag-feature'],
        createdBy: 'user-owner',
        createdAt: '2026-09-06T07:00:00.000Z',
        updatedAt: '2026-09-06T07:00:00.000Z',
      },
      {
        id: 'task-readme',
        projectId: 'project-taskflow',
        title: '整理项目 README',
        description: '补充项目介绍、技术选型、启动方式和核心功能截图。',
        status: 'todo',
        priority: 'low',
        assigneeId: 'user-member-1',
        tagIds: ['tag-docs'],
        createdBy: 'user-admin',
        createdAt: '2026-09-07T04:40:00.000Z',
        updatedAt: '2026-09-07T04:40:00.000Z',
      },
      {
        id: 'task-home-copy',
        projectId: 'project-website',
        title: '重写首页核心文案',
        description: '精简首屏信息，明确产品定位和主要行动入口。',
        status: 'doing',
        priority: 'medium',
        assigneeId: 'user-member-2',
        tagIds: ['tag-website-content'],
        createdBy: 'user-admin',
        createdAt: '2026-08-20T02:20:00.000Z',
        updatedAt: '2026-09-04T03:10:00.000Z',
      },
    ],
    comments: [
      {
        id: 'comment-project-list-1',
        taskId: 'task-project-list',
        authorId: 'user-owner',
        content: '先完成项目卡片和空状态，统计信息可以放到下一轮。',
        createdAt: '2026-09-07T07:30:00.000Z',
      },
      {
        id: 'comment-project-list-2',
        taskId: 'task-project-list',
        authorId: 'user-member-1',
        content: '卡片布局已完成，正在补充移动端适配。',
        createdAt: '2026-09-08T09:15:00.000Z',
      },
      {
        id: 'comment-board-drag-1',
        taskId: 'task-board-drag',
        authorId: 'user-admin',
        content: '注意普通成员只能修改自己负责的任务状态。',
        createdAt: '2026-09-06T08:00:00.000Z',
      },
    ],
  }
}
