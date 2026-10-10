<!--
  音乐播放器：浮动在右下角，支持播放/暂停、上下曲、进度拖拽、音量控制、淡入淡出
  数据来源：歌单来自本文件 MUSIC_PLAYLIST（本地写死），音频与封面放在 public/music 下。
  引用关系：由 src/layout/index.vue 挂载，浮动在页面右下角。
  注意：浏览器通常会拦截自动播放，播放失败时静默降级，需用户手动点击播放。
  样式：统一消费 src/styles/tokens.css 的语义令牌；无毛玻璃、无投影堆叠，改用实心硬边块 + 硬偏移投影。
-->
<template>
  <!-- 外层容器：pointer-events-none 避免遮挡页面点击 -->
  <div class="music-player">
    <!-- 音频元素：监听加载、播放、时间更新、结束等事件 -->
    <audio
      ref="audioRef"
      :src="getSongUrl(currentSong)"
      crossorigin="anonymous"
      @loadstart="isLoading = true"
      @waiting="isLoading = true"
      @canplay="isLoading = false"
      @playing="isLoading = false"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="handleNext"
      @error="onError"
    />

    <!-- 首次提示气泡：3秒后自动弹出，询问是否播放氛围音乐 -->
    <div v-if="showPrompt && !isOpen" class="player-prompt">
      <div class="prompt-head">
        <span class="prompt-tag">NOW / 氛围</span>
        <span class="prompt-rule"></span>
      </div>
      <p class="player-prompt-text">
        {{ appStore.language === 'zh' ? '来点背景音乐？' : 'Some ambient music?' }}
      </p>
      <div class="player-prompt-actions">
        <button class="player-prompt-no" @click="handlePromptResponse(false)">
          {{ appStore.language === 'zh' ? '不了' : 'NO' }}
        </button>
        <button class="player-prompt-yes" @click="handlePromptResponse(true)">
          {{ appStore.language === 'zh' ? '阔以' : 'SURE' }}
        </button>
      </div>
    </div>

    <!-- 播放器主体：展开/收起动画 -->
    <div class="player-root" ref="playerRef">
      <div
        class="player-size"
        :class="{ 'player-size--open': isOpen && !isClosing }"
      >
        <!-- 收起状态：方形耳机图标按钮 -->
        <button
          v-if="!isOpen || isClosing"
          class="player-toggle"
          :class="{
            'player-toggle--hidden': isClosing,
            'player-toggle--visible': !isClosing,
            'is-playing': isPlaying
          }"
          :aria-label="appStore.language === 'zh' ? '打开播放器' : 'Open player'"
          @click="isOpen = true"
        >
          <!-- 播放中时耳机图标缓慢旋转 -->
          <el-icon :size="18" class="headset-icon">
            <Headset />
          </el-icon>
        </button>

        <!-- 展开状态：实心硬边面板 -->
        <div
          v-if="isOpen"
          class="player-panel"
          :class="{
            'player-panel--hidden': isClosing,
            'player-panel--visible': !isClosing
          }"
        >
          <!-- 顶部：状态灯 + 曲目序号 + 关闭 -->
          <div class="player-top">
            <div class="player-status">
              <!-- 状态灯：加载中=灰脉冲，播放中=朱红脉冲 -->
              <span
                class="player-status-light"
                :class="{
                  'player-status-light--loading': showLoadingUI && isPlaying,
                  'player-status-light--playing': !(showLoadingUI && isPlaying)
                }"
              ></span>
              <span class="player-status-text">
                {{ showLoadingUI && isPlaying
                  ? (appStore.language === 'zh' ? '缓冲中' : 'BUFFERING')
                  : (appStore.language === 'zh' ? '正在播放' : 'NOW PLAYING') }}
              </span>
            </div>
            <div class="player-top-right">
              <span class="player-count">
                {{ String(currentSongIndex + 1).padStart(2, '0') }}/{{ String(MUSIC_PLAYLIST.length).padStart(2, '0') }}
              </span>
              <button class="player-close" :aria-label="appStore.language === 'zh' ? '收起' : 'Close'" @click="handleClose">
                <el-icon :size="16"><ArrowDown /></el-icon>
              </button>
            </div>
          </div>

          <!-- 歌曲信息：方形封面 + 标题 + 艺术家 -->
          <div class="player-song">
            <div class="player-cover">
              <img :src="getSongUrl(currentSong, true)" :alt="currentSong.title" />
            </div>
            <div class="player-song-text">
              <h3 class="player-song-title">{{ currentSong.title }}</h3>
              <p class="player-song-artist">{{ currentSong.artist }}</p>
            </div>
          </div>

          <!-- 进度条 + 音量 + 播放控制 -->
          <div class="player-controls">
            <div class="player-progress">
              <!-- 时间显示 -->
              <div class="player-time-row">
                <span class="player-time player-time--cur">{{ formatTime(progress) }}</span>
                <span class="player-time player-time--total">{{ formatTime(duration) }}</span>
              </div>
              <!-- 进度滑块：拖拽时暂停时间更新，松手后跳转 -->
              <div class="player-range-wrap">
                <input
                  type="range"
                  :min="0"
                  :max="duration || 100"
                  :value="progress"
                  class="music-progress-range"
                  :style="{ '--pct': `${(progress / (duration || 1)) * 100}%` }"
                  :aria-label="appStore.language === 'zh' ? '播放进度' : 'Progress'"
                  @mousedown="isSeeking = true"
                  @touchstart="isSeeking = true"
                  @input="onSeekInput"
                  @mouseup="onSeekEnd"
                  @touchend="onSeekEnd"
                />
              </div>
            </div>

            <!-- 音量 + 播放控制按钮 -->
            <div class="player-bottom">
              <!-- 音量滑块：使用 ElasticSlider 组件，平方根映射音量 -->
              <div class="player-volume">
                <ElasticSlider
                  :model-value="(isMuted ? 0 : Math.sqrt(volume)) * 1000"
                  :max-value="1000"
                  :is-stepped="true"
                  :step-size="10"
                  @change="handleVolumeChange"
                >
                  <template #leftIcon>
                    <button
                      class="player-volume-btn"
                      :aria-label="appStore.language === 'zh' ? '静音' : 'Mute'"
                      @click="isMuted = !isMuted"
                    >
                      <el-icon :size="14"><Mute v-if="isMuted || volume === 0" /><VideoPlay v-else /></el-icon>
                    </button>
                  </template>
                </ElasticSlider>
              </div>

              <!-- 上一曲 / 播放暂停 / 下一曲 -->
              <div class="player-buttons">
                <button class="player-btn-side" :aria-label="appStore.language === 'zh' ? '上一曲' : 'Prev'" @click="handlePrev">
                  <el-icon :size="16"><DArrowLeft /></el-icon>
                </button>
                <button
                  class="player-btn-play"
                  :aria-label="isPlaying ? (appStore.language === 'zh' ? '暂停' : 'Pause') : (appStore.language === 'zh' ? '播放' : 'Play')"
                  @click="handlePlayPause"
                >
                  <!-- 加载中显示旋转加载圈 -->
                  <div v-if="showLoadingUI && isPlaying" class="player-btn-loading">
                    <div class="player-spinner"></div>
                  </div>
                  <div
                    class="player-btn-icon"
                    :class="{
                      'player-btn-icon--hidden': showLoadingUI && isPlaying,
                      'player-btn-icon--visible': !(showLoadingUI && isPlaying)
                    }"
                  >
                    <el-icon :size="18">
                      <VideoPause v-if="isPlaying" />
                      <CaretRight v-else />
                    </el-icon>
                  </div>
                </button>
                <button class="player-btn-side" :aria-label="appStore.language === 'zh' ? '下一曲' : 'Next'" @click="handleNext">
                  <el-icon :size="16"><DArrowRight /></el-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- 底部：歌单链接卡片 -->
          <div class="player-playlist">
            <a
              href="https://music.163.com/playlist?id=2090469224"
              target="_blank"
              rel="noopener noreferrer"
              class="player-playlist-link"
            >
              <div class="player-playlist-card">
                <div class="player-playlist-text">
                  <span class="player-playlist-title">
                    {{ appStore.language === 'zh' ? '品味不错？' : 'NICE TASTE?' }}
                  </span>
                  <span class="player-playlist-sub">
                    {{
                      appStore.language === 'zh'
                        ? '我的歌单有更多好听的哦'
                        : 'Check out my full playlist'
                    }}
                  </span>
                </div>
                <div class="player-playlist-icon">
                  <el-icon :size="14" class="player-playlist-icon-el"><TopRight /></el-icon>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import {
  Headset, ArrowDown, DArrowLeft, DArrowRight, CaretRight, VideoPause, TopRight,
  Mute, VideoPlay
} from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
interface Song {
  id: string
  title: string
  artist: string
  cover: string
  audio: string
}

