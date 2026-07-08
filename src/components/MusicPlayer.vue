<!-- 音乐播放器：浮动在右下角，支持播放/暂停、上下曲、进度拖拽、音量控制、淡入淡出 -->
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
      <p class="player-prompt-text">
        {{ appStore.language === 'zh' ? '👋 来点氛围音乐？' : '👋 How about some ambient music?' }}
      </p>
      <div class="player-prompt-actions">
        <button class="player-prompt-no" @click="handlePromptResponse(false)">
          {{ appStore.language === 'zh' ? '不了' : 'No thanks' }}
        </button>
        <button class="player-prompt-yes" @click="handlePromptResponse(true)">
          {{ appStore.language === 'zh' ? '阔以' : 'Sure' }}
        </button>
      </div>
    </div>

    <!-- 播放器主体：展开/收起动画 -->
    <div class="player-root" ref="playerRef">
      <div
        class="player-size"
        :class="{ 'player-size--open': isOpen && !isClosing }"
      >
        <!-- 收起状态：圆形耳机图标按钮 -->
        <button
          v-if="!isOpen || isClosing"
          class="player-toggle"
          :class="{
            'player-toggle--hidden': isClosing,
            'player-toggle--visible': !isClosing,
            'is-playing': isPlaying
          }"
          @click="isOpen = true"
        >
          <!-- 播放中时耳机图标缓慢旋转 -->
          <el-icon :size="20" class="headset-icon">
            <Headset />
          </el-icon>
        </button>

        <!-- 展开状态：毛玻璃播放器面板 -->
        <div
          v-if="isOpen"
          class="player-panel"
          :class="{
            'player-panel--hidden': isClosing,
            'player-panel--visible': !isClosing
          }"
        >
          <!-- 背景：封面图模糊放大 + 半透明遮罩 -->
          <div class="player-bg">
            <div
              class="player-bg-cover"
              :style="{ backgroundImage: `url('${getSongUrl(currentSong, true)}')` }"
            ></div>
            <div class="player-bg-mask"></div>
          </div>

          <!-- 顶部：状态指示灯 + 关闭按钮 -->
          <div class="player-top">
            <div class="player-status">
              <!-- 状态灯：加载中=琥珀色脉冲，播放中=绿色发光 -->
              <span
                class="player-status-light"
                :class="{
                  'player-status-light--loading': showLoadingUI && isPlaying,
                  'player-status-light--playing': !(showLoadingUI && isPlaying)
                }"
              ></span>
              <span class="player-status-text">
                {{ showLoadingUI && isPlaying
                  ? (appStore.language === 'zh' ? '正在加载' : 'Loading...')
                  : (appStore.language === 'zh' ? '正在播放' : 'Now Playing') }}
              </span>
            </div>
            <button class="player-close" @click="handleClose">
              <el-icon :size="20"><ArrowDown /></el-icon>
            </button>
          </div>

          <!-- 歌曲信息：标题 + 艺术家 -->
          <div class="player-song">
            <h3 class="player-song-title">{{ currentSong.title }}</h3>
            <p class="player-song-artist">{{ currentSong.artist }}</p>
          </div>

          <!-- 进度条 + 音量 + 播放控制 -->
          <div class="player-controls">
            <div class="player-progress">
              <!-- 时间显示 -->
              <div class="player-time-row">
                <span class="player-time">
                  {{ formatTime(progress) }} / {{ formatTime(duration) }}
                </span>
              </div>
              <!-- 进度滑块：拖拽时暂停时间更新，松手后跳转 -->
              <div class="player-range-wrap">
                <input
                  type="range"
                  :min="0"
                  :max="duration || 100"
                  :value="progress"
                  class="music-progress-range"
                  :style="{ background: `linear-gradient(to right, rgba(255,255,255,0.9) ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(progress / (duration || 1)) * 100}%)` }"
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
                    <button class="player-volume-btn" @click="isMuted = !isMuted">
                      <el-icon :size="16"><Mute v-if="isMuted || volume === 0" /><VideoPlay v-else /></el-icon>
                    </button>
                  </template>
                </ElasticSlider>
              </div>

              <!-- 上一曲 / 播放暂停 / 下一曲 -->
              <div class="player-buttons">
                <button class="player-btn-side" @click="handlePrev">
                  <el-icon :size="20"><DArrowLeft /></el-icon>
                </button>
                <button
                  class="player-btn-play"
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
                    <el-icon :size="20">
                      <VideoPause v-if="isPlaying" />
                      <CaretRight v-else />
                    </el-icon>
                  </div>
                </button>
                <button class="player-btn-side" @click="handleNext">
                  <el-icon :size="20"><DArrowRight /></el-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- 底部：歌单链接卡片 -->
          <div class="player-playlist">
            <a
              href="https://music.163.com/playlist?id=74188173&uct2=U2FsdGVkX1+9hSmPKFKOu99/rqUgKMjig48CSYAF4Zs="
              target="_blank"
              rel="noopener noreferrer"
              class="player-playlist-link"
            >
              <div class="player-playlist-card">
                <div class="player-playlist-text">
                  <span class="player-playlist-title">
                    {{ appStore.language === 'zh' ? '品味不错？' : 'Nice taste?' }}
                  </span>
                  <span class="player-playlist-sub">
                    {{ appStore.language === 'zh' ? '我的歌单有更多好听的哦' : 'Check out my full playlist for more' }}
                  </span>
                </div>
                <div class="player-playlist-icon">
                  <el-icon class="player-playlist-icon-el"><TopRight /></el-icon>
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
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  Headset, ArrowDown, DArrowLeft, DArrowRight, CaretRight, VideoPause, TopRight
} from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { MUSIC_PLAYLIST } from '@/data/music'
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

