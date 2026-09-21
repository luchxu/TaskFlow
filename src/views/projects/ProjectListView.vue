<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAuthStore, useWorkspaceStore } from '@/stores'
import { canViewProject } from '@/utils/permissions'

const router = useRouter()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()

void workspaceStore.initialize()

const visibleProjects = computed(() => {
  if (!authStore.user) return []
  return workspaceStore.projects.filter((project) => canViewProject(authStore.user!, project))
})

const visibleProjectIds = computed(() => new Set(visibleProjects.value.map((project) => project.id)))
const visibleTasks = computed(() =>
  workspaceStore.database.tasks.filter((task) => visibleProjectIds.value.has(task.projectId)),
)

const taskStats = computed(() => {
  const tasks = visibleTasks.value
  const done = tasks.filter((task) => task.status === 'done').length

  return {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    doing: tasks.filter((task) => task.status === 'doing').length,
    done,
    completionRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  }
})

const recentTasks = computed(() =>
  [...visibleTasks.value]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 5),
)

const statusLabels = { todo: '待处理', doing: '进行中', done: '已完成' } as const
const priorityLabels = { low: '低', medium: '中', high: '高' } as const

function getProjectName(projectId: string): string {
  return workspaceStore.projects.find((project) => project.id === projectId)?.name ?? '未知项目'
}

function openTaskProject(projectId: string): void {
  void router.push({ name: 'project-detail', params: { projectId } })
}

async function handleLogout(): Promise<void> {
  await authStore.logout()
  await router.replace('/login')
}

async function handleReset(): Promise<void> {
  await ElMessageBox.confirm('当前修改将被清除，确定恢复初始演示数据吗？', '重置演示数据', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning',
  })
  workspaceStore.resetWorkspace()
  ElMessage.success('演示数据已恢复')
}
</script>

<template>
  <div class="projects-page">
    <header class="topbar">
      <a class="logo" href="/projects">TaskFlow</a>
      <div class="account-actions">
        <span>{{ authStore.user?.name }}</span>
        <el-button @click="handleReset">重置数据</el-button>
        <el-button @click="handleLogout">退出登录</el-button>
      </div>
    </header>

    <main class="projects-content">
      <div class="page-heading">
        <div>
          <p class="eyebrow">工作空间</p>
          <h1>工作概览</h1>
          <p class="welcome-copy">{{ authStore.user?.name }}，这里是团队当前的项目与任务进展。</p>
        </div>
      </div>

      <section class="metric-grid" aria-label="任务统计">
        <div class="metric"><span>项目</span><strong>{{ visibleProjects.length }}</strong><small>我参与的项目</small></div>
        <div class="metric"><span>全部任务</span><strong>{{ taskStats.total }}</strong><small>{{ taskStats.todo }} 项待处理</small></div>
        <div class="metric"><span>进行中</span><strong>{{ taskStats.doing }}</strong><small>团队正在推进</small></div>
        <div class="metric"><span>完成率</span><strong>{{ taskStats.completionRate }}%</strong><small>{{ taskStats.done }} 项已完成</small></div>
      </section>

      <section class="dashboard-grid">
        <div class="status-panel">
          <header class="section-heading"><div><p class="section-kicker">任务状态</p><h2>整体进度</h2></div><span>{{ taskStats.total }} 项任务</span></header>
          <div class="status-rows">
            <div class="status-row"><div><span class="status-dot todo" />待处理</div><strong>{{ taskStats.todo }}</strong><div class="progress-track"><span class="todo-bar" :style="{ width: `${taskStats.total ? taskStats.todo / taskStats.total * 100 : 0}%` }" /></div></div>
            <div class="status-row"><div><span class="status-dot doing" />进行中</div><strong>{{ taskStats.doing }}</strong><div class="progress-track"><span class="doing-bar" :style="{ width: `${taskStats.total ? taskStats.doing / taskStats.total * 100 : 0}%` }" /></div></div>
            <div class="status-row"><div><span class="status-dot done" />已完成</div><strong>{{ taskStats.done }}</strong><div class="progress-track"><span class="done-bar" :style="{ width: `${taskStats.total ? taskStats.done / taskStats.total * 100 : 0}%` }" /></div></div>
          </div>
        </div>

        <div class="recent-panel">
          <header class="section-heading"><div><p class="section-kicker">最近动态</p><h2>最近更新的任务</h2></div></header>
          <div class="recent-list">
            <button v-for="task in recentTasks" :key="task.id" class="recent-task" @click="openTaskProject(task.projectId)">
              <span class="recent-main"><strong>{{ task.title }}</strong><small>{{ getProjectName(task.projectId) }}</small></span>
              <span class="task-meta"><i :class="['priority-mark', task.priority]">{{ priorityLabels[task.priority] }}</i><em>{{ statusLabels[task.status] }}</em></span>
            </button>
          </div>
        </div>
      </section>

      <header class="projects-heading"><div><p class="section-kicker">项目</p><h2>参与的项目</h2></div><span>{{ visibleProjects.length }} 个项目</span></header>

      <div class="project-grid">
        <article
          v-for="project in visibleProjects"
          :key="project.id"
          class="project-card"
          tabindex="0"
          @click="router.push({ name: 'project-detail', params: { projectId: project.id } })"
          @keyup.enter="router.push({ name: 'project-detail', params: { projectId: project.id } })"
        >
          <div class="project-accent" />
          <div class="project-card-body">
            <h2>{{ project.name }}</h2>
            <p>{{ project.description }}</p>
            <footer>
              <span>{{ project.memberIds.length }} 位成员</span>
              <span>{{ workspaceStore.database.tasks.filter((task) => task.projectId === project.id).length }} 项任务</span>
            </footer>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<style scoped>
