<!--
  顶部导航栏：Logo、页面导航、语言与主题切换，滚动时收拢为反色实心胶囊。
  数据来源：导航项来自 siteStore.navItems(language)（/api/site/config 的 nav，按 sort 排序、按当前语言解析文案）。
  注意：接口失败时导航为空，接口恢复后需刷新页面重新拉取（loadConfig 只成功一次即缓存）。
  交互：navItems 为空时（接口未就绪）回退到本地默认四项，避免导航栏只剩 Logo。
-->
<template>
  <div class="navbar-wrapper" :class="{ 'navbar-wrapper--scrolled': isScrolled }">
    <nav class="navbar" :class="{ 'navbar--scrolled': isScrolled }">
      <!-- Logo：点击回到主页 -->
      <button class="logo" @click="goTo('dashboard')">
        <span class="logo-mark" aria-hidden="true"></span>
        <span class="logo-title">刘中魁</span>
      </button>

      <!-- 右侧导航区：菜单项 + 分隔线 + 功能按钮 -->
      <div class="navbar-menu">
        <button
          v-for="item in navItems.length ? navItems : fallbackNav"
          :key="item.id"
          class="navbar-item"
          :class="{ 'navbar-item--active': appStore.activeTab === item.id }"
          @click="goTo(item.id)"
        >
          {{ item.label }}
          <span
            class="navbar-item-underline"
            :class="{ 'navbar-item-underline--active': appStore.activeTab === item.id }"
          ></span>
        </button>

        <span class="navbar-divider" aria-hidden="true"></span>

        <div class="navbar-actions">
          <!-- 语言切换：中 / EN -->
          <button class="icon-btn" :title="appStore.language === 'zh' ? 'English' : '中文'" @click="appStore.toggleLanguage()">
            {{ appStore.language === 'zh' ? '中' : 'EN' }}
          </button>
          <!-- 主题切换：浅色显示月亮，深色显示太阳 -->
          <button class="icon-btn" :title="appStore.theme === 'light' ? 'Dark' : 'Light'" @click="appStore.toggleTheme()">
            <el-icon :size="16">
              <Moon v-if="appStore.theme === 'light'" />
              <Sunny v-else />
            </el-icon>
          </button>
        </div>
      </div>

      <!-- 滚动进度条：贴在胶囊底部，宽度随页面滚动位置变化 -->
      <span class="navbar-progress" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></span>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { useSiteStore } from '@/store/site'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const siteStore = useSiteStore()

const isScrolled = ref(false)
const progress = ref(0)

// 导航菜单项：来自 /api/site/config，按当前语言解析文案
const navItems = computed(() => siteStore.navItems(appStore.language))

// 接口未就绪时的兜底导航，保证导航栏结构完整
const fallbackNav = computed(() => [
  { id: 'dashboard', label: appStore.language === 'zh' ? '首页' : 'Home' },
  { id: 'portfolio', label: appStore.language === 'zh' ? '作品' : 'Works' },
  { id: 'articles', label: appStore.language === 'zh' ? '文章' : 'Articles' },
  { id: 'contact', label: appStore.language === 'zh' ? '联系' : 'Contact' }
])

// 根据当前路由同步导航高亮：修复刷新 / 浏览器前进后退后高亮错位的问题
function syncActiveTab() {
  const name = String(route.name)
  let tab = name.charAt(0).toLowerCase() + name.slice(1)
  if (name === 'ArticleDetail') tab = 'articles'
  appStore.setActiveTab(tab)
}

// 跳转到指定页签：更新 store 状态 + 路由跳转 + 回到顶部
function goTo(tab: string) {
  appStore.setActiveTab(tab)
  router.push({ name: tab.charAt(0).toUpperCase() + tab.slice(1) })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

let scrollHandler: (() => void) | null = null

onMounted(() => {
  syncActiveTab()
  scrollHandler = () => {
    isScrolled.value = window.scrollY > 80
    // 滚动进度：已滚动距离 / 可滚动总距离
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(window.scrollY / max, 1) : 0
  }
  window.addEventListener('scroll', scrollHandler, { passive: true })
  scrollHandler()
})

// 路由变化时同步高亮（覆盖浏览器前进 / 后退按钮）
watch(() => route.name, () => syncActiveTab())

onUnmounted(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
})
</script>

