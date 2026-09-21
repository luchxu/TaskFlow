import { createInitialDemoData, type DemoDatabase } from './data'

const STORAGE_KEY = 'taskflow:demo-database'
const DATABASE_VERSION = 1

interface StoredDemoDatabase {
  version: number
  data: DemoDatabase
}

let memoryDatabase: StoredDemoDatabase | null = null

function cloneDatabase(data: DemoDatabase): DemoDatabase {
  return JSON.parse(JSON.stringify(data)) as DemoDatabase
}

function createStoredDatabase(): StoredDemoDatabase {
  return {
    version: DATABASE_VERSION,
    data: createInitialDemoData(),
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function isStoredDemoDatabase(value: unknown): value is StoredDemoDatabase {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<StoredDemoDatabase>

  return (
    candidate.version === DATABASE_VERSION &&
    !!candidate.data &&
    Array.isArray(candidate.data.users) &&
    Array.isArray(candidate.data.projects) &&
    Array.isArray(candidate.data.tasks) &&
    Array.isArray(candidate.data.tags) &&
    Array.isArray(candidate.data.comments)
  )
}

function writeStoredDatabase(database: StoredDemoDatabase): void {
  const storage = getBrowserStorage()

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(database))
    return
  }

  memoryDatabase = database
}

function readStoredDatabase(): StoredDemoDatabase | null {
  const storage = getBrowserStorage()

  if (!storage) {
    return memoryDatabase
  }

  const rawValue = storage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue)
    return isStoredDemoDatabase(parsedValue) ? parsedValue : null
  } catch {
    return null
  }
}

/** 读取演示数据。首次读取或本地数据失效时会自动写入初始数据。 */
export function getDemoData(): DemoDatabase {
  const storedDatabase = readStoredDatabase()

  if (storedDatabase) {
    return cloneDatabase(storedDatabase.data)
  }

  const initialDatabase = createStoredDatabase()
  writeStoredDatabase(initialDatabase)
  return cloneDatabase(initialDatabase.data)
}

/** 保存完整数据快照。后续 Mock API 的增删改操作会调用此方法。 */
export function saveDemoData(data: DemoDatabase): DemoDatabase {
  const snapshot = cloneDatabase(data)

  writeStoredDatabase({
    version: DATABASE_VERSION,
    data: snapshot,
  })

  return cloneDatabase(snapshot)
}

/** 丢弃用户修改并恢复初始演示数据。 */
export function resetDemoData(): DemoDatabase {
  const initialDatabase = createStoredDatabase()
  writeStoredDatabase(initialDatabase)
  return cloneDatabase(initialDatabase.data)
}
