<!-- 主页：Hero 大标题 + 联系信息 + 精选作品网格，点击分类标题可筛选作品 -->
<template>
  <div class="dashboard-page">
    <!-- Hero 区域：左侧大标题 + 个人简介，右侧联系信息 -->
    <section class="hero">
      <!-- 左侧：Hero 大标题列表 + 个人简介 -->
      <div class="hero-left">
        <!-- 大标题列表：每个标题可点击筛选对应分类的作品 -->
        <div class="hero-headlines">
          <div v-for="(item, index) in heroItems" :key="index" class="hero-item" @click="handleHeadlineClick(item)">
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
              <template v-else>
                {{ item.text }}
              </template>
              <!-- 标题右侧的灰色注释文字 -->
              <span class="hero-annotation">{{ item.annotation }}</span>
            </h1>
            <!-- 标题之间的分隔线（最后一个不显示） -->
            <div v-if="index < heroItems.length - 1" class="hero-divider"></div>
          </div>
        </div>

        <!-- 个人简介：按 | 分隔换行 -->
        <div class="hero-intro">
          <template v-for="(line, i) in content.intro.split('|')" :key="i">
            {{ line }}<br class="intro-br-desktop" /><span class="intro-space-mobile">&nbsp;</span>
          </template>
        </div>
      </div>

      <!-- 右侧：联系信息卡片 -->
      <div class="hero-right">
        <div class="hero-contact">
          <h3 class="contact-label">{{ contactContent.baseLabel }}</h3>
          <div class="contact-location">
            <el-icon :size="24">
              <Location />
            </el-icon>
            {{ contactContent.locationValue }}
          </div>
          <!-- 悬浮提示气泡 -->
          <div class="contact-tooltip">{{ tooltipText }}</div>
        </div>

        <!-- "取得联系"链接：跳转到联系页 -->
        <div class="contact-link" @click="navigateTo('contact')">
          <span class="contact-arrow">→</span>
          <h3 class="contact-link-label">{{ contactContent.contactLabel }}</h3>
        </div>
      </div>
    </section>

    <!-- 分隔线 -->
    <div class="section-divider"></div>
    <!-- "精选作品"标题 + 年份范围 -->
    <div class="works-header">
      <h2 class="works-title">{{ content.selectedWorks }}</h2>
      <span class="works-years">{{ content.years }}</span>
    </div>

    <!-- 作品网格：分类筛选 + 项目卡片，通过 externalFilter 控制初始筛选 -->
    <PortfolioGrid :external-filter="portfolioCategory" />

    <!-- Toast 提示：点击无分类的标题时显示"还在学..." -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="showToast" class="toast">
          {{ appStore.language === 'zh' ? '还在学... 🍳' : 'Still Learning... 🍳' }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Location } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { HOME_DATA, CONTACT_DATA, type HeroItem } from '@/data/home'
import { Category } from '@/types'
import PortfolioGrid from '@/components/PortfolioGrid.vue'

const router = useRouter()
const appStore = useAppStore()

// 当前筛选的作品分类（由 Hero 标题点击设置）
const portfolioCategory = ref<string>('All')

// 主页内容数据
const content = computed(() => HOME_DATA[appStore.language])
// 联系方式数据
const contactContent = computed(() => CONTACT_DATA[appStore.language])
// Hero 大标题列表
const heroItems = computed(() => content.value.heroItems || [])
// Toast 提示是否显示
const showToast = ref(false)

// 所在地 hover 提示文案
const tooltipText = computed(() => {
  return contactContent.value.tooltip || (appStore.language === 'zh'
    ? '我在郑州，可以交个朋友哦！'
    : 'I\'m in Zhengzhou. Would you like to make friends with me?')
})

// 判断是否为"摄影摄像"标题（需要拆分为两个可点击区域）
function isPhotographyVideography(item: HeroItem): boolean {
  return item.text.includes('摄影摄像') || item.text.includes('Photography & Videography')
}

// 将"摄影摄像"拆分为独立的"摄影"和"摄像"两个可点击区域
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

// 跳转到指定页面
function navigateTo(tab: string) {
  appStore.setActiveTab(tab)
  router.push({ name: tab.charAt(0).toUpperCase() + tab.slice(1) })
}

// 点击 Hero 标题：有分类则筛选作品，无分类则显示 Toast 提示
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
  max-width: 96vw;
  margin: 0 auto;
}