const MUSIC_PLAYLIST: Song[] = [
  { id: 'local-01', title: '主动', artist: '加木', cover: '/music/covers/pirene.jpg', audio: '/music/audio/zhudong.mp3' },
  { id: 'local-02', title: "Pirene's Fountain", artist: 'Vallès', cover: '/music/covers/lofi.jpg', audio: '/music/audio/pirene.mp3' },
  { id: 'local-03', title: 'Island', artist: 'Nujabes/Uyama Hiroto/Haruka Nakamura', cover: '/music/covers/island.jpg', audio: '/music/audio/island.mp3' },
  { id: 'local-04', title: 'the updater', artist: 'TSUTCHIE', cover: '/music/covers/updater.jpg', audio: '/music/audio/updater.mp3' }
]
import ElasticSlider from './ElasticSlider.vue'

const appStore = useAppStore()

// 音频元素引用
const audioRef = ref<HTMLAudioElement | null>(null)
// 播放器容器引用（用于点击外部关闭）
const playerRef = ref<HTMLElement | null>(null)

// 播放器展开/收起状态
const isOpen = ref(false)
// 收起动画进行中
const isClosing = ref(false)
// 是否显示首次提示气泡
const showPrompt = ref(false)
// 用户是否已交互（不再显示提示）
const hasInteracted = ref(false)
// 是否正在播放
const isPlaying = ref(false)
// 当前歌曲索引
const currentSongIndex = ref(0)
// 是否静音
const isMuted = ref(false)
// 音量（0~1），从 localStorage 恢复，默认 0.37
const volume = ref(parseFloat(localStorage.getItem('music-player-volume') || '0.37'))
// 当前播放进度（秒）
const progress = ref(0)
// 歌曲总时长（秒）
const duration = ref(0)
// 音频是否正在加载
const isLoading = ref(false)
// 是否显示加载 UI（延迟 300ms 显示，避免闪烁）
const showLoadingUI = ref(false)
// 是否正在拖拽进度条
const isSeeking = ref(false)

