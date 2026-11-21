<!--
  每日一句：全站顶部通栏，紧贴导航栏下方，首页 / 作品 / 文章 / 联系每个页面都可见。
  取句逻辑：调用第三方 API（src/api/dailyEnglish.ts），失败时回退本地句池；
    第三方接口不支持指定句子，故「换一句」按钮即重新请求一次。
  交互：朗读（Web Speech API）、复制、换一句。
  朗读：始终朗读英文原句，不读中文释义。Chrome 会自动为 utter.lang 匹配在线英语语音；
    Edge 需显式指定 voice，且 cancel() 后立即 speak() 会被丢弃，详见 pickVoice / speak 注释。
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
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { useAppStore } from '@/store/app'
import { fetchDailySentence } from '@/api/dailyEnglish'
import type { DailySentence } from '@/data/dailyEnglish'
import { todayStamp } from '@/utils/date'
import { writeClipboard } from '@/utils/clipboard'


const appStore = useAppStore()

// 当前展示的句子：完全来自 API，加载完成前为 null
const sentence = ref<DailySentence | null>(null)
// 复制成功的短暂反馈
const copied = ref(false)

const LABELS = {
  zh: { tag: '每日一句', speak: '朗读', copy: '复制', copied: '已复制', next: '换一句' },
  en: { tag: 'Daily English', speak: 'Speak', copy: 'Copy', copied: 'Copied', next: 'Next' }
}
const labels = computed(() => LABELS[appStore.language])

// 系统可用的语音列表：Edge 首次调用 getVoices() 可能为空，需等 voiceschanged 事件。
// 必须用 shallowRef：Voice 是浏览器原生对象，若被 Vue 代理成响应式 Proxy，
// 赋给 utter.voice 时 Edge 会因实例校验失败而静默不播放（Chrome 对此宽容）。
const voices = shallowRef<SpeechSynthesisVoice[]>([])

/** 读取当前系统语音列表 */
function loadVoices() {
  if (!('speechSynthesis' in window)) return
  voices.value = window.speechSynthesis.getVoices()
}

// 首屏拉取 API 句子 + 预热语音列表（异步，不阻塞渲染）
onMounted(async () => {
  loadSentence()
  if ('speechSynthesis' in window) {
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
  }
})

onUnmounted(() => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }
})

// 日期戳：本地日期，格式 2026.10.10 · SAT
const dateStamp = computed(() => todayStamp())

/**
 * 挑选朗读语音，按可用性与可靠度排序：
 *   本地 en-US → 本地 en-GB → 本地任意语音 → 在线 en-US → 在线 en-GB → 在线任意语音。
 * 说明：Edge 的在线自然语音（如 Microsoft Ava Online (Natural)）通过 Web Speech API
 *   调用时可能静默失败，因此本地语音优先；本地中文语音念英文虽发音不准，
 *   但能稳定出声，优于在线语音无声。
 * @returns voice 选中的语音；isEnglish 是否为英文语音
 */
function pickVoice(): { voice?: SpeechSynthesisVoice; isEnglish: boolean } {
  const list = voices.value.length
    ? voices.value
    : (window.speechSynthesis?.getVoices() ?? [])
  const english = list.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const isUs = (v: SpeechSynthesisVoice) => v.lang.toLowerCase() === 'en-us'
  const isGb = (v: SpeechSynthesisVoice) => v.lang.toLowerCase() === 'en-gb'
  const voice = english.find((v) => isUs(v) && v.localService)
    ?? english.find((v) => isGb(v) && v.localService)
    // 本地中文语音能稳定出声，用它念英文虽发音不准，也比在线语音静默失败强
    ?? list.find((v) => v.localService)
    ?? english.find((v) => isUs(v))
    ?? english.find((v) => isGb(v))
    ?? english[0]
    ?? list[0]
   return {
    voice,
    isEnglish: !!voice && voice.lang.toLowerCase().startsWith('en')
  }
}

/** 朗读当前英文原句（不朗读中文释义） */
function speak() {
  const enText = sentence.value?.en
  if (!enText || !('speechSynthesis' in window)) return

  const synth = window.speechSynthesis
  // Edge 在异常中断后可能残留 pending / paused，直接 speak() 会被丢弃
  if (synth.paused) synth.resume()

  const { voice, isEnglish } = pickVoice()
  // 朗读内容始终是英文原句；没有英文发音人时由系统其他语音念英文，效果可能不准
  const utter = new SpeechSynthesisUtterance(enText)
  if (voice) {
    // 必须是 getVoices() 返回的原始实例（见 voices 的 shallowRef 说明），
    // 且 lang 与 voice.lang 保持一致，Edge 才认得这个发音人。
    utter.voice = voice
    utter.lang = voice.lang
  } else {
    // 语音列表尚未加载完：保持英文配置，由浏览器自行匹配（Chrome 可正常播放）
    utter.lang = 'en-US'
  }
  utter.rate = isEnglish ? 0.92 : 1

  const wasSpeaking = synth.speaking || synth.pending
  if (wasSpeaking) {
    // Edge 的 cancel() 是异步生效的，紧接着 speak() 会被丢弃；让出一帧再朗读。
    // 只在确实有任务需要取消时才走这条分支，避免首次点击就踩到该问题。
    synth.cancel()
    setTimeout(() => synth.speak(utter), 120)
  } else {
    synth.speak(utter)
  }
}

/** 拉取一句话并更新展示（第三方接口失败时内部已回退本地句池） */
async function loadSentence(){
  const api = await fetchDailySentence()
  if (api) sentence.value = api
}

// 复制英文 + 中文释义（实现见 utils/clipboard.ts，内部含 execCommand 回退）
async function copy() {
  if (!sentence.value) return
  const text = `${sentence.value.en}\n${sentence.value.zh}`
  await writeClipboard(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1600)
}

// 换一句：第三方接口每次返回不同句子，重新请求一次即可
function next() {
  loadSentence()
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
