<!--
  用户下拉：头像 + 用户名 + 个人中心 / 退出登录
  行为：「个人中心」跳 /admin/profile；「退出登录」调 userStore.logout()（清 token 后跳登录页）。
-->
<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div class="user-trigger">
      <div class="avatar">{{ avatarText }}</div>
      <span class="username">{{ username }}</span>
      <el-icon class="arrow"><ArrowDown /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="profile">
          <el-icon><User /></el-icon> 个人中心
        </el-dropdown-item>
        <el-dropdown-item command="logout" divided>
          <el-icon><SwitchButton /></el-icon> 退出登录
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const { username } = storeToRefs(userStore)

const avatarText = computed(() => (username.value ? username.value.charAt(0).toUpperCase() : 'A'))

function handleCommand(cmd: string) {
  if (cmd === 'profile') {
    router.push('/admin/profile')
  } else if (cmd === 'logout') {
    userStore.logout()
  }
}
</script>

<style lang="less" scoped>
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 10px;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }

  .dark & {
    &:hover {
      background: #232323;
    }
  }
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;

  .dark & {
    background: #fff;
    color: #141414;
  }
}

.username {
  font-size: 14px;
  color: #1a1a1a;
  white-space: nowrap;

  .dark & {
    color: #f0f0f0;
  }
}

.arrow {
  font-size: 12px;
  color: #9ca3af;
}
</style>