// 当前播放的歌曲对象
const currentSong = computed(() => MUSIC_PLAYLIST[currentSongIndex.value])

// 加载状态延迟显示定时器
let loadingTimer: ReturnType<typeof setTimeout> | null = null
// 淡入淡出定时器
let fadeInterval: ReturnType<typeof setInterval> | null = null

// 加载状态变化时：延迟 300ms 显示加载 UI（避免短暂加载闪烁）
watch(isLoading, (val) => {
  if (val) {
    if (loadingTimer) return
    loadingTimer = setTimeout(() => { showLoadingUI.value = true }, 300)
  } else {
    if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null }
    showLoadingUI.value = false
  }
})

// 播放状态变化时：淡入播放 或 淡出后暂停
watch(isPlaying, () => {
  const audio = audioRef.value
  if (!audio) return

  if (isPlaying.value) {
    // 淡入：先静音播放，再逐步提升音量
    if (audio.paused) {
      audio.volume = 0
      audio.play().catch((err) => {
        // 切歌导致的播放中断（AbortError）不算失败
        if ((err as DOMException)?.name === 'AbortError') return
        isPlaying.value = false
      })
    }
    fadeTo(isMuted.value ? 0 : volume.value)
  } else {
    // 淡出完成后暂停
    fadeTo(0, () => { audio.pause() })
  }
})

