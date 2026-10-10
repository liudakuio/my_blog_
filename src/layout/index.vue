<!--
  主布局：包含导航栏、音乐播放器、页面路由视图、页脚
  组成：MusicPlayer（左下角播放器）+ SidebarNav（顶部导航）+ <router-view>（带切换过渡）+ 页脚。
  引用关系：由 router 的公开路由 "/" 作为父布局加载，套在 dashboard / portfolio / articles / contact 之外。
-->
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
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/app'
import type { Language } from '@/types'

interface SocialLinks {
  wechat: string
  xiaohongshu: string
  bilibili: string
  px500: string
}

interface ContactContent {
  baseLabel: string
  locationValue: string
  contactLabel: string
  emailMeLabel: string
  email: string
  hello: string
  intro: string
  socials: SocialLinks
  tooltip?: string
  githubLabel: string
}

const CONTACT_DATA: Record<Language, ContactContent> = {
  zh: {
    baseLabel: 'BASE', locationValue: '河南 郑州', contactLabel: '取得联系', emailMeLabel: '邮箱',
    email: 'liudakuio@gmail.com', hello: '你好 :-)', intro: '欢迎探讨与合作。',
    socials: { wechat: 'vv8886666999', xiaohongshu: 'YourID', bilibili: 'YourID', px500: 'YourID' },
    githubLabel: 'Gitee'
  },
  en: {
    baseLabel: 'BASE', locationValue: 'HENAN ZHENGZHOU', contactLabel: 'Get in touch', emailMeLabel: 'Email Me',
    email: '1365693530@qq.com', hello: 'Hello :-)', intro: 'Welcome to discuss & cooperate.',
    socials: { wechat: 'YourWeChatID', xiaohongshu: 'YourID', bilibili: 'YourID', px500: 'YourID' },
    githubLabel: 'Gitee'
  }
}
import SidebarNav from './components/SidebarNav.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'

const appStore = useAppStore()
// 联系方式数据（用于页脚设计声明文案）
const contactContent = computed(() => CONTACT_DATA[appStore.language])
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
