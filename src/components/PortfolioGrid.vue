<!--
  作品网格组件：分类筛选栏 + 项目卡片网格 + 详情弹窗 + 灯箱，供主页与作品页复用。
  数据来源：统一走接口 /api/projects，**筛选由后端完成** ——
    切换分类时调 portfolioStore.setCategory(val) -> GET /api/projects?category=xxx，
    列表只含该分类数据；「全部」不传 category，返回全量。
    每次切换都会重新请求（不做缓存），前端不再本地过滤。
  分类栏：始终来自 /api/project-categories（挂载时无条件请求），与列表数据来源解耦；
    接口失败时分类为空，筛选栏只剩「全部」。
  被谁引用：views/dashboard/index.vue（首页）、views/portfolio/index.vue（作品页）。
-->
<template>
  <div class="portfolio-grid">
    <!-- 分类筛选栏：sticky 吸顶，选中项为实底 -->
    <div class="filter-bar">
      <button
        v-for="cat in categories"
        :key="cat"
        class="filter-btn"
        :class="{ 'filter-btn--active': filter === cat }"
        @click="filter = cat"
      >
        {{ categoryLabels[cat] || cat }}
      </button>
    </div>

    <!-- 项目卡片网格："全部"时4列，筛选分类时3列 -->
    <div
      class="project-grid"
      :class="filter === 'All' ? 'project-grid--all' : 'project-grid--filtered'"
    >
      <div
        v-for="(project, pIndex) in filteredProjects"
        :key="project.id"
        class="project-card"
        :class="{ 'project-card--dev': project.common.category === 'Development' }"
        :style="{ animationDelay: `${Math.min(pIndex, 11) * 0.05}s` }"
        @click="openProjectDetail(project)"
      >
        <!-- 开发类项目卡片：图标 + 标题 + 描述 + 技术栈 -->
        <template v-if="project.common.category === 'Development'">
          <div class="dev-inner">
            <div class="dev-head">
              <div class="dev-icon">
                <el-icon :size="26">
                  <ChatLineSquare v-if="project.common.icon === 'message-circle'" />
                  <CreditCard v-if="project.common.icon === 'id-card'" />
                  <Document v-if="project.common.icon === 'file-text'" />
                  <VideoCamera v-if="project.common.icon === 'film'" />
                  <Monitor v-else />
                </el-icon>
              </div>
              <span class="dev-index">{{ String(pIndex + 1).padStart(2, '0') }}</span>
            </div>
            <h3 class="dev-title">{{ projectContent(project).title }}</h3>
            <p class="dev-desc">{{ projectContent(project).description }}</p>
            <div class="dev-footer">
              <span class="dev-subtitle">{{ projectContent(project).subtitle }}</span>
              <div class="dev-arrow"><el-icon><TopRight /></el-icon></div>
            </div>
          </div>
        </template>

        <!-- 非开发类项目卡片：封面图 + 分类标签 + 标题 + 描述 + 标签 -->
        <template v-else>
          <div class="cover-wrap">
            <!-- 有封面图 -->
            <img
              v-if="project.common.image && !project.common.image.includes('picsum')"
              :src="project.common.image"
              :alt="projectContent(project).title"
              loading="lazy"
              class="cover-img"
              referrerpolicy="no-referrer"
            />
            <!-- B站视频：显示播放按钮 -->
            <div v-else-if="project.common.bilibiliId" class="cover-video">
              <div class="play-content">
                <div class="play-button">
                  <svg viewBox="0 0 24 24" fill="currentColor" class="play-icon"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <span class="play-label">Video Preview</span>
              </div>
            </div>
            <!-- 无封面图：占位 -->
            <div v-else class="cover-placeholder">
              <div>
                <h4 class="placeholder-title">{{ projectContent(project).title }}</h4>
                <p class="preview-badge">
                  {{ appStore.language === 'zh' ? '预览部署中' : 'Preview deploying' }}
                </p>
              </div>
            </div>
            <!-- 左上角分类标签 -->
            <div class="cover-tag">
              {{ categoryLabels[project.common.category] || project.common.category }}
            </div>
            <!-- 右下角序号 -->
            <span class="cover-index">{{ String(pIndex + 1).padStart(2, '0') }}</span>
          </div>

          <div class="card-info">
            <h3 class="card-title">{{ projectContent(project).title }}</h3>
            <p class="card-desc">{{ projectContent(project).description }}</p>
          </div>

          <!-- 标签列表（摄影类不显示标签） -->
          <div v-if="project.common.category !== 'Photography'" class="tag-row">
            <span v-for="tag in projectContent(project).tags" :key="tag" class="card-tag">#{{ tag }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 加载中 / 空数据提示 -->
    <div v-if="loading" class="grid-tip">
      {{ appStore.language === 'zh' ? '作品加载中…' : 'Loading projects…' }}
    </div>
    <div v-else-if="filteredProjects.length === 0" class="grid-tip">
      {{ appStore.language === 'zh' ? '暂无作品' : 'No projects found' }}
    </div>

    <!-- 项目详情弹窗：延迟渲染，关闭后 300ms 销毁 -->
    <ProjectDetailModal
      v-if="isModalRendered"
      :visible="!!selectedProject"
      :project="displayProject as any"
      @close="closeProjectDetail"
      @lightbox="openLightbox"
    />

    <!-- 灯箱：全屏查看图片，支持左右切换和页码指示 -->
    <Teleport to="body">
      <div
        v-if="lightboxIndex !== null && currentGallery.length > 0"
        class="lightbox-overlay"
        @click="lightboxIndex = null"
      >
        <div class="lightbox-inner" @click.stop>
          <img
            :src="currentGallery[lightboxIndex]"
            alt="Full View"
            class="lightbox-img"
            referrerpolicy="no-referrer"
            draggable="false"
          />
          <button class="lightbox-close" @click="lightboxIndex = null">
            <el-icon :size="28"><Close /></el-icon>
          </button>
          <template v-if="currentGallery.length > 1">
            <button class="lightbox-prev" @click="prevImage">
              <el-icon :size="40"><ArrowLeft /></el-icon>
            </button>
            <button class="lightbox-next" @click="nextImage">
              <el-icon :size="40"><ArrowRight /></el-icon>
            </button>
          </template>
          <div class="lightbox-page">
            {{ lightboxIndex + 1 }} / {{ currentGallery.length }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  TopRight, ChatLineSquare, CreditCard, Document, VideoCamera, Monitor,
  Close, ArrowLeft, ArrowRight
} from '@element-plus/icons-vue'
import { onMounted } from 'vue'
import { useAppStore } from '@/store/app'
import { usePortfolioStore } from '@/store/portfolio'
import { pickText } from '@/utils/i18n'
import type { Project } from '@/types'
import ProjectDetailModal from '@/views/portfolio/components/ProjectDetailModal.vue'