// 播放状态变化时：执行淡入淡出
watch(isPlaying, () => {
  handleFade()
})

// 切歌时：执行淡入淡出
watch(currentSongIndex, () => {
  handleFade()
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

// 音频淡入淡出：每 50ms 调整 0.1 的音量步进
function handleFade() {
  const audio = audioRef.value
  if (!audio) return

  const targetVolume = isMuted.value ? 0 : volume.value
  const finalTarget = isPlaying.value ? targetVolume : 0

  // 淡入：先静音播放，再逐步提升音量
  if (isPlaying.value && audio.paused) {
    audio.volume = 0
    audio.play().catch(() => { isPlaying.value = false })
  }

  if (fadeInterval) { clearInterval(fadeInterval) }

  fadeInterval = setInterval(() => {
    const current = audio.volume
    const step = 0.1
    const diff = finalTarget - current

    if (Math.abs(diff) < step) {
      audio.volume = finalTarget
      if (!isPlaying.value && !audio.paused) {
        audio.pause()
      }
      if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null }
    } else {
      audio.volume = current + (diff > 0 ? step : -step)
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
  currentSongIndex.value = (currentSongIndex.value - 1 + MUSIC_PLAYLIST.length) % MUSIC_PLAYLIST.length
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
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  pointer-events: none;
}

/* 首次提示气泡 */
.player-prompt {
  pointer-events: auto;
  max-width: 220px;
  padding: 1rem;
  border: 1px solid #e4e4e7;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  .dark & {
    background: #18181b;
    border-color: #27272a;
  }
}

.player-prompt-text {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #27272a;

  .dark & {
    color: #e4e4e7;
  }
}

.player-prompt-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.player-prompt-no {
  padding: 0.375rem 0.75rem;
  border: none;
  background: none;
  font-size: 0.75rem;
  color: #71717a;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #3f3f46;
  }

  .dark & {
    color: #a1a1aa;

    &:hover {
      color: #e4e4e7;
    }
  }
}

.player-prompt-yes {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  background: #18181b;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.9;
  }

  .dark & {
    background: #ffffff;
    color: #18181b;
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
  opacity: 1;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.player-size--open {
    width: 320px;
    height: 385px;
  }
}

/* 收起状态：圆形耳机按钮 */
.player-toggle {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.4);
  color: #52525b;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.player-toggle--visible {
    transform: scale(1);
    opacity: 1;

    &:hover {
      transform: scale(1.1);
    }
  }

  &.player-toggle--hidden {
    transform: scale(0);
    opacity: 0;
  }

  .dark & {
    background: rgba(24, 24, 27, 0.4);
    border-color: rgba(63, 63, 70, 0.5);
    color: #a1a1aa;
  }
}

/* 耳机图标：播放中持续旋转，未播放时 hover 旋转 */
.headset-icon {
  .player-toggle:hover &,
  .player-toggle.is-playing & {
    animation: spin-slow 8s linear infinite;
  }
}

/* 展开状态：毛玻璃面板 */
.player-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: 1.25rem;
  border-radius: 1.5rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.1);
  -webkit-backdrop-filter: blur(64px);
  backdrop-filter: blur(64px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transform-origin: bottom right;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.player-panel--visible {
    transform: scale(1) translate(0, 0);
    border-radius: 1.5rem;
    opacity: 1;
  }

  &.player-panel--hidden {
    transform: scale(0.15) translate(0.5rem, 0.5rem);
    border-radius: 100px;
    opacity: 0;
  }
}

/* 面板背景层 */
.player-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.player-bg-cover {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.1);
  filter: blur(2px);
  transition: all 1s;
}

.player-bg-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

/* 顶部状态栏 */
.player-top {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-status-light {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  &.player-status-light--loading {
    background: #fbbf24;
  }

  &.player-status-light--playing {
    background: #4ade80;
    box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  }
}

.player-status-text {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.player-close {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.3s;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  &:hover {
    color: #ffffff;
  }
}

/* 歌曲信息 */
.player-song {
  position: relative;
  z-index: 10;
  margin-bottom: 1.5rem;
}

.player-song-title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.player-song-artist {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 控制区 */
.player-controls {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.player-progress {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.player-time-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 0.125rem;
}

.player-time {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.player-range-wrap {
  width: 100%;
}

/* 进度条滑块 */
.music-progress-range {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 0.375rem;
  border-radius: 9999px;
  -webkit-appearance: none;
  appearance: none;
  background: #e4e4e7;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  .dark & {
    background: #27272a;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #ffffff;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #ffffff;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }

  &:hover::-webkit-slider-thumb {
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
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
}

.player-volume-btn {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #ffffff;
  }
}

.player-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.player-btn-side {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: color 0.3s, transform 0.3s;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  &:hover {
    color: #ffffff;
    transform: scale(1.1);
  }
}

.player-btn-play {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
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
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 9999px;
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

/* 歌单链接卡片 */
.player-playlist {
  position: relative;
  z-index: 10;
}

.player-playlist-link {
  display: block;
  width: 100%;
}

.player-playlist-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.1);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.02);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  }
}

.player-playlist-text {
  display: flex;
  flex-direction: column;
}

.player-playlist-title {
  margin-bottom: 0.125rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.player-playlist-sub {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.3s;

  .player-playlist-card:hover & {
    color: rgba(255, 255, 255, 0.9);
  }
}

.player-playlist-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  transition: background-color 0.3s;

  .player-playlist-card:hover & {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* 耳机图标慢速旋转动画（播放中） */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
