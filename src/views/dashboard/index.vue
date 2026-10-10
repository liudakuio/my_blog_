<!--
  主页结构（自上而下）：
    0. 每日一句 —— 全站顶部通栏，由 layout/index.vue 统一渲染（src/components/DailyEnglish.vue）
    1. Hero —— 编号式大标题列表（可点击筛选作品）+ 右侧状态卡
    2. 技术栈跑马灯 —— 新增模块，模块之间的视觉分隔（src/components/StackTicker.vue）
    3. 精选作品 —— 分隔线 + 标题 + 年份 + PortfolioGrid 作品网格
  数据来源：Hero 文案与联系卡片为本地写死；
  作品列表走后端 /api/projects（按分类由后端筛选），分类字典走 /api/project-categories。
-->
<template>
  <div class="dashboard-page">
    <!-- Hero：栅格底纹 + 编号大标题 + 右侧状态卡 -->
    <section class="hero u-grid-bg">
      <div class="u-container">
        <div class="hero-grid">
          <!-- 左侧：编号大标题列表 -->
          <div class="hero-left">
            <p class="hero-eyebrow">PORTFOLIO &nbsp;/&nbsp; {{ content.years }}</p>

            <div class="hero-headlines">
              <button
                v-for="(item, index) in heroItems"
                :key="index"
                class="hero-item"
                :style="{ animationDelay: `${0.1 + index * 0.09}s` }"
                @click="handleHeadlineClick(item)"
              >
                <span class="hero-row">
                  <span class="hero-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <h1
                    class="hero-title"
                    :class="appStore.language === 'en' ? 'hero-title--en' : 'hero-title--zh'"
                  >
                    <!-- "摄影摄像"特殊处理：拆分为两个可独立点击的词 -->
                    <template v-if="isPhotographyVideography(item)">
                      <span
                        v-for="(part, pIndex) in splitPhotographyVideography(item)"
                        :key="pIndex"
                        :class="part.category ? 'part--clickable' : 'part--static'"
                        @click.stop="part.category && handleHeadlineClick({ ...item, category: part.category })"
                      >
                        {{ part.text }}
                      </span>
                    </template>
                    <template v-else>{{ item.text }}</template>
                  </h1>
                  <span class="hero-annotation">{{ item.annotation }}</span>
                </span>
                <span class="hero-divider" aria-hidden="true"></span>
              </button>
            </div>

            <!-- 个人简介：按 | 分隔换行 -->
            <p v-if="content.intro" class="hero-intro">
              <template v-for="(line, i) in content.intro.split('|')" :key="i">
                {{ line }}<br class="intro-br-desktop" /><span class="intro-space-mobile">&nbsp;</span>
              </template>
            </p>
          </div>

          <!-- 右侧：所在地 + 状态 + 联系入口 -->
          <aside class="hero-right">
            <div class="status-card">
              <div class="status-card-head">
                <span class="u-mono">{{ contactContent.baseLabel }}</span>
                <span class="status-live"><span class="status-dot"></span>{{ statusText }}</span>
              </div>
              <div class="status-location">
                <el-icon :size="20"><Location /></el-icon>
                {{ contactContent.locationValue }}
              </div>
              <p class="status-note">{{ tooltipText }}</p>
            </div>

            <button class="contact-link" @click="navigateTo('contact')">
              <span class="contact-link-label">{{ contactContent.contactLabel }}</span>
              <span class="contact-arrow">&rarr;</span>
            </button>
          </aside>
        </div>
      </div>
    </section>

    <!-- 技术栈跑马灯（新增模块；每日一句已改为全站顶部通栏，见 layout/index.vue） -->
    <StackTicker />

    <!-- 精选作品 -->
    <div class="u-container">
      <div class="section-divider"></div>
      <div class="works-header">
        <h2 class="works-title">{{ content.selectedWorks }}</h2>
        <span class="works-years">{{ content.years }}</span>
      </div>

      <PortfolioGrid :external-filter="portfolioCategory" />
    </div>

    <!-- 点击无分类标题时的提示 -->
    <transition name="toast">
      <div v-if="showToast" class="toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Location } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import type { Language, HeroItem, HomeContent } from '@/types'
import { Category } from '@/types'
import PortfolioGrid from '@/components/PortfolioGrid.vue'
import StackTicker from '@/components/StackTicker.vue'

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

