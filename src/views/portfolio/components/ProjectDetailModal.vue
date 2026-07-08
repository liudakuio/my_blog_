<!-- 项目详情弹窗：展示项目完整信息、图片画廊、外部链接，支持灯箱查看大图 -->
<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="visible ? 'animate-fadeIn' : ''" @click="$emit('close')">
      <div
        class="modal-panel"
        :class="visible ? 'animate-message-pop' : 'animate-message-pop-out'"
      >
        <button class="modal-close" @click="$emit('close')">
          <el-icon :size="24" class="modal-close-icon"><Close /></el-icon>
        </button>

        <template v-if="project">
          <!-- 摄影类：图片画廊 -->
          <div v-if="project.category === 'Photography'" class="gallery-wrap">
            <h2 class="gallery-title">{{ content.title }}</h2>
            <p class="gallery-subtitle">{{ content.description }}</p>
            <div class="gallery-grid">
              <div
                v-for="(img, idx) in gallery"
                :key="idx"
                class="gallery-item"
                @click="openLightbox(idx)"
              >
                <img
                  :src="img"
                  :alt="`${content.title} ${idx + 1}`"
                  loading="lazy"
                  class="gallery-image"
                  referrerpolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          <!-- 其他类别：媒体预览 + 详细信息 -->
          <div v-else>
            <div
              class="media-frame"
              :class="{
                'media-frame--tall': project.figmaUrl || project.websiteUrl,
                'media-frame--video': !project.figmaUrl && !project.websiteUrl && (project.videoUrl || project.bilibiliId),
                'media-frame--short': !project.figmaUrl && !project.websiteUrl && !project.videoUrl && !project.bilibiliId
              }"
            >
              <video v-if="project.videoUrl" :src="project.videoUrl" controls class="media-video" :poster="project.image" />
              <iframe
                v-else-if="project.bilibiliId"
                :src="`https://player.bilibili.com/player.html?bvid=${project.bilibiliId}&page=1&high_quality=1&danmaku=0&autoplay=0`"
                class="media-iframe"
                scrolling="no"
                frameborder="0"
                allowfullscreen
              ></iframe>
              <iframe
                v-else-if="project.figmaUrl"
                :src="`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(project.figmaUrl)}`"
                class="media-iframe"
                allowfullscreen
              ></iframe>
              <iframe
                v-else-if="project.websiteUrl"
                :src="project.websiteUrl"
                class="media-iframe media-iframe--light"
                allowfullscreen
              ></iframe>
              <div v-else class="media-placeholder">
                <div class="media-placeholder-inner">
                  <h2 class="placeholder-title">{{ content.title }}</h2>
                  <p class="placeholder-text">
                    {{ appStore.language === 'zh' ? '预览部署中...' : 'Preview Deploying...' }}
                  </p>
                </div>
              </div>
              <div v-if="!project.videoUrl && !project.bilibiliId && !project.figmaUrl && !project.websiteUrl && project.image" class="media-gradient"></div>
            </div>

            <div class="modal-body">
              <div class="modal-body-head">
                <div class="modal-tags">
                  <span class="modal-category">{{ categoryLabels[project.category] || project.category }}</span>
                  <span class="modal-subtitle">{{ content.subtitle }}</span>
                </div>
                <h2 class="modal-title">{{ content.title }}</h2>
                <p class="modal-description">{{ content.description }}</p>
              </div>

              <div class="modal-divider"></div>

              <div class="modal-content-grid">
                <div v-if="content.concept" class="concept-block">
                  <h3 class="concept-title">
                    {{ appStore.language === 'zh' ? '设计意图 / 创意陈述' : 'Concept / Statement' }}
                  </h3>
                  <p class="concept-text">{{ content.concept }}</p>
                </div>

                <div class="meta-block">
                  <div v-if="content.awards && content.awards.length > 0 && !isNoneAward(content.awards)" class="awards-block">
                    <h4 class="block-title">
                      {{ appStore.language === 'zh' ? '获奖情况' : 'Awards & Recognition' }}
                    </h4>
                    <ul class="awards-list">
                      <li
                        v-for="(award, i) in content.awards"
                        :key="i"
                        class="award-item"
                      >
                        <span class="award-star">★</span>
                        <span>{{ award }}</span>
                      </li>
                    </ul>
                  </div>

                  <div class="roles-block">
                    <div class="role-col">
                      <h4 class="block-title">
                        {{ appStore.language === 'zh' ? '分工与职责' : 'Role & Responsibility' }}
                      </h4>
                      <p class="role-text">
                        <span class="role-name">{{ content.role }}</span>
                        {{ content.roleDetail }}
                      </p>
                    </div>
                    <div class="tags-col">
                      <h4 class="block-title">Tags</h4>
                      <div class="tag-list">
                        <span
                          v-for="tag in content.tags"
                          :key="tag"
                          class="tag-chip"
                        >{{ tag }}</span>
                      </div>
                    </div>
                    <div v-if="project.githubUrl || project.websiteUrl" class="links-col">
                      <h4 class="block-title">
                        {{ appStore.language === 'zh' ? '相关链接' : 'Links' }}
                      </h4>
                      <div class="link-list">
                        <a
                          v-if="project.githubUrl"
                          :href="project.githubUrl"
                          target="_blank"
                          class="link-item"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" class="github-icon"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          <span class="link-label">GitHub</span>
                        </a>
                        <a
                          v-if="project.websiteUrl"
                          :href="project.websiteUrl"
                          target="_blank"
                          class="link-item"
                        >
                          <el-icon><Link /></el-icon>
                          <span class="link-label">Demo</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Close, Link } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import type { Project } from '@/types'

