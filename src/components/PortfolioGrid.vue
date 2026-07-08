<!-- 作品网格组件：分类筛选栏 + 项目卡片网格 + 详情弹窗 + 灯箱，供主页和作品页复用 -->
<template>
  <div class="portfolio-grid">
    <!-- 分类筛选栏：sticky 吸顶，当前选中项加下划线高亮 -->
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
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card"
        :class="{ 'project-card--dev': project.common.category === 'Development' }"
        @click="openProjectDetail(project)"
      >
        <!-- 开发类项目卡片：图标 + 标题 + 描述 + 技术栈 -->
        <template v-if="project.common.category === 'Development'">
          <div class="dev-inner">
            <!-- 项目图标 -->
            <div class="dev-icon">
              <el-icon :size="32">
                <ChatLineSquare v-if="project.common.icon === 'message-circle'" />
                <CreditCard v-if="project.common.icon === 'id-card'" />
                <Document v-if="project.common.icon === 'file-text'" />
                <VideoCamera v-if="project.common.icon === 'film'" />
                <Monitor v-else />
              </el-icon>
            </div>
            <h3 class="dev-title">{{ projectContent(project).title }}</h3>
            <p class="dev-desc">{{ projectContent(project).description }}</p>
            <!-- 底部：技术栈 + hover 箭头 -->
            <div class="dev-footer">
              <span class="dev-subtitle">{{ projectContent(project).subtitle }}</span>
              <div class="dev-arrow"><el-icon><TopRight /></el-icon></div>
            </div>
          </div>
        </template>
        <!-- 非开发类项目卡片：封面图 + 分类标签 + 标题 + 描述 + 标签 -->
        <template v-else>
          <!-- 封面图区域：3种状态（有图片/B站视频/占位） -->
          <div class="cover-wrap">
            <!-- 有封面图：显示图片，hover 时放大 -->
            <img
              v-if="project.common.image && !project.common.image.includes('picsum')"
              :src="project.common.image"
              :alt="projectContent(project).title"
              loading="lazy"
              class="cover-img"
              referrerpolicy="no-referrer"
            />
            <!-- B站视频：显示播放按钮 -->
            <div
              v-else-if="project.common.bilibiliId"
              class="cover-video"
            >
              <div class="play-content">
                <div class="play-button">
                  <svg viewBox="0 0 24 24" fill="currentColor" class="play-icon"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <span class="play-label">Video Preview</span>
              </div>
            </div>
            <!-- 无封面图：显示标题占位 + "预览部署中"提示 -->
            <div
              v-else
              class="cover-placeholder"
            >
              <div>
                <h4
                  class="placeholder-title"
                  :class="filter === 'All' ? 'placeholder-title--all' : 'placeholder-title--filtered'"
                >
                  {{ projectContent(project).title }}<br />
                  <span class="placeholder-subtitle">{{ projectContent(project).subtitle }}</span>
                </h4>
                <p class="preview-badge">
                  {{ appStore.language === 'zh' ? '预览部署中...' : 'Preview Deploying...' }}
                </p>
              </div>
            </div>
            <!-- 左上角分类标签 -->
            <div class="cover-tag">
              {{ categoryLabels[project.common.category] || project.common.category }}
            </div>
          </div>
          <!-- 标题 + 描述：hover 时底部边框变黑，右侧显示箭头 -->
          <div class="card-info">
            <div class="card-info-text">
              <h3
                class="card-title"
                :class="filter === 'All' ? 'card-title--all' : 'card-title--filtered'"
              >
                {{ projectContent(project).title }}
              </h3>
              <p class="card-desc">{{ projectContent(project).description }}</p>
            </div>
            <div class="card-arrow"><el-icon :size="24"><TopRight /></el-icon></div>
          </div>
          <!-- 标签列表（摄影类不显示标签） -->
          <div v-if="project.common.category !== 'Photography'" class="tag-row">
            <span
              v-for="tag in projectContent(project).tags"
              :key="tag"
              class="card-tag"
            >#{{ tag }}</span>
          </div>
        </template>
      </div>
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
          <!-- 关闭按钮 -->
          <button class="lightbox-close" @click="lightboxIndex = null">
            <el-icon :size="32"><Close /></el-icon>
          </button>
          <!-- 左右切换按钮（仅多图时显示） -->
          <template v-if="currentGallery.length > 1">
            <button class="lightbox-prev" @click="prevImage">
              <el-icon :size="48"><ArrowLeft /></el-icon>
            </button>
            <button class="lightbox-next" @click="nextImage">
              <el-icon :size="48"><ArrowRight /></el-icon>
            </button>
          </template>
          <!-- 页码指示器 -->
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
import { useAppStore } from '@/store/app'
import { PROJECT_DATA } from '@/data/projects'
import { Category } from '@/types'
import type { Project } from '@/types'
import ProjectDetailModal from '@/views/portfolio/components/ProjectDetailModal.vue'

const props = defineProps<{
  // 外部筛选控制：主页 Hero 标题点击时传入分类名
  externalFilter?: string
}>()

