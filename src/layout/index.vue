<!--
  主布局：噪点层 + 导航栏 + 音乐播放器 + 页面路由视图 + 页脚
  组成：MusicPlayer（左下角播放器）+ SidebarNav（顶部导航）+ <router-view>（带切换过渡）+ 页脚。
  引用关系：由 router 的公开路由 "/" 作为父布局加载，套在 dashboard / portfolio / articles / contact 之外。
  配色：全部走 src/styles/tokens.css 的语义令牌，本文件不出现硬编码色值。
-->
<template>
  <div class="app-root">
    <!-- 噪点遮罩：全局铺一层极低透明度纹理，压掉大面积纯色的塑料感 -->
    <div class="u-noise" aria-hidden="true"></div>

    <MusicPlayer />
    <SidebarNav />

    <!-- 每日一句：全站顶部通栏，位于固定导航栏下方、页面内容之上 -->
    <DailyEnglish class="site-daily" />

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <!-- 页脚：大字行动号召 + 邮箱 + mono 元信息 -->
      <footer class="footer">
        <div class="u-container">
          <div class="footer-cta">
            <p class="footer-eyebrow">{{ appStore.language === 'zh' ? '聊聊？' : 'Say hello' }}</p>
            <a class="footer-mail" :href="`mailto:${email}`">{{ email }}</a>
          </div>

          <div class="footer-meta">
            <span>&copy; {{ year }} 刘中魁</span>
            <span class="footer-stack">VUE 3 &middot; VITE &middot; ELEMENT PLUS</span>
            <button class="footer-top" @click="scrollTop">
              {{ appStore.language === 'zh' ? '回到顶部' : 'Back to top' }}
              <span class="footer-top-arrow">&uarr;</span>
            </button>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/app'
import SidebarNav from './components/SidebarNav.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'
import DailyEnglish from '@/components/DailyEnglish.vue'

const appStore = useAppStore()

// 页脚邮箱：中英文站点共用一个联系入口
const EMAIL = 'liudakuio@gmail.com'
const email = computed(() => EMAIL)
const year = new Date().getFullYear()

// 回到顶部：尊重减弱动效偏好，直接跳转
function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style lang="less" scoped>
.app-root {
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  overflow-x: hidden;
  transition: background-color var(--dur) var(--ease-out), color var(--dur) var(--ease-out);
}

/* 通栏顶部留白：让开固定导航栏的高度 */
.site-daily {
  margin-top: 5rem;

  @media (min-width: 768px) {
    margin-top: 6rem;
  }
}

.main-content {
  width: 100%;
  padding-top: 2rem;

  @media (min-width: 768px) {
    padding-top: 2.5rem;
  }
}

/* ---------- 页脚 ---------- */
.footer {
  margin-top: 7rem;
  padding: 4rem 0 2.5rem;
  border-top: 2px solid var(--ink);
  background: var(--bg);

  @media (min-width: 1024px) {
    margin-top: 10rem;
    padding-top: 5.5rem;
  }
}

.footer-cta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 3.5rem;
}

.footer-eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-text);
}

/* 邮箱做成超链接大字，是页脚的视觉重心 */
.footer-mail {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 7vw, 5rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  word-break: break-all;
  color: var(--fg);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease-out);

  &:hover {
    color: var(--accent-text);
  }
}

.footer-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-faint);
}

.footer-stack {
  @media (max-width: 639px) {
    display: none;
  }
}

.footer-top {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-faint);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);

  &:hover {
    color: var(--accent-text);
  }
}

.footer-top-arrow {
  transition: transform var(--dur) var(--ease-out);

  .footer-top:hover & {
    transform: translateY(-3px);
  }
}

/* ---------- 页面切换过渡 ---------- */
.page-enter-active {
  animation: pageIn 0.4s var(--ease-out) both;
}
.page-leave-active {
  animation: pageOut 0.25s ease-in both;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes pageOut {
  from { opacity: 1; transform: none; filter: blur(0); }
  to { opacity: 0; transform: translateY(-8px); filter: blur(4px); }
}
</style>