/* Hero 区域：左侧标题 + 右侧联系信息 */
.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 3rem;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 4rem;
    margin-bottom: 5rem;
  }
}

.hero-left {
  width: 100%;

  @media (min-width: 1024px) {
    grid-column: span 7;
  }
}

.hero-headlines {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 1.5rem;

  @media (min-width: 1024px) {
    margin-bottom: 2rem;
  }
}

.hero-item {
  cursor: pointer;
}

.hero-title {
  margin: 0;
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.25;
  color: #000000;
  white-space: nowrap;
  overflow: visible;
  transition: all 0.3s;

  .dark & {
    color: #ffffff;
  }

  &.hero-title--en {
    font-size: 8vw;

    @media (min-width: 1024px) {
      font-size: 6vw;
    }
  }

  &.hero-title--zh {
    font-size: 14vw;

    @media (min-width: 1024px) {
      font-size: 8vw;
    }
  }
}

/* 可点击的拆分词块 */
.part--clickable {
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.7;
  }
}

.part--static {
  cursor: default;
}

/* 标题右侧注释文字 */
.hero-annotation {
  display: inline-block;
  vertical-align: middle;
  margin-left: 0.5rem;
  font-size: 0.3em;
  font-weight: 700;
  letter-spacing: normal;
  color: #9ca3af;
  transform: translateY(-0.1em);

  @media (min-width: 1024px) {
    margin-left: 1rem;
  }
}

.hero-divider {
  width: 100%;
  height: 1px;
  margin: 0.5rem 0;
  background: rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s;

  .dark & {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (min-width: 768px) {
    margin: 1rem 0;
  }
}

.hero-intro {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.625;
  max-width: 56rem;
  color: #4b5563;
  transition: color 0.3s;

  .dark & {
    color: #d1d5db;
  }

  @media (min-width: 768px) {
    font-size: 1.875rem;
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

.hero-right {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding-top: 0;

  @media (min-width: 1024px) {
    grid-column: span 5;
    padding-top: 1rem;
  }
}

.hero-contact {
  position: relative;
  cursor: pointer;
}

.contact-label {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
  transition: color 0.3s;

  .dark & {
    color: #ffffff;
  }

  @media (min-width: 1024px) {
    font-size: 1.875rem;
  }
}

.contact-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: #4b5563;

  .dark & {
    color: #d1d5db;
  }

  @media (min-width: 1024px) {
    font-size: 1.5rem;
  }
}

.contact-tooltip {
  position: absolute;
  top: -2.5rem;
  left: 0;
  z-index: 50;
  padding: 0.5rem 1rem;
  background: rgba(6, 182, 212, 0.8);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.95) translateY(0.5rem);
  transition: all 0.3s;

  .hero-contact:hover & {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.contact-arrow {
  font-size: 1.5rem;
  color: #00d26a;
  transition: transform 0.3s;

  .contact-link:hover & {
    transform: translateX(0.25rem);
  }

  @media (min-width: 1024px) {
    font-size: 1.875rem;
  }
}

.contact-link-label {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #00d26a;
  transition: opacity 0.3s;

  .contact-link:hover & {
    opacity: 0.8;
  }

  @media (min-width: 1024px) {
    font-size: 1.875rem;
  }
}

.section-divider {
  width: 100%;
  height: 2px;
  margin-bottom: 1.5rem;
  background: #f3f4f6;
  transition: background-color 0.3s;

  .dark & {
    background: #1f2937;
  }

  @media (min-width: 1024px) {
    margin-bottom: 2rem;
  }
}

.works-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;

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
  font-size: 2.25rem;
  font-weight: 900;
  letter-spacing: -0.025em;
  color: #000000;
  transition: color 0.3s;

  .dark & {
    color: #ffffff;
  }

  @media (min-width: 768px) {
    font-size: 3rem;
  }

  @media (min-width: 1024px) {
    font-size: 3.75rem;
  }
}

.works-years {
  font-family: monospace;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #6b7280;
  transition: color 0.3s;

  .dark & {
    color: #9ca3af;
  }

  @media (min-width: 1024px) {
    font-size: 1.125rem;
  }
}

.toast {
  position: fixed;
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 1rem 2rem;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 700;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  .dark & {
    background: #ffffff;
    color: #000000;
  }
}

/* Toast 提示动画：从下方淡入 */
.toast-enter-active {
  animation: fadeIn 0.3s ease-out;
}

.toast-leave-active {
  animation: fadeIn 0.3s ease-in reverse;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