// 切歌时：等 audio 的 src 更新到 DOM 后自动续播（修复切歌后不立即播放的问题）
watch(currentSongIndex, async () => {
  if (!isPlaying.value) return
  await nextTick()
  const audio = audioRef.value
  if (!audio) return

  audio.volume = 0
  try {
    await audio.play()
    fadeTo(isMuted.value ? 0 : volume.value)
  } catch (err) {
    if ((err as DOMException)?.name !== 'AbortError') {
      isPlaying.value = false
    }
  }
})

// 音量/静音变化时：立即应用到音频元素（修复调节音量不生效的问题）
watch([volume, isMuted], ([v, muted]) => {
  const audio = audioRef.value
  if (!audio) return
  // 淡出暂停过程中不干预，避免打断暂停流程
  if (fadeInterval && !isPlaying.value) return
  fadeTo(muted ? 0 : v)
})

// 音量变化时：持久化到 localStorage
watch(volume, (val) => {
  localStorage.setItem('music-player-volume', val.toString())
})

// 获取歌曲 URL（本地路径或远程 URL）
function getSongUrl(song: typeof currentSong.value, isCover = false) {
  const path = isCover ? song.cover : song.audio
  if (path.startsWith('http')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return encodeURI(normalized)
}

// 音频淡入淡出到目标音量：每 50ms 调整 0.1 的音量步进，完成后可选执行回调
function fadeTo(target: number, onDone?: () => void) {
  const audio = audioRef.value
  if (!audio) return

  if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null }

  fadeInterval = setInterval(() => {
    const current = audio.volume
    const step = 0.1
    const diff = target - current

    if (Math.abs(diff) < step) {
      audio.volume = target
      if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null }
      onDone?.()
    } else {
      audio.volume = Math.min(1, Math.max(0, current + (diff > 0 ? step : -step)))
    }
  }, 50)
}

// 播放/暂停切换
function handlePlayPause() {
  isPlaying.value = !isPlaying.value
}

// 下一曲（循环）
function handleNext() {
  currentSongIndex.value = (currentSongIndex.value + 1) % MUSIC_PLAYLIST.length
  isPlaying.value = true
}

// 上一曲（循环）
function handlePrev() {
  currentSongIndex.value =
    (currentSongIndex.value - 1 + MUSIC_PLAYLIST.length) % MUSIC_PLAYLIST.length
  isPlaying.value = true
}

// 首次提示气泡的响应
function handlePromptResponse(accept: boolean) {
  showPrompt.value = false
  hasInteracted.value = true
  if (accept) {
    isOpen.value = true
    isPlaying.value = true
  }
}

// 关闭播放器：先播放收起动画，400ms 后真正关闭
function handleClose() {
  isClosing.value = true
  setTimeout(() => {
    isOpen.value = false
    isClosing.value = false
  }, 400)
}

// 音量变化处理：ElasticSlider 值（0~1000）→ 平方映射为实际音量（0~1）
function handleVolumeChange(val: number) {
  const normalizedVal = val / 1000
  volume.value = Math.pow(normalizedVal, 2)
  if (val > 0 && isMuted.value) isMuted.value = false
}

// 音频时间更新：拖拽进度条时不更新
function onTimeUpdate(e: Event) {
  if (!isSeeking.value && e.target) {
    progress.value = (e.target as HTMLAudioElement).currentTime
  }
}

// 音频元数据加载完成：获取总时长
function onLoadedMetadata(e: Event) {
  duration.value = (e.target as HTMLAudioElement).duration
}

// 进度条拖拽输入
function onSeekInput(e: Event) {
  progress.value = parseFloat((e.target as HTMLInputElement).value)
}

// 进度条拖拽结束：跳转到目标时间
function onSeekEnd(e: Event) {
  isSeeking.value = false
  const time = parseFloat((e.target as HTMLInputElement).value)
  if (audioRef.value) {
    audioRef.value.currentTime = time
    if (isPlaying.value) {
      audioRef.value.play().catch(() => { isPlaying.value = false })
    }
  }
}