<style lang="less" scoped>
.navbar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 1rem var(--gutter);
  transition: padding var(--dur-slow) var(--ease-out);

  @media (min-width: 768px) {
    padding: 1.5rem var(--gutter);
  }

  &.navbar-wrapper--scrolled {
    padding-top: 0.75rem;
  }
}

/* 导航栏主体：未滚动时全宽透明，滚动后收拢成反色实心胶囊 */
.navbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  max-width: var(--container);
  padding: 0.5rem 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0;
  transition: all var(--dur-slow) var(--ease-out);
  overflow: hidden;

  &.navbar--scrolled {
    width: auto;
    max-width: calc(100% - 1rem);
    padding: 0.5rem 0.75rem 0.5rem 1.25rem;
    background: var(--inverse-bg);
    color: var(--inverse-fg);
    border-color: var(--ink);
    border-radius: 999px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);

    @media (min-width: 768px) {
      padding: 0.625rem 1rem 0.625rem 2rem;
      gap: 2rem;
    }
  }
}

/* Logo */
.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
}

/* Logo 前的方块标记，滚动时变为强调色 */
.logo-mark {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border: 2px solid var(--accent);
  background: transparent;
  transition: background-color var(--dur) var(--ease-out);

  .navbar--scrolled & {
    background: var(--accent);
  }
}

.logo-title {
  font-family: var(--font-display);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--fg);
  font-size: 1.125rem;
  transition: font-size var(--dur-slow) var(--ease-out), color var(--dur) var(--ease-out);

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }

  .navbar--scrolled & {
    color: var(--inverse-fg);
    font-size: 1rem;

    @media (min-width: 768px) {
      font-size: 1.125rem;
    }
  }
}

/* 右侧菜单区 */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  transition: gap var(--dur-slow) var(--ease-out);

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    gap: 2rem;
  }
}

/* 导航项：等宽小字号，配合间距形成图纸感 */
.navbar-item {
  position: relative;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--fg-faint);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);

  &:hover {
    color: var(--fg);
  }

  .navbar--scrolled & {
    color: color-mix(in srgb, var(--inverse-fg) 55%, transparent);

    &:hover {
      color: var(--inverse-fg);
    }
  }

  &.navbar-item--active {
    color: var(--fg);

    .navbar--scrolled & {
      color: var(--inverse-fg);
    }
  }

  @media (min-width: 768px) {
    font-size: 0.75rem;
  }
}

/* 当前项下方的强调色下划线 */
.navbar-item-underline {
  position: absolute;
  bottom: -0.375rem;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--dur) var(--ease-out);

  .navbar-item:hover & {
    transform: scaleX(1);
  }

  &.navbar-item-underline--active {
    transform: scaleX(1);
  }
}

/* 分隔线 */
.navbar-divider {
  flex-shrink: 0;
  width: 1px;
  height: 1.25rem;
  background: var(--border);

  .navbar--scrolled & {
    background: color-mix(in srgb, var(--inverse-fg) 25%, transparent);
  }

  @media (max-width: 767px) {
    display: none;
  }
}

/* 功能按钮组 */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* 方形硬边图标按钮：与整体的硬边语言统一 */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  padding: 0 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--fg);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .navbar--scrolled & {
    border-color: color-mix(in srgb, var(--inverse-fg) 30%, transparent);
    color: var(--inverse-fg);

    &:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
  }
}

/* 滚动进度条：贴在胶囊底边，从左展开 */
.navbar-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
  opacity: 0;
  transition: opacity var(--dur) var(--ease-out), transform 0.1s linear;

  .navbar--scrolled & {
    opacity: 1;
  }
}
</style>