const props = defineProps<{
  // 外部筛选控制：主页 Hero 标题点击 / 作品页 URL ?filter= 传入的分类名
  externalFilter?: string
}>()

const appStore = useAppStore()
const portfolioStore = usePortfolioStore()

// 当前选中的分类筛选
const filter = ref<string>('All')
// 当前选中的项目（用于弹窗显示）
const selectedProject = ref<Project | null>(null)
// 弹窗中实际渲染的项目（关闭时延迟清空以支持过渡动画）
const displayProject = ref<Project | null>(null)
// 弹窗是否渲染（延迟销毁以支持过渡动画）
const isModalRendered = ref(false)
// 灯箱当前图片索引
const lightboxIndex = ref<number | null>(null)
// 灯箱当前图片列表
const currentGallery = ref<string[]>([])

// 监听外部筛选变化（主页 Hero 点击 / 作品页 URL ?filter=）
watch(() => props.externalFilter, (val) => {
  if (val) filter.value = val
}, { immediate: true })

// 分类切换 -> 重新请求接口（后端筛选）
watch(filter, (val) => {
  portfolioStore.setCategory(val)
})

// 组件挂载时拉取作品与分类
onMounted(() => {
  portfolioStore.setCategory(filter.value)
  portfolioStore.loadCategories()
})

// 接口返回的作品列表（已按当前分类由后端筛选完成）
const projectData = computed(() => portfolioStore.projects)
// 是否正在加载
const loading = computed(() => portfolioStore.loading)