// 音频加载错误：停止播放
function onError() {
  isPlaying.value = false
  isLoading.value = false
}

// 时间格式化：秒数 → "m:ss"
function formatTime(time: number) {
  if (isNaN(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 3秒后自动显示首次提示气泡
setTimeout(() => {
  if (!isOpen.value && !hasInteracted.value) {
    showPrompt.value = true
  }
}, 3000)

// 点击播放器外部区域关闭播放器
function handleClickOutside(e: MouseEvent) {
  if (isOpen.value && !isClosing.value && playerRef.value && !playerRef.value.contains(e.target as Node)) {
    handleClose()
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('mousedown', handleClickOutside)
}

// 组件卸载时清理：移除事件监听、清除定时器、暂停音频
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  if (fadeInterval) clearInterval(fadeInterval)
  if (loadingTimer) clearTimeout(loadingTimer)
  if (audioRef.value) audioRef.value.pause()
})
</script>

<style lang="less" scoped>
/* 播放器外层容器 */
.music-player {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  pointer-events: none;

  @media (min-width: 768px) {
    right: 2rem;
    bottom: 2rem;
  }
}

/* ── 首次提示气泡：硬边小卡 ─────────────── */
.player-prompt {
  pointer-events: auto;
  width: 232px;
  padding: 0.875rem 0.875rem 0.75rem;
  border: 1px solid var(--ink);
  border-radius: var(--radius-sm);
  background: var(--surface);
  box-shadow: 4px 4px 0 var(--ink);
  animation: fadeUp 0.4s var(--ease-out) both;
}

.prompt-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.prompt-tag {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--accent-text);
  white-space: nowrap;
}

.prompt-rule {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.player-prompt-text {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--fg);
}

.player-prompt-actions {
  display: flex;
  gap: 0.375rem;
  justify-content: flex-end;
}

.player-prompt-no,
.player-prompt-yes {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--ink);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}

.player-prompt-no {
  background: transparent;
  color: var(--fg-muted);

  &:hover {
    background: var(--surface-sunken);
    color: var(--fg);
  }
}

.player-prompt-yes {
  background: var(--inverse-bg);
  color: var(--inverse-fg);

  &:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
}

.player-root {
  position: relative;
  pointer-events: auto;
}

/* 展开/收起尺寸容器 */
.player-size {
  position: relative;
  width: 3rem;
  height: 3rem;
  transition: width 0.42s var(--ease-out), height 0.42s var(--ease-out);

  &.player-size--open {
    width: 330px;
    height: 372px;
  }
}

/* 收起状态：方形耳机按钮（反色实心） */
.player-toggle {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ink);
  border-radius: var(--radius-sm);
  background: var(--inverse-bg);
  color: var(--inverse-fg);
  box-shadow: 4px 4px 0 var(--ink);
  cursor: pointer;
  transition: transform 0.42s var(--ease-out), opacity 0.42s var(--ease-out),
    background var(--dur) var(--ease-out);

  &.player-toggle--visible {
    transform: scale(1);
    opacity: 1;

    &:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
  }

  &.player-toggle--hidden {
    transform: scale(0.2);
    opacity: 0;
  }

  &.is-playing {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
}

/* 耳机图标：播放中持续旋转，未播放时 hover 旋转 */
.headset-icon {
  .player-toggle:hover &,
  .player-toggle.is-playing & {
    animation: spin-slow 8s linear infinite;
  }
}

/* 展开状态：实心硬边面板 */
.player-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 1.125rem;
  border: 1px solid var(--ink);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface);
  box-shadow: 6px 6px 0 var(--ink);
  transform-origin: bottom right;
  transition: transform 0.42s var(--ease-out), opacity 0.42s var(--ease-out);

  &.player-panel--visible {
    transform: scale(1);
    opacity: 1;
  }

  &.player-panel--hidden {
    transform: scale(0.12) translate(0.75rem, 0.75rem);
    opacity: 0;
  }
}

/* ── 顶部状态栏 ───────────────────────── */
.player-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-status-light {
  width: 7px;
  height: 7px;
  background: var(--accent);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  &.player-status-light--loading {
    background: var(--fg-faint);
  }

  &.player-status-light--playing {
    background: var(--accent);
  }
}

