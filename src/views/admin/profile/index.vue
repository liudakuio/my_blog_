<!-- 个人中心：账号信息 + 权限 + 退出登录 -->
<template>
  <div class="profile">
    <section class="card account">
      <div class="avatar">{{ avatarText }}</div>
      <div class="account-info">
        <h2 class="name">{{ username }}</h2>
        <p class="uid">用户 ID：{{ userId || '—' }}</p>
      </div>
      <button class="logout-btn" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon> 退出登录
      </button>
    </section>

    <section class="card">
      <h3 class="card-title">权限标识</h3>
      <div class="perm-tags">
        <el-tag v-for="p in permissions" :key="p" class="perm-tag" effect="plain">{{ p }}</el-tag>
        <span v-if="!permissions.length" class="empty">暂无权限数据</span>
      </div>
    </section>

    <section class="card note">
      <h3 class="card-title">安全说明</h3>
      <p>· 登录采用无状态 JWT，令牌由前端保存在本地存储中。</p>
      <p>· 后端按角色动态下发菜单与权限，前端仅作展示与读写降级。</p>
      <p>· 敏感操作（新增 / 修改 / 删除）需具备对应 <code>blog:资源:edit</code> 权限。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const { username, userInfo, permissions } = storeToRefs(userStore)

const userId = computed(() => userInfo.value?.userId)
const avatarText = computed(() => (username.value ? username.value.charAt(0).toUpperCase() : 'A'))

function handleLogout() {
  userStore.logout()
}
</script>

<style lang="less" scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 860px;
}

.card {
  background: #ffffff;
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 22px 26px;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.account {
  display: flex;
  align-items: center;
  gap: 18px;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 24px;

  .dark & {
    background: #fff;
    color: #141414;
  }
}

.account-info {
  flex: 1;
}

.name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;

  .dark & {
    color: #f0f0f0;
  }
}

.uid {
  margin: 4px 0 0;
  font-size: 13px;
  color: #9ca3af;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e5e5e5;
  background: transparent;
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 14px;
  color: #ef4444;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s;

  &:hover {
    background: rgba(239, 68, 68, 0.08);
    border-color: #ef4444;
  }
}

.card-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;

  .dark & {
    color: #f0f0f0;
  }
}

.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.perm-tag {
  border-radius: 8px;
  font-family: monospace;
}

.empty {
  font-size: 13px;
  color: #9ca3af;
}

.note {
  p {
    margin: 6px 0;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.7;

    .dark & {
      color: #b5b5b5;
    }
  }

  code {
    background: #f2f2f2;
    padding: 1px 6px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;

    .dark & {
      background: #232323;
    }
  }
}
</style>
