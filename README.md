# TaskFlow

TaskFlow 是一个面向前端面试的团队任务协作平台 MVP，使用 Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus 和 Axios 构建。

## 学习与面试材料

- [项目吃透指南](docs/TASKFLOW_GUIDE.md)：从业务、数据流、架构取舍、异常处理、自测到发布完整理解项目
- [面试问答](docs/INTERVIEW_QA.md)：口语化回答、常见追问、方案代价和项目诚实边界

## 已实现

- Mock 登录、退出登录和会话恢复
- 项目列表与项目详情
- 三列看板和原生拖拽改状态
- 任务新增、编辑、删除、负责人和标签
- 关键词搜索（250ms 防抖）及多条件筛选
- 任务详情、评论发布
- 管理员、项目负责人、普通成员权限
- Mock 数据持久化与重置演示数据
- Axios 请求客户端、Token 注入和统一错误转换
- 深色模式

## 启动

```bash
npm install
npm run dev
```

演示账号密码统一为 `TaskFlow123`：

- `admin@taskflow.dev`：管理员
- `owner@taskflow.dev`：项目负责人
- `member1@taskflow.dev`：普通成员

## 架构

```text
页面组件 -> Pinia Store -> API 模块 -> Mock 数据层
                                  └-> 未来 Axios 真实接口
```

页面不直接读写 localStorage；数据持久化集中在 Mock 数据层。接入后端时替换 API 实现即可。

## 验证

```bash
npm run build
npm run test:run
```
