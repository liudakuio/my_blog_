<!--
  每日一句：全站顶部通栏，紧贴导航栏下方，首页 / 作品 / 文章 / 联系每个页面都可见。
  取句逻辑在 src/data/dailyEnglish.ts：按「一年中的第几天」取模，同一天刷新结果不变。
  交互：朗读（Web Speech API）、复制、换一句（在当日基准上偏移，刷新后回到当日句子）。
  布局：桌面端横向三段（标签日期 / 句子 / 操作），移动端纵向堆叠。
-->
<template>
  <section class="daily" aria-labelledby="daily-sentence">
    <div class="u-container daily-inner">
      <!-- 左：模块标签 + 日期戳 -->
      <div class="daily-side">
        <span class="daily-tag">
          <span class="daily-dot"></span>
          {{ labels.tag }}
        </span>
        <span class="daily-date">{{ dateStamp }}</span>
      </div>

      <!-- 中：英文句子 + 中文释义 -->
      <div v-if="sentence" class="daily-main">
        <p id="daily-sentence" class="daily-en">{{ sentence.en }}</p>
        <p v-if="sentence.zh" class="daily-zh">{{ sentence.zh }}</p>
      </div>

      <!-- 右：操作按钮 -->
      <div class="daily-actions">
        <button
          class="daily-btn"
          :title="labels.speak"
          :aria-label="labels.speak"
          @click="speak"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4.03v8.06A4.5 4.5 0 0016.5 12z"/></svg>
          <span class="daily-btn-text">{{ labels.speak }}</span>
        </button>

        <button
          class="daily-btn"
          :class="{ 'daily-btn--on': copied }"
          :title="labels.copy"
          :aria-label="labels.copy"
          @click="copy"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h8"/></svg>
          <span class="daily-btn-text">{{ copied ? labels.copied : labels.copy }}</span>
        </button>

        <button
          class="daily-btn"
          :title="labels.next"
          :aria-label="labels.next"
          @click="next"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M21 12a9 9 0 11-3-6.7M21 3v6h-6"/></svg>
          <span class="daily-btn-text">{{ labels.next }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed,onMounted ,ref } from 'vue'
import { useAppStore } from '@/store/app'
import { fetchDailySentence } from '@/api/DailyEnglish'
import { weekdayShort, type DailySentence } from '@/data/dailyEnglish'


const appStore = useAppStore()

// 当前展示的句子：完全来自 API，加载完成前为 null
const sentence = ref<DailySentence | null>(null)
// 复制成功的短暂反馈
const copied = ref(false)

// 换一句的偏移量；刷新后归零，回到当日句子
const offset = ref(0)

const LABELS = {
  zh: { tag: '每日一句', speak: '朗读', copy: '复制', copied: '已复制', next: '换一句' },
  en: { tag: 'Daily English', speak: 'Speak', copy: 'Copy', copied: 'Copied', next: 'Next' }
}
const labels = computed(() => LABELS[appStore.language])

// 首屏拉取 API 句子（异步，不阻塞渲染）
onMounted(async () => {
  getFetchDailySentence()
})

// 日期戳：本地日期，格式 2026.10.10 · SAT
const dateStamp = computed(() => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} · ${weekdayShort(d)}`
})

// 朗读：不变，朗读英文
function speak() {
  if (!sentence.value) return
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(sentence.value.en)
  utter.lang = 'en-US'
  utter.rate = 0.92
  window.speechSynthesis.speak(utter)
}

async function getFetchDailySentence(){
  const api = await fetchDailySentence()
  if (api) sentence.value = api
}

// 复制：clipboard 不可用时回退到 textarea + execCommand
async function copy() {
  if (!sentence.value) return
  const text = `${sentence.value.en}\n${sentence.value.zh}`
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    document.body.removeChild(area)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 1600)
}

// 换一句：API 不支持随机，改为本地池随机
function next() {
  getFetchDailySentence()
}
</script>

<style lang="less" scoped>
/* 反色窄条：全站顶部通栏，高度克制，避免每个页面都被压重 */
.daily {
  position: relative;
  background: var(--inverse-bg);
  color: var(--inverse-fg);
  animation: riseIn 0.6s var(--ease-out) both;
}

.daily-inner {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.875rem;
  padding-bottom: 0.875rem;

  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: center;
    gap: 2rem;
  }
}

/* ---------- 左：标签与日期 ---------- */
.daily-side {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-shrink: 0;

  @media (min-width: 1024px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}

.daily-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  white-space: nowrap;
}

/* 呼吸的状态点 */
.daily-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.daily-date {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  opacity: 0.5;
  white-space: nowrap;
}

/* ---------- 中：句子 ---------- */
.daily-main {
  flex: 1;
  min-width: 0;
}

.daily-en {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.35;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }

  @media (min-width: 1024px) {
    font-size: 1.25rem;
    /* 桌面端通栏高度受限，最多两行 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.daily-zh {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  opacity: 0.68;
}

/* ---------- 右：操作 ---------- */
.daily-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.daily-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid color-mix(in srgb, var(--inverse-fg) 26%, transparent);
  border-radius: var(--radius-xs);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--inverse-fg);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  &.daily-btn--on {
    border-color: var(--accent);
    color: var(--accent);
  }

  @media (min-width: 768px) {
    padding: 0.4375rem 0.75rem;
    font-size: 0.6875rem;
  }
}

/* 窄屏只留图标，避免通栏换行溢出 */
.daily-btn-text {
  @media (max-width: 479px) {
    display: none;
  }
}
</style>
