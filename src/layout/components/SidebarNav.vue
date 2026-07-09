<!-- 顶部导航栏：Logo、页面导航、主题切换，滚动时自动变为胶囊样式 -->
<template>
  <div class="navbar-wrapper">
    <!-- 导航栏主体：滚动后变为胶囊毛玻璃样式，未滚动时全宽透明 -->
    <nav class="navbar" :class="{ 'navbar--scrolled': isScrolled }">
      <!-- Logo：点击回到主页 -->
      <div class="logo" @click="goTo('dashboard')">
        <h1 class="logo-title" :class="{ 'logo-title--scrolled': isScrolled }">
          刘中魁 <span class="logo-subtitle"></span>
        </h1>
      </div>

      <!-- 右侧导航区：菜单项 + 分隔线 + 功能按钮 -->
      <div class="navbar-menu" :class="{ 'navbar-menu--scrolled': isScrolled }">
        <!-- 页面导航按钮：当前页高亮 + 底部下划线动画 -->
        <button
          v-for="item in navItems"
          :key="item.id"
          class="navbar-item"
          :class="{ 'navbar-item--active': appStore.activeTab === item.id }"
          @click="goTo(item.id)"
        >
          {{ item.label }}
          <!-- 下划线指示器：当前页展开，hover 时展开 -->
          <span
            class="navbar-item-underline"
            :class="{ 'navbar-item-underline--active': appStore.activeTab === item.id }"
          ></span>
        </button>

        <!-- 分隔线 -->
        <div class="navbar-divider"></div>

        <!-- 功能按钮组 -->
        <div class="navbar-actions">
          <!-- 语言切换按钮：切换中文 / English -->
          <button class="lang-btn" @click="appStore.toggleLanguage()">
            {{ appStore.language === 'zh' ? '中' : 'EN' }}
          </button>
          <!-- 主题切换按钮：浅色时显示月亮图标，深色时显示太阳图标 -->
          <button class="theme-btn" @click="appStore.toggleTheme()">
            <el-icon :size="20">
              <Moon v-if="appStore.theme === 'light'" />
              <Sunny v-else />
            </el-icon>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { NAV_ITEMS } from '@/data/navigation'

const router = useRouter()
const appStore = useAppStore()
// 是否已滚动（用于切换导航栏样式）
const isScrolled = ref(false)

// 导航菜单项（根据当前语言切换）
const navItems = computed(() => NAV_ITEMS[appStore.language])

// 跳转到指定页签：更新 store 状态 + 路由跳转 + 回到顶部
function goTo(tab: string) {
  appStore.setActiveTab(tab)
  router.push({ name: tab.charAt(0).toUpperCase() + tab.slice(1) })
  window.scrollTo(0, 0)
}

// 监听滚动事件：超过 120px 时切换为胶囊样式
let scrollHandler: (() => void) | null = null

onMounted(() => {
  scrollHandler = () => {
    isScrolled.value = window.scrollY > 120
  }
  window.addEventListener('scroll', scrollHandler)
})

onUnmounted(() => {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<style lang="less" scoped>
/* 导航栏外层：固定顶部居中，滚动时 padding 变化 */
.navbar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  transition: all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1);

  @media (min-width: 768px) {
    padding-top: 1.5rem;
  }
}

/* 导航栏主体：未滚动全宽透明，滚动后胶囊毛玻璃 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 96vw;
  padding: 0.5rem 0;
  background: transparent;
  border: 1px solid transparent;
  box-shadow: none;
  backdrop-filter: none;
  transition: all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1);

  &.navbar--scrolled {
    width: 92vw;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);

    .dark & {
      background: rgba(0, 0, 0, 0.9);
      border-color: #1f2937;
      box-shadow: 0 4px 20px rgba(255, 255, 255, 0.05);
    }

    @media (min-width: 768px) {
      width: auto;
      gap: 3rem;
      padding: 1rem 2.5rem;
      border-radius: 9999px;
    }
  }
}

/* Logo：点击回到主页 */
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  cursor: pointer;
}

/* Logo 标题：滚动后字号变小 */
.logo-title {
  font-weight: 900;
  letter-spacing: -0.05em;
  text-transform: uppercase;
  line-height: 1;
  color: #000000;
  font-size: clamp(1.25rem, 3vw, 3rem);
  transition: all 0.5s ease-in-out;

  .dark & {
    color: #ffffff;
  }

  &.logo-title--scrolled {
    font-size: 1.25rem;

    @media (min-width: 768px) {
      font-size: 1.875rem;
    }
  }
}

/* Logo 副标题：小屏隐藏，sm 以上显示 */
.logo-subtitle {
  display: none;

  @media (min-width: 640px) {
    display: inline;
  }
}

/* 右侧菜单区：横向滚动 + 渐隐遮罩 */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  transition: all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1);


  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    gap: 3rem;
  }

  &.navbar-menu--scrolled {
    gap: 0.5rem;

    @media (min-width: 768px) {
      gap: 2rem;
    }
  }
}

/* 导航菜单项 */
.navbar-item {
  position: relative;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  white-space: nowrap;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #000000;
  }

  .dark & {
    color: #6b7280;

    &:hover {
      color: #ffffff;
    }
  }

  &.navbar-item--active {
    color: #000000;

    .dark & {
      color: #ffffff;
    }
  }

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}

/* 导航菜单项下划线指示器 */
.navbar-item-underline {
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  width: 100%;
  height: 2px;
  background: #000000;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.2s;

  .dark & {
    background: #ffffff;
  }

  .navbar-item:hover & {
    transform: scaleX(1);
  }

  &.navbar-item-underline--active {
    transform: scaleX(1);
  }

  @media (min-width: 768px) {
    height: 3px;
  }
}

/* 导航分隔线 */
.navbar-divider {
  flex-shrink: 0;
  width: 1px;
  height: 1.5rem;
  margin: 0 0.5rem;
  background: #e5e7eb;

  .dark & {
    background: #374151;
  }

  @media (min-width: 768px) {
    height: 2rem;
  }
}

/* 功能按钮组 */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (min-width: 768px) {
    gap: 1rem;
  }
}

/* 主题切换按钮 */
.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  background: none;
  border-radius: 9999px;
  color: #000000;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: #f3f4f6;
  }

  .dark & {
    color: #ffffff;

    &:hover {
      background: #1f2937;
    }
  }

  @media (min-width: 768px) {
    padding: 0.5rem;
  }
}

/* 语言切换按钮：显示当前语言，点击切换中/英 */
.lang-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e7eb;
  background: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.025em;
  color: #000000;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background: #f3f4f6;
  }

  .dark & {
    border-color: #374151;
    color: #ffffff;

    &:hover {
      background: #1f2937;
    }
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    min-width: 2.75rem;
  }
}
</style>
