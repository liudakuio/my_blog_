<!-- 后台管理框架：左侧可折叠菜单 + 顶部导航 + 内容区 -->
<template>
  <div class="admin-layout">
    <Sidebar :collapsed="collapsed" />
    <div class="admin-main">
      <Navbar :collapsed="collapsed" @toggle="collapsed = !collapsed" />
      <main class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'

// 侧边栏折叠态：<1280px 默认折叠
const collapsed = ref(window.innerWidth < 1280)
</script>

<style lang="less" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-content {
  flex: 1;
  padding: 22px 26px 40px;
  background: #f7f7f8;

  .dark & {
    background: #0f0f0f;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
