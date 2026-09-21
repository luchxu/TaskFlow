<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores'
import type { LoginCredentials } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()

const form = reactive<LoginCredentials>({
  email: 'owner@taskflow.dev',
  password: 'TaskFlow123',
})

const rules: FormRules<LoginCredentials> = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin(): Promise<void> {
  const isValid = await formRef.value?.validate().catch(() => false)

  if (!isValid) {
    return
  }

  try {
    await authStore.login(form)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/projects'
    await router.replace(redirect)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-brand" aria-labelledby="brand-title">
      <div class="brand-mark">TF</div>
      <div>
        <p class="brand-name">TaskFlow</p>
        <h1 id="brand-title">让团队工作清晰流动</h1>
        <p class="brand-description">集中管理项目、任务与协作进度。</p>
      </div>
      <p class="brand-footnote">团队任务协作平台</p>
    </section>

    <section class="login-panel">
      <div class="login-form-wrap">
        <header>
          <p class="eyebrow">欢迎回来</p>
          <h2>登录工作空间</h2>
        </header>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" size="large" autocomplete="email" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              autocomplete="current-password"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-button
            class="submit-button"
            native-type="submit"
            type="primary"
            size="large"
            :loading="authStore.isLoading"
          >
            登录
          </el-button>
        </el-form>

        <p class="demo-account">演示账号：owner@taskflow.dev　密码：TaskFlow123</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(320px, 42%) 1fr;
  background: #f7f8fa;
}

.login-brand {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(32px, 6vw, 80px);
  color: #f8fafc;
  background: #18212f;
}

.brand-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid #4d5f73;
  border-radius: 8px;
  color: #8fd4c2;
  font-weight: 700;
}

.brand-name,
.eyebrow {
  margin: 0 0 12px;
  color: #73c9b3;
  font-size: 14px;
  font-weight: 700;
}

.login-brand h1 {
  max-width: 520px;
  margin: 0;
  font-size: clamp(38px, 5vw, 68px);
  line-height: 1.12;
  letter-spacing: 0;
}

.brand-description {
  margin: 24px 0 0;
  color: #b7c2d0;
  font-size: 18px;
}

.brand-footnote {
  margin: 0;
  color: #8493a5;
  font-size: 13px;
}

.login-panel {
  display: grid;
  place-items: center;
  padding: 32px;
}

.login-form-wrap {
  width: min(100%, 400px);
}

.login-form-wrap header {
  margin-bottom: 34px;
}

.login-form-wrap h2 {
  margin: 0;
  color: #17202d;
  font-size: 30px;
  letter-spacing: 0;
}

.submit-button {
  width: 100%;
  margin-top: 8px;
}

.demo-account {
  margin: 22px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-brand {
    min-height: 260px;
    padding: 28px 24px;
  }

  .login-brand h1 {
    font-size: 36px;
  }

  .brand-footnote {
    display: none;
  }

  .login-panel {
    padding: 40px 24px;
  }
}
</style>