const appStore = useAppStore()

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

// 监听外部筛选变化（如主页 Hero 点击）
watch(() => props.externalFilter, (val) => {
  if (val) filter.value = val
}, { immediate: true })

// 分类显示顺序
const preferredOrder = [Category.PHOTO, Category.VIDEO, Category.DESIGN, Category.DEV]

// 全部项目数据
const projectData = computed(() => PROJECT_DATA)

// 可用的分类列表（只显示有数据的分类，开发类始终显示）
const categories = computed(() => {
  const current = projectData.value
  const available = preferredOrder.filter(cat =>
    current.some(p => p.common.category === cat) || cat === Category.DEV
  )
  return ['All', ...available]
})

// 分类标签的中英文映射
const categoryLabels = computed(() => {
  const zh: Record<string, string> = {
    'All': '全部',
    'Videography': '动态影像',
    'Graphics & UI': '平面交互',
    'Photography': '静态摄影',
    'Development': '应用开发'
  }
  const en: Record<string, string> = {
    'All': 'All',
    'Videography': 'Videography',
    'Graphics & UI': 'Graphics & UI',
    'Photography': 'Photography',
    'Development': 'Development'
  }
  return appStore.language === 'zh' ? zh : en
})

// 根据当前筛选分类过滤项目
const filteredProjects = computed(() => {
  const current = projectData.value
  if (filter.value === 'All') return current
  return current.filter(p => p.common.category === filter.value)
})

// 获取项目的当前语言内容
function projectContent(project: Project) {
  return appStore.language === 'zh' ? project.zh : project.en
}

// 打开项目详情弹窗
function openProjectDetail(project: Project) {
  selectedProject.value = project
  displayProject.value = project
  isModalRendered.value = true
  document.body.style.overflow = 'hidden'
}

// 关闭项目详情弹窗：先清空选中状态，延迟 300ms 后销毁弹窗组件
function closeProjectDetail() {
  selectedProject.value = null
  document.body.style.overflow = ''
  setTimeout(() => {
    isModalRendered.value = false
    displayProject.value = null
    lightboxIndex.value = null
  }, 300)
}

// 打开灯箱
function openLightbox(index: number, gallery: string[]) {
  currentGallery.value = gallery
  lightboxIndex.value = index
}

// 灯箱上一张（循环）
function prevImage() {
  if (lightboxIndex.value !== null && currentGallery.value.length > 0) {
    lightboxIndex.value = (lightboxIndex.value - 1 + currentGallery.value.length) % currentGallery.value.length
  }
}

// 灯箱下一张（循环）
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

/* 分类筛选栏 */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 3rem;
  padding: 1rem 0;
  border-bottom: 2px solid #000000;
  position: sticky;
  top: 5rem;
  z-index: 30;
  background: rgba(255, 255, 255, 0.95);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  transition: color 0.3s, background-color 0.3s, border-color 0.3s;

  &::-webkit-scrollbar {
    display: none;
  }

  .dark & {
    border-color: #ffffff;
    background: rgba(0, 0, 0, 0.95);
  }

  @media (min-width: 768px) {
    gap: 2rem;
    margin-bottom: 4rem;
    padding-bottom: 2rem;
    top: 6rem;
  }
}

.filter-btn {
  padding: 0;
  border: none;
  background: none;
  white-space: nowrap;
  font-size: 1.125rem;
  font-weight: 700;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #000000;
  }

  .dark & {
    color: #4b5563;

    &:hover {
      color: #ffffff;
    }
  }

  &.filter-btn--active {
    color: #000000;
    text-decoration: underline;
    text-decoration-thickness: 4px;
    text-underline-offset: 8px;
    text-decoration-color: #000000;

    .dark & {
      color: #ffffff;
      text-decoration-color: #ffffff;
    }
  }

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
}

/* 项目卡片网格 */
.project-grid {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 1.5rem;
  row-gap: 3rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);

    &.project-grid--filtered {
      column-gap: 2rem;
      row-gap: 4rem;
    }
  }

  @media (min-width: 1024px) {
    &.project-grid--all {
      grid-template-columns: repeat(4, 1fr);
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
  transform: translate3d(0, 0, 0);

  &.project-card--dev {
    padding: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    background: #f3f4f6;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      transform: translateY(-0.5rem);
    }

    .dark & {
      background: rgba(17, 24, 39, 0.5);
      border-color: #1f2937;
    }
  }
}

/* 开发类卡片 */
.dev-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dev-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  margin-bottom: 1.5rem;
  border-radius: 1rem;
  background: #ffffff;
  color: #000000;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  .dark & {
    background: #000000;
    color: #ffffff;
  }
}

.dev-title {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 900;
  color: #000000;

  .dark & {
    color: #ffffff;
  }
}

.dev-desc {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  line-height: 1.625;
  color: #6b7280;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  .dark & {
    color: #9ca3af;
  }
}

.dev-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;

  .dark & {
    border-color: #1f2937;
  }
}

