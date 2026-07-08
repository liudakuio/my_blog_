<!-- 主布局：包含导航栏、音乐播放器、页面路由视图、页脚、重力特效重置按钮 -->
<template>
  <!-- 全局容器：深色/浅色主题切换、文字选中颜色、禁止横向滚动 -->
  <div class="app-root">
    <MusicPlayer />
    <SidebarNav />
    <!-- 主内容区：顶部留出导航栏空间，底部留出页脚空间 -->
    <main class="main-content">
      <!-- 路由视图：带页面切换过渡动画（模糊+位移） -->
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <!-- 页脚：版权信息 + 设计声明 -->
      <footer class="footer">
        <p>&copy; 2026 刘中魁</p>
        <p>{{ contactContent.footerDesign }}</p>
      </footer>
    </main>
    <!-- 重力特效激活时显示的重置按钮（固定在底部居中） -->
    <div v-if="appStore.gravityActive" class="gravity-reset-wrap">
      <button class="gravity-reset-btn" @click="resetGravity">
        <el-icon :size="24"><Refresh /></el-icon>
        {{ appStore.language === 'zh' ? '变回去' : 'Go Back' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { CONTACT_DATA } from '@/data/home'
import SidebarNav from './components/SidebarNav.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'

const appStore = useAppStore()
// 联系方式数据（用于页脚设计声明文案）
const contactContent = computed(() => CONTACT_DATA[appStore.language])

// 重置重力特效：关闭特效状态，由 PortfolioGrid 等组件监听处理
function resetGravity() {
  appStore.setGravityActive(false)
}
</script>

<style lang="less" scoped>
/* 全局容器：最小高度、背景/文字色、禁止横向滚动、选中色 */
.app-root {
  min-height: 100vh;
  background: #ffffff;
  color: #000000;
  font-family: 'OPPO Sans', Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow-x: hidden;
  transition: background-color 0.3s, color 0.3s;

  ::selection {
    background: #000000;
    color: #ffffff;
  }

  .dark & {
    background: #000000;
    color: #ffffff;

    ::selection {
      background: #ffffff;
      color: #000000;
    }
  }
}

/* 主内容区：顶部留出导航栏空间，底部留出页脚空间 */
.main-content {
  width: 100%;
  padding-top: 10rem;
  padding-bottom: 8rem;
}

/* 页脚：版权信息 + 设计声明，移动端纵向、桌面端横向 */
.footer {
  width: 100%;
  max-width: 96vw;
  margin: 8rem auto 0;
  padding-top: 3rem;
  border-top: 2px solid #000000;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: #9ca3af;
  transition: color 0.3s, border-color 0.3s;

  .dark & {
    border-color: #ffffff;
    color: #6b7280;
  }

  @media (min-width: 768px) {
    flex-direction: row;
  }
}

/* 重力特效重置按钮外层：固定底部居中，默认不拦截点击 */
.gravity-reset-wrap {
  position: fixed;
  bottom: 2rem;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 1001;
  pointer-events: none;
}

/* 重力特效重置按钮 */
.gravity-reset-btn {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.1);
  }

  .dark & {
    background: #ffffff;
    color: #000000;
  }
}

/* 页面切换过渡动画：进入时从下方模糊淡入，离开时向上模糊淡出 */
.page-enter-active {
  animation: pageIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.page-leave-active {
  animation: pageOut 0.25s ease-in both;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(6px) scale(0.995); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes pageOut {
  from { opacity: 1; transform: none; filter: blur(0); }
  to { opacity: 0; transform: translateY(-6px) scale(0.995); filter: blur(4px); }
}
</style>