// 可用分类：接口下发的分类字典 + 前端拼在首位的"全部"
const categories = computed(() => [
  'All',
  ...[...portfolioStore.categories]
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map(item => item.value)
])

// 分类标签文案：优先取接口下发的双语字典
const categoryLabels = computed(() => {
  const map: Record<string, string> = {
    All: appStore.language === 'zh' ? '全部' : 'All'
  }
  for (const item of portfolioStore.categories) {
    const value = item.zh ?? item.en
    map[item.value] = pickText(value?.label ?? item.label, appStore.language, item.value)
  }
  return map
})

// 筛选已由后端完成，这里直接返回接口数据
const filteredProjects = computed(() => projectData.value)

// 获取项目的当前语言内容
function projectContent(project: Project) {
  return appStore.language === 'zh' ? project.zh : project.en
}

// 打开项目详情弹窗：先展示列表数据，再按需拉取图集
async function openProjectDetail(project: Project) {
  selectedProject.value = project
  displayProject.value = project
  isModalRendered.value = true
  document.body.style.overflow = 'hidden'

  const needGallery = (project.common.galleryCount ?? 0) > 0 && !project.common.gallery?.length
  if (!needGallery) return

  const detail = await portfolioStore.fetchDetail(project.id)
  if (!detail) return
  if (displayProject.value?.id === project.id) {
    displayProject.value = detail
    selectedProject.value = detail
  }
}

// 关闭弹窗：延迟 300ms 销毁
function closeProjectDetail() {
  selectedProject.value = null
  document.body.style.overflow = ''
  setTimeout(() => {
    isModalRendered.value = false
    displayProject.value = null
    lightboxIndex.value = null
  }, 300)
}

function openLightbox(index: number, gallery: string[]) {
  currentGallery.value = gallery
  lightboxIndex.value = index
}

function prevImage() {
  if (lightboxIndex.value !== null && currentGallery.value.length > 0) {
    lightboxIndex.value = (lightboxIndex.value - 1 + currentGallery.value.length) % currentGallery.value.length
  }
}

function nextImage() {
  if (lightboxIndex.value !== null && currentGallery.value.length > 0) {
    lightboxIndex.value = (lightboxIndex.value + 1) % currentGallery.value.length
  }
}
</script>

<style lang="less" scoped>
.portfolio-grid {
  width: 100%;
}

/* ---------- 分类筛选栏 ---------- */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2.5rem;
  padding: 1rem 0;
  border-bottom: 2px solid var(--ink);
  position: sticky;
  top: 4.5rem;
  z-index: 30;
  background: var(--bg);
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  transition: background-color var(--dur) var(--ease-out);

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    gap: 0.625rem;
    margin-bottom: 3.5rem;
    padding-bottom: 1.5rem;
    top: 5rem;
  }
}

/* 硬边 mono 标签，选中为实底 */
.filter-btn {
  flex-shrink: 0;
  padding: 0.4375rem 0.875rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: transparent;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-muted);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    border-color: var(--ink);
    color: var(--fg);
  }

  &.filter-btn--active {
    background: var(--inverse-bg);
    border-color: var(--ink);
    color: var(--inverse-fg);
  }

  @media (min-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }
}

/* ---------- 网格 ---------- */
.project-grid {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 1.25rem;
  row-gap: 2.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);

    &.project-grid--filtered {
      column-gap: 1.75rem;
      row-gap: 3rem;
    }
  }

  @media (min-width: 1024px) {
    &.project-grid--all {
      grid-template-columns: repeat(4, 1fr);
      column-gap: 1.5rem;
    }

    &.project-grid--filtered {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

.project-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  animation: fadeUp 0.6s var(--ease-out) both;

  &.project-card--dev {
    padding: 1.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    transition: border-color var(--dur) var(--ease-out), transform var(--dur) var(--ease-out);

    &:hover {
      border-color: var(--ink);
      transform: translateY(-4px);
    }

    @media (min-width: 768px) {
      padding: 1.75rem;
    }
  }
}

/* ---------- 开发类卡片 ---------- */
.dev-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dev-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.dev-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-xs);
  background: var(--inverse-bg);
  color: var(--inverse-fg);

  @media (min-width: 768px) {
    width: 3.5rem;
    height: 3.5rem;
  }
}