.dev-subtitle {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
}

.dev-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  opacity: 0;
  transform: translateX(0.5rem);
  transition: all 0.3s;

  .dark & {
    background: #ffffff;
    color: #000000;
  }

  .project-card:hover & {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 封面图区域 */
.cover-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  margin-bottom: 1.5rem;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid transparent;
  background: #f3f4f6;
  transform: translate3d(0, 0, 0);
  transition: all 0.5s;

  .dark & {
    background: #1f2937;
  }

  .project-card:hover & {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .dark .project-card:hover & {
    box-shadow: none;
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s;
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
  background: #f3f4f6;
  transition: background-color 0.3s;

  .dark & {
    background: #1f2937;
  }

  .project-card:hover & {
    background: #e5e7eb;
  }

  .dark .project-card:hover & {
    background: #374151;
  }
}

.play-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background: #ff6699;
  color: #ffffff;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  transform: scale(1);
  transition: transform 0.3s;

  .project-card:hover & {
    transform: scale(1.1);
  }
}

.play-icon {
  width: 2rem;
  height: 2rem;
  margin-left: 0.25rem;
}

.play-label {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;

  .dark & {
    color: #9ca3af;
  }
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
  text-align: center;
  background: #e5e7eb;

  .dark & {
    background: #1f2937;
  }
}

.placeholder-title {
  margin: 0 0 0.5rem;
  font-weight: 900;
  line-height: 1.25;
  color: #9ca3af;

  .dark & {
    color: #4b5563;
  }

  @media (min-width: 768px) {
    margin-bottom: 0.75rem;
  }

  &.placeholder-title--all {
    font-size: 1.25rem;

    @media (min-width: 768px) {
      font-size: 1.5rem;
    }
  }

  &.placeholder-title--filtered {
    font-size: 1.5rem;

    @media (min-width: 768px) {
      font-size: 1.875rem;
    }
  }
}

.placeholder-subtitle {
  font-size: 1.125rem;
  font-weight: 400;
  opacity: 0.7;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}

.preview-badge {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  font-family: monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;

  .dark & {
    border-color: #374151;
    color: #9ca3af;
  }
}

.cover-tag {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #000000;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  .dark & {
    background: #000000;
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.1);
  }

  @media (min-width: 768px) {
    top: 1.5rem;
    left: 1.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}

/* 标题 + 描述信息区 */
.card-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: auto;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  transition: border-color 0.3s;

  .dark & {
    border-color: #1f2937;
  }

  .project-card:hover & {
    border-color: #000000;
  }

  .dark .project-card:hover & {
    border-color: #ffffff;
  }
}

.card-info-text {
  padding-right: 1rem;

  @media (min-width: 768px) {
    padding-right: 2rem;
  }
}

.card-title {
  margin: 0 0 0.5rem;
  font-weight: 900;
  line-height: 1.25;
  color: #000000;
  transition: color 0.3s;

  .dark & {
    color: #ffffff;
  }

  .project-card:hover & {
    color: #1f2937;
  }

  .dark .project-card:hover & {
    color: #e5e7eb;
  }

  @media (min-width: 768px) {
    margin-bottom: 0.75rem;
  }

  &.card-title--all {
    font-size: 1.25rem;

    @media (min-width: 768px) {
      font-size: 1.5rem;
    }
  }

  &.card-title--filtered {
    font-size: 1.5rem;

    @media (min-width: 768px) {
      font-size: 2.25rem;
    }
  }
}

.card-desc {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.625;
  color: #6b7280;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  .dark & {
    color: #9ca3af;
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
}

.card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.5rem;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  opacity: 0;
  transform: translateY(1rem);
  transition: all 0.3s;

  .dark & {
    background: #ffffff;
    color: #000000;
  }

  .project-card:hover & {
    opacity: 1;
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    padding: 0.75rem;
  }
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;

  @media (min-width: 768px) {
    gap: 0.75rem;
  }
}

.card-tag {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;

  .dark & {
    border-color: #1f2937;
    color: #6b7280;
  }

  @media (min-width: 768px) {
    font-size: 0.75rem;
  }
}

/* 灯箱 */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.9);

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
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  user-select: none;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #ffffff;
  }

  @media (min-width: 768px) {
    top: 0;
    right: 0;
    margin-top: -3rem;
    margin-right: -3rem;
  }
}

.lightbox-prev {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.5rem;
  border: none;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: color 0.3s, background-color 0.3s;

  &:hover {
    color: #ffffff;
    background: rgba(0, 0, 0, 0.4);
  }

  @media (min-width: 768px) {
    left: -4rem;
    background: transparent;
  }
}

.lightbox-next {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.5rem;
  border: none;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: color 0.3s, background-color 0.3s;

  &:hover {
    color: #ffffff;
    background: rgba(0, 0, 0, 0.4);
  }

  @media (min-width: 768px) {
    right: -4rem;
    background: transparent;
  }
}

.lightbox-page {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.5);
  font-family: monospace;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}
</style>