.player-status-text {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--fg-muted);
}

.player-top-right {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.player-count {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--fg-faint);
}

.player-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--inverse-bg);
    border-color: var(--ink);
    color: var(--inverse-fg);
  }
}

/* ── 歌曲信息：方形封面 + 标题 ───────────── */
.player-song {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px dashed var(--border);
}

.player-cover {
  flex-shrink: 0;
  width: 3.25rem;
  height: 3.25rem;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--surface-sunken);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.player-song-text {
  min-width: 0;
}

.player-song-title {
  margin: 0 0 0.1875rem;
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-song-artist {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.06em;
  color: var(--fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 控制区 ──────────────────────────── */
.player-controls {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.player-progress {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.player-time-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.player-time {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;

  &--cur {
    color: var(--fg);
  }

  &--total {
    color: var(--fg-faint);
  }
}

/* 进度条：轨道 4px，填充朱红，滑块为方形墨块 */
.music-progress-range {
  width: 100%;
  height: 14px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &::-webkit-slider-runnable-track {
    height: 4px;
    border: none;
    background: linear-gradient(
      to right,
      var(--accent) var(--pct, 0%),
      var(--border) var(--pct, 0%)
    );
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 5px;
    height: 14px;
    margin-top: -5px;
    border: none;
    border-radius: 0;
    background: var(--ink);
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out);
  }

  &:hover::-webkit-slider-thumb {
    background: var(--accent);
  }

  &::-moz-range-track {
    height: 4px;
    border: none;
    background: var(--border);
  }

  &::-moz-range-progress {
    height: 4px;
    background: var(--accent);
  }

  &::-moz-range-thumb {
    width: 5px;
    height: 14px;
    border: none;
    border-radius: 0;
    background: var(--ink);
    cursor: pointer;
  }
}

.player-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.player-volume {
  flex: 1;
  min-width: 0;
}

.player-volume-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--inverse-bg);
    border-color: var(--ink);
    color: var(--inverse-fg);
  }
}

.player-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.player-btn-side {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--inverse-bg);
    border-color: var(--ink);
    color: var(--inverse-fg);
  }
}

.player-btn-play {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--ink);
  border-radius: var(--radius-sm);
  background: var(--inverse-bg);
  color: var(--inverse-fg);
  cursor: pointer;
  overflow: hidden;
  transition: background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  &:active {
    transform: scale(0.94);
  }
}

.player-btn-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--border);
  border-top-color: currentColor;
  animation: spin 1s linear infinite;
}

.player-btn-icon {
  transition: opacity 0.3s;

  &.player-btn-icon--hidden {
    opacity: 0;
  }

  &.player-btn-icon--visible {
    opacity: 1;
  }
}

/* ── 歌单链接卡片：虚线描边 → hover 反色 ── */
.player-playlist-link {
  display: block;
  width: 100%;
  text-decoration: none;
}

.player-playlist-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--inverse-bg);
    border-color: var(--ink);
    border-style: solid;

    .player-playlist-title,
    .player-playlist-sub,
    .player-playlist-icon-el {
      color: var(--inverse-fg);
    }

    .player-playlist-icon {
      background: color-mix(in srgb, var(--inverse-fg) 18%, transparent);
    }
  }
}

.player-playlist-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.player-playlist-title {
  margin-bottom: 0.125rem;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--fg);
}

.player-playlist-sub {
  font-size: 0.6875rem;
  color: var(--fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--dur-fast) var(--ease-out);
}

.player-playlist-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--surface-sunken);
  transition: background var(--dur-fast) var(--ease-out);
}

.player-playlist-icon-el {
  color: var(--fg-muted);
  transition: color var(--dur-fast) var(--ease-out);
}

/* 耳机图标慢速旋转动画（播放中） */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .player-size,
  .player-panel,
  .player-toggle {
    transition-duration: 0.01ms;
  }

  .headset-icon,
  .player-status-light,
  .player-spinner {
    animation: none;
  }
}
</style>