.projects-page { min-height: 100vh; background: #f5f6f8; color: #17202d; }
.topbar { height: 64px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dfe3e8; background: #fff; }
.logo { color: #17202d; font-size: 18px; font-weight: 750; text-decoration: none; }
.account-actions { display: flex; align-items: center; gap: 12px; color: #596273; font-size: 14px; }
.projects-content { width: min(1120px, calc(100% - 48px)); margin: 0 auto; padding: 52px 0; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
.eyebrow { margin: 0 0 7px; color: #16856d; font-size: 13px; font-weight: 700; }
h1 { margin: 0; font-size: 30px; letter-spacing: 0; }
.welcome-copy { margin: 9px 0 0; color: #687284; font-size: 14px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #dfe3e8; border-radius: 6px; background: #fff; }
.metric { min-width: 0; padding: 20px 24px; border-right: 1px solid #e5e7eb; }.metric:last-child { border-right: 0; }.metric span, .metric small { display: block; color: #737d8c; font-size: 12px; }.metric strong { display: block; margin: 7px 0 5px; font-size: 27px; line-height: 1; }
.dashboard-grid { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.35fr); gap: 16px; margin: 16px 0 40px; }.status-panel, .recent-panel { border: 1px solid #dfe3e8; border-radius: 6px; background: #fff; }.status-panel { padding: 22px; }.section-heading, .projects-heading { display: flex; align-items: center; justify-content: space-between; }.section-heading h2, .projects-heading h2 { margin: 2px 0 0; font-size: 16px; }.section-heading > span, .projects-heading > span { color: #7a8492; font-size: 12px; }.section-kicker { margin: 0; color: #16856d; font-size: 11px; font-weight: 700; }.status-rows { display: grid; gap: 19px; margin-top: 24px; }.status-row { display: grid; grid-template-columns: 90px 28px 1fr; align-items: center; gap: 10px; font-size: 13px; }.status-row > div:first-child { display: flex; align-items: center; gap: 8px; }.status-dot { width: 8px; height: 8px; border-radius: 50%; }.status-dot.todo { background: #98a2b3; }.status-dot.doing { background: #d28a16; }.status-dot.done { background: #16856d; }.progress-track { overflow: hidden; height: 7px; border-radius: 4px; background: #edf0f3; }.progress-track span { display: block; height: 100%; border-radius: inherit; }.todo-bar { background: #98a2b3; }.doing-bar { background: #d28a16; }.done-bar { background: #16856d; }
.recent-panel { overflow: hidden; }.recent-panel .section-heading { padding: 22px 22px 14px; }.recent-list { display: grid; }.recent-task { width: 100%; min-height: 58px; padding: 11px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border: 0; border-top: 1px solid #eef0f2; color: #17202d; background: transparent; cursor: pointer; text-align: left; }.recent-task:hover { background: #f7f9fa; }.recent-main { min-width: 0; }.recent-main strong, .recent-main small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.recent-main strong { font-size: 13px; }.recent-main small { margin-top: 4px; color: #7a8492; font-size: 11px; }.task-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }.task-meta em, .priority-mark { font-size: 11px; font-style: normal; }.task-meta em { color: #687284; }.priority-mark { width: 20px; height: 20px; display: grid; place-items: center; border-radius: 3px; background: #eef0f2; }.priority-mark.high { color: #c2413b; background: #fff0ef; }.priority-mark.medium { color: #a66b13; background: #fff7df; }.projects-heading { margin-bottom: 14px; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; }
.project-card { overflow: hidden; display: grid; grid-template-columns: 5px 1fr; min-height: 160px; border: 1px solid #dfe3e8; border-radius: 6px; background: #fff; cursor: pointer; transition: border-color .15s, box-shadow .15s; }.project-card:hover, .project-card:focus-visible { border-color: #98bdb5; box-shadow: 0 5px 18px rgb(23 32 45 / 7%); outline: none; }
.project-accent { background: #1b8f76; }
.project-card-body { padding: 24px; display: flex; flex-direction: column; }
.project-card h2 { margin: 0 0 10px; font-size: 18px; letter-spacing: 0; }
.project-card p { flex: 1; margin: 0; color: #687284; line-height: 1.65; }
.project-card footer { margin-top: 24px; display: flex; gap: 18px; color: #737d8c; font-size: 13px; }
@media (max-width: 640px) {
  .topbar { height: auto; padding: 16px 20px; align-items: flex-start; }
  .account-actions { flex-wrap: wrap; justify-content: flex-end; }
  .account-actions span { width: 100%; text-align: right; }
  .projects-content { width: calc(100% - 32px); padding: 32px 0; }
  .metric-grid { grid-template-columns: 1fr 1fr; }.metric:nth-child(2) { border-right: 0; }.metric:nth-child(-n+2) { border-bottom: 1px solid #e5e7eb; }.dashboard-grid { grid-template-columns: 1fr; }.status-row { grid-template-columns: 82px 22px 1fr; }
}
@media (max-width: 900px) and (min-width: 641px) { .dashboard-grid { grid-template-columns: 1fr; } }
</style>
