import { isRealApi } from './mode'
import { mockWorkspaceApi } from './mock-workspace'
import { realWorkspaceApi } from './real-workspace'

export const workspaceApi = isRealApi ? realWorkspaceApi : mockWorkspaceApi