const HOME_DATA: Record<Language, HomeContent> = {
  zh: {
    heroItems: [
      { text: '软件开发', annotation: '（目前主业）', category: Category.DEV },
      { text: '嵌入式开发', annotation: '（想学习）', category: Category.DESIGN },
      { text: '做饭', annotation: '（还在学）', category: null }
    ],
    intro: '', selectedWorks: '精选作品', years: '[ 2024 — 2026 ]'
  },
  en: {
    heroItems: [
      { text: 'Software Dev', annotation: '(Current main work)', category: Category.DEV },
      { text: 'Embedded dev', annotation: '(I want to learn)', category: Category.DESIGN },
      { text: 'Cooking', annotation: '(Still Learning)', category: null }
    ],
    intro: '', selectedWorks: 'Selected Works', years: '[ 20XX — 20XX ]'
  }
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

const router = useRouter()
const appStore = useAppStore()

// 当前筛选的作品分类（由 Hero 标题点击设置）
const portfolioCategory = ref<string>('All')

const content = computed(() => HOME_DATA[appStore.language])
const contactContent = computed(() => CONTACT_DATA[appStore.language])
const heroItems = computed(() => content.value.heroItems || [])

const showToast = ref(false)

// 状态卡上的实时文案
const statusText = computed(() => (appStore.language === 'zh' ? '可接洽' : 'Open to work'))

// 所在地说明文案
const tooltipText = computed(() =>
  contactContent.value.tooltip ||
  (appStore.language === 'zh'
    ? '我在郑州，可以交个朋友哦！'
    : "I'm in Zhengzhou. Would you like to make friends with me?")
)

// 无分类标题的提示文案
const toastText = computed(() =>
  appStore.language === 'zh' ? '这一项还没有作品 :)' : 'No works in this category yet :)'
)

// 判断是否为"摄影摄像"标题（需拆分为两个可点击区域）
function isPhotographyVideography(item: HeroItem): boolean {
  return item.text.includes('摄影摄像') || item.text.includes('Photography & Videography')
}

// 将"摄影摄像"拆分为独立的"摄影"和"摄像"
function splitPhotographyVideography(item: HeroItem) {
  if (appStore.language === 'zh') {
    return [
      { text: '摄影', category: Category.PHOTO },
      { text: '摄像', category: Category.VIDEO }
    ]
  }
  return [
    { text: 'Photography', category: Category.PHOTO },
    { text: '&', category: null },
    { text: 'Videography', category: Category.VIDEO }
  ]
}

function navigateTo(tab: string) {
  appStore.setActiveTab(tab)
  router.push({ name: tab.charAt(0).toUpperCase() + tab.slice(1) })
}

// 点击 Hero 标题：有分类则筛选作品，无分类则提示
function handleHeadlineClick(item: HeroItem) {
  if (item.category) {
    portfolioCategory.value = item.category
  } else {
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 2000)
  }
}
</script>

<style lang="less" scoped>
.dashboard-page {
  width: 100%;
}

/* ---------- Hero ---------- */
.hero {
  position: relative;
  padding: 2rem 0 3.5rem;

  @media (min-width: 1024px) {
    padding: 3rem 0 5rem;
  }
}

.hero-grid {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 4fr);
    gap: 4rem;
    align-items: start;
  }
}

.hero-eyebrow {
  margin: 0 0 2rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-text);
}

.hero-headlines {
  display: flex;
  flex-direction: column;
}

/* 大标题行：编号 + 标题 + 注释，hover 时整行点亮 */
.hero-item {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  color: var(--fg-faint);
  cursor: pointer;
  animation: riseIn 0.75s var(--ease-out) both;
  transition: color var(--dur) var(--ease-out);

  &:hover {
    color: var(--fg);

    .hero-index {
      color: var(--accent-text);
    }
  }

  /* 第一条（主业）默认点亮，其余灰度，形成主次 */
  &:first-child {
    color: var(--fg);

    .hero-index {
      color: var(--accent-text);
    }
  }
}

.hero-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    gap: 1.25rem;
  }
}

.hero-index {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--fg-faint);
  transition: color var(--dur) var(--ease-out);
}

.hero-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 0.95;
  color: currentColor;
  white-space: nowrap;
  transition: color var(--dur) var(--ease-out);

  &.hero-title--zh {
    font-size: clamp(2.5rem, 11vw, 7rem);
  }

  &.hero-title--en {
    font-size: clamp(1.75rem, 7vw, 4.5rem);
  }
}

.hero-annotation {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--fg-faint);
  transform: translateY(-0.35em);
}

.hero-divider {
  display: block;
  height: 1px;
  margin: 1rem 0;
  border-top: 1px dashed var(--border);

  @media (min-width: 768px) {
    margin: 1.5rem 0;
  }
}

.hero-intro {
  margin: 2rem 0 0;
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.75;
  max-width: 42rem;
  color: var(--fg-muted);

  @media (min-width: 768px) {
    font-size: 1.375rem;
  }
}

.intro-br-desktop {
  display: none;

  @media (min-width: 768px) {
    display: block;
  }
}

.intro-space-mobile {
  @media (min-width: 768px) {
    display: none;
  }
}

/* ---------- 右侧状态卡 ---------- */
.hero-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    padding-top: 0.5rem;
  }
}

.status-card {
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  transition: border-color var(--dur) var(--ease-out);

  &:hover {
    border-color: var(--ink);
  }

  @media (min-width: 768px) {
    padding: 1.75rem;
  }
}

.status-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed var(--border);
  color: var(--fg-faint);
}

/* 实时状态：呼吸圆点 + 文案 */
.status-live {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-text);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--fg);

  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
}

.status-note {
  margin: 0.75rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--fg-muted);
}

/* 联系入口：hover 时反色并推动箭头 */
.contact-link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  transition: background-color var(--dur) var(--ease-out), color var(--dur) var(--ease-out);

  &:hover {
    background: var(--inverse-bg);
    color: var(--inverse-fg);

    .contact-arrow {
      transform: translateX(5px);
    }
  }
}

.contact-link-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.contact-arrow {
  font-size: 1.125rem;
  transition: transform var(--dur) var(--ease-out);
}

/* ---------- 作品区 ---------- */
.section-divider {
  height: 2px;
  margin-bottom: 1.5rem;
  background: var(--ink);

  @media (min-width: 1024px) {
    margin-bottom: 2rem;
  }
}

.works-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
  }

  @media (min-width: 1024px) {
    margin-bottom: 2.5rem;
  }
}

.works-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--fg);
}

.works-years {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--fg-muted);

  @media (min-width: 1024px) {
    font-size: 0.8125rem;
  }
}

/* ---------- Toast ---------- */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  padding: 0.875rem 1.5rem;
  border-radius: var(--radius-sm);
  background: var(--inverse-bg);
  color: var(--inverse-fg);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.toast-enter-active {
  animation: toastIn 0.3s var(--ease-out) both;
}
.toast-leave-active {
  animation: toastIn 0.3s ease-in reverse both;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translate(-50%, 18px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
