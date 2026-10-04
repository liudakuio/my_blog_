<!--
  登录页：居中卡片 + 账号密码，博客极简黑白风格
  数据来源：提交用户名密码调用 userStore.login() -> POST /api/auth/login，成功后写入 localStorage 的 token。
  跳转：登录成功进 /admin，由 router.beforeEach 负责拉取用户信息与菜单并注入动态路由。
  注意：该路由无需登录即可访问（守卫中对 /admin/login 单独放行）。
-->
<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="logo">L</div>
        <h1 class="title">博客控制台</h1>
        <p class="subtitle">LOGIN TO CONTINUE</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input v-model="form.username" size="large" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            show-password
            placeholder="密码"
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <button class="login-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      </el-form>
    </div>

    <footer class="login-footer">© 2026 My Blog · 内容运营控制台</footer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({ username: '', password: '' })
const formRef = ref()
const loading = ref(false)

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (loading.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push('/admin')
  } catch (e) {
    // 错误信息已由响应拦截器提示
  } finally {
    loading.value = false
  }
}
</script>

<style lang="less" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(0, 0, 0, 0.04), transparent 60%),
    #f7f7f8;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 28px 28px, 28px 28px;

  .dark & {
    background-color: #0f0f0f;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  }
}

.login-card {
  width: 380px;
  max-width: 90vw;
  background: #ffffff;
  border: 1px solid #ececec;
  border-radius: 18px;
  padding: 38px 34px 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  animation: rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.brand {
  text-align: center;
  margin-bottom: 26px;
}

.logo {
  width: 46px;
  height: 46px;
  margin: 0 auto 12px;
  border-radius: 13px;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 22px;

  .dark & {
    background: #fff;
    color: #141414;
  }
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;

  .dark & {
    color: #f0f0f0;
  }
}

.subtitle {
  margin: 6px 0 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: #9ca3af;
}

.login-form {
  :deep(.el-input__wrapper) {
    border-radius: 11px;
    background: #f7f7f8;
    box-shadow: none;
    border: 1px solid #ececec;

    .dark & {
      background: #1d1d1d;
      border-color: #2a2a2a;
    }
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  margin-top: 6px;
  border: none;
  border-radius: 11px;
  background: #1a1a1a;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.1em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s, transform 0.1s;

  &:hover {
    opacity: 0.88;
  }
  &:active {
    transform: scale(0.99);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .dark & {
    background: #ffffff;
    color: #141414;
  }
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;

  .dark & {
    border-color: rgba(0, 0, 0, 0.3);
    border-top-color: #141414;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  margin-top: 26px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