const props = defineProps<{
  visible: boolean
  project: Project['common'] & Project['zh'] & Project['en'] & { category: string } | null
}>()

const emit = defineEmits<{
  close: []
  lightbox: [index: number, gallery: string[]]
}>()

const appStore = useAppStore()

const content = computed(() => {
  if (!props.project) return null
  const key = appStore.language === 'zh' ? 'zh' : 'en'
  return props.project as any
})

const categoryLabels: Record<string, string> = {
  'Videography': appStore.language === 'zh' ? '动态影像' : 'Videography',
  'Graphics & UI': appStore.language === 'zh' ? '平面交互' : 'Graphics & UI',
  'Photography': appStore.language === 'zh' ? '静态摄影' : 'Photography',
  'Development': appStore.language === 'zh' ? '应用开发' : 'Development'
}

const gallery = computed(() => {
  if (!props.project) return []
  const g = props.project?.gallery || []
  return g
})

function isNoneAward(awards: string[]) {
  return awards.some(a => a === '暂无获奖' || a === '无' || a === 'None')
}

function openLightbox(index: number) {
  emit('lightbox', index, gallery.value)
}
</script>

<style lang="less" scoped>
/* 弹窗遮罩层 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  @media (min-width: 640px) {
    padding: 2rem;
  }
}

/* 弹窗面板 */
.modal-panel {
  position: relative;
  width: 100%;
  max-width: 64rem;
  max-height: 90vh;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  &::-webkit-scrollbar {
    display: none;
  }

  .dark & {
    background: #111827;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* 关闭按钮 */
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  padding: 0.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .dark & {
    background: rgba(0, 0, 0, 0.5);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  @media (min-width: 768px) {
    top: 1.5rem;
    right: 1.5rem;
  }
}

.modal-close-icon {
  color: #000000;

  .dark & {
    color: #ffffff;
  }
}

/* 摄影类画廊 */
.gallery-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 3rem;
  }
}

.gallery-title {
  margin: 0 0 1rem;
  font-size: 1.875rem;
  font-weight: 900;
  text-align: center;
  color: #000000;

  .dark & {
    color: #ffffff;
  }

  @media (min-width: 768px) {
    font-size: 3rem;
  }
}

.gallery-subtitle {
  max-width: 42rem;
  margin: 0 0 3rem;
  font-size: 1.25rem;
  font-weight: 500;
  text-align: center;
  color: #6b7280;

  .dark & {
    color: #9ca3af;
  }
}

.gallery-grid {
  column-count: 1;
  column-gap: 1rem;

  @media (min-width: 768px) {
    column-count: 2;
  }

  @media (min-width: 1024px) {
    column-count: 3;
  }
}