.dev-index {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--fg-faint);
}

.dev-title {
  margin: 0 0 0.625rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.25;
  color: var(--fg);

  @media (min-width: 768px) {
    font-size: 1.375rem;
  }
}

.dev-desc {
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--fg-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dev-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px dashed var(--border);
}

.dev-subtitle {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--fg-faint);
}

.dev-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  opacity: 0;
  transform: translateX(6px);
  transition: all var(--dur) var(--ease-out);

  .project-card:hover & {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ---------- 封面区 ---------- */
.cover-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  margin-bottom: 0.875rem;
  overflow: hidden;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
  background: var(--surface-sunken);
  transition: border-color var(--dur) var(--ease-out);

  .project-card:hover & {
    border-color: var(--ink);
  }
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s var(--ease-out);
  will-change: transform;

  .project-card:hover & {
    transform: scale(1.05);
  }
}

.cover-video {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--surface-sunken);
  transition: background-color var(--dur) var(--ease-out);

  .project-card:hover & {
    background: var(--border-soft);
  }
}

.play-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  transition: transform var(--dur) var(--ease-out);

  .project-card:hover & {
    transform: scale(1.1);
  }
}

.play-icon {
  width: 1.5rem;
  height: 1.5rem;
  margin-left: 0.1875rem;
}

.play-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--fg-muted);
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1.5rem;
  text-align: center;
  background: var(--surface-sunken);
}

.placeholder-title {
  margin: 0 0 0.5rem;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 900;
  line-height: 1.3;
  letter-spacing: -0.03em;
  color: var(--fg-faint);

  @media (min-width: 768px) {
    font-size: 1.375rem;
  }
}

.preview-badge {
  display: inline-block;
  margin: 0;
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--fg-faint);
}

/* 左上角分类角标 */
.cover-tag {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.1875rem 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: var(--radius-xs);
  background: var(--inverse-bg);
  color: var(--inverse-fg);

  @media (min-width: 768px) {
    top: 0.75rem;
    left: 0.75rem;
    padding: 0.25rem 0.625rem;
    font-size: 0.625rem;
  }
}

/* 右下角序号 */
.cover-index {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--fg-faint);

  @media (min-width: 768px) {
    bottom: 0.75rem;
    right: 0.75rem;
    font-size: 0.6875rem;
  }
}

/* ---------- 卡片文字 ---------- */
.card-info {
  margin-top: auto;
}

/* hover 时标题下方扫过强调色下划线 */
.card-title {
  position: relative;
  display: inline;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 900;
  line-height: 1.35;
  letter-spacing: -0.03em;
  color: var(--fg);
  background-image: linear-gradient(var(--accent), var(--accent));
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0 2px;
  transition: background-size var(--dur) var(--ease-out);

  .project-card:hover & {
    background-size: 100% 2px;
  }

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}

.card-desc {
  margin: 0.5rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--fg-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;

  @media (min-width: 768px) {
    gap: 0.5rem;
  }
}

.card-tag {
  padding: 0.1875rem 0.4375rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fg-faint);

  @media (min-width: 768px) {
    font-size: 0.625rem;
  }
}

/* ---------- 提示 ---------- */
.grid-tip {
  padding: 4rem 0;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-faint);
}

/* ---------- 灯箱 ---------- */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.92);

  @media (min-width: 768px) {
    padding: 3rem;
  }
}

.lightbox-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-xs);
  user-select: none;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);

  &:hover {
    color: #fff;
  }

  @media (min-width: 768px) {
    top: 0;
    right: 0;
    margin-top: -2.5rem;
    margin-right: -2.5rem;
  }
}

.lightbox-prev,
.lightbox-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.5rem;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);

  &:hover {
    color: #fff;
    background: rgba(0, 0, 0, 0.45);
  }

  @media (min-width: 768px) {
    background: transparent;
  }
}

.lightbox-prev {
  left: 0.5rem;

  @media (min-width: 768px) {
    left: -3.5rem;
  }
}

.lightbox-next {
  right: 0.5rem;

  @media (min-width: 768px) {
    right: -3.5rem;
  }
}

.lightbox-page {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-xs);
  background: rgba(0, 0, 0, 0.5);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.75);
}
</style>