.gallery-item {
  break-inside: avoid;
  margin-bottom: 1rem;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  position: relative;
  cursor: zoom-in;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  }
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s;

  .gallery-item:hover & {
    transform: scale(1.05);
  }
}

/* 媒体预览框 */
.media-frame {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  background: #e5e7eb;

  .dark & {
    background: #1f2937;
  }

  &.media-frame--tall {
    height: 60vh;

    @media (min-width: 768px) {
      height: 80vh;
    }
  }

  &.media-frame--video {
    aspect-ratio: 16 / 9;
  }

  &.media-frame--short {
    height: 30vh;

    @media (min-width: 768px) {
      height: 50vh;
    }
  }
}

.media-video,
.media-iframe {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 10;
  border: none;
}

.media-iframe--light {
  background: #ffffff;
}

.media-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #d1d5db;

  .dark & {
    background: #1f2937;
  }
}

.media-placeholder-inner {
  text-align: center;
}

.placeholder-title {
  margin: 0 0 0.5rem;
  font-size: 2.25rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.2);

  .dark & {
    color: rgba(255, 255, 255, 0.2);
  }
}

.placeholder-text {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(0, 0, 0, 0.2);

  .dark & {
    color: rgba(255, 255, 255, 0.2);
  }
}

.media-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  pointer-events: none;
}

/* 弹窗正文 */
.modal-body {
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 3rem;
  }
}

.modal-body-head {
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    margin-bottom: 3rem;
  }
}

.modal-tags {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.modal-category {
  padding: 0.375rem 1rem;
  background: #000000;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 0.375rem;

  .dark & {
    background: #ffffff;
    color: #000000;
  }
}

.modal-subtitle {
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
}

.modal-title {
  margin: 0 0 1.5rem;
  font-size: 2.25rem;
  font-weight: 900;
  line-height: 1.25;
  color: #000000;

  .dark & {
    color: #ffffff;
  }

  @media (min-width: 768px) {
    font-size: 3.75rem;
  }
}

.modal-description {
  max-width: 48rem;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.625;
  color: #4b5563;

  .dark & {
    color: #d1d5db;
  }

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
}

.modal-divider {
  width: 100%;
  height: 1px;
  margin-bottom: 2rem;
  background: #e5e7eb;

  .dark & {
    background: #374151;
  }

  @media (min-width: 768px) {
    margin-bottom: 3rem;
  }
}

.modal-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
  }
}

.concept-block {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.concept-title {
  margin: 0;
  padding-left: 1.5rem;
  border-left: 4px solid #000000;
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: #000000;

  .dark & {
    border-color: #ffffff;
    color: #ffffff;
  }
}

.concept-text {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.625;
  color: #4b5563;

  .dark & {
    color: #d1d5db;
  }
}

.meta-block {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: flex-start;

  @media (min-width: 768px) {
    flex-direction: row;
  }
}

.role-col,
.tags-col,
.links-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-width: 200px;
}

.block-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;

  .dark & {
    color: #6b7280;
  }
}

.role-text {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.625;
  color: #4b5563;

  .dark & {
    color: #9ca3af;
  }
}

.role-name {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #000000;

  .dark & {
    color: #ffffff;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-chip {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;

  .dark & {
    border-color: #374151;
    color: #6b7280;
  }
}

.link-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #000000;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #4b5563;
  }

  .dark & {
    color: #ffffff;

    &:hover {
      color: #d1d5db;
    }
  }
}

.link-label {
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
}

.github-icon {
  width: 18px;
  height: 18px;
}

.awards-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.awards-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.award-item {
  display: flex;
  align-items: baseline;
  font-size: 1.25rem;
  font-weight: 700;
  color: #000000;

  .dark & {
    color: #ffffff;
  }
}

.award-star {
  flex-shrink: 0;
  margin-right: 0.75rem;
  font-size: 1.125rem;
  color: #eab308;
}

/* 弹窗进出场动画 */
.animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
.animate-message-pop { animation: messagePop 0.3s ease-out forwards; }
.animate-message-pop-out { animation: messagePopOut 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes messagePop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes messagePopOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
</style>
