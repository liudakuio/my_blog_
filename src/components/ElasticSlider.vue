<!-- 弹性滑块组件：支持步进模式和连续模式，用于音乐播放器音量控制 -->
<template>
  <div class="slider">
    <!-- 左侧图标插槽（如静音/取消静音按钮） -->
    <div v-if="$slots.leftIcon" class="slider-icon-left">
      <slot name="leftIcon" />
    </div>

    <!-- 滑块主体区域 -->
    <div
      ref="sliderRef"
      class="slider-track"
      @mousedown="handleMouseDown"
      @touchstart.prevent="handleTouchStart"
    >
      <div class="slider-track-inner">
        <!-- 轨道背景：hover 时纵向放大 -->
        <div class="slider-rail">
          <!-- 已填充部分：通过 scaleX 控制宽度 -->
          <div
            class="slider-fill"
            :class="{ 'slider-fill--transition': !isDragging }"
            :style="{ transform: `scaleX(${percentage / 100})` }"
          />
        </div>

        <!-- 滑块手柄：拖拽时放大 1.5 倍，内部圆点缩小 -->
        <div
          class="slider-handle"
          :style="{
            left: `${percentage}%`,
            transform: `translate3d(-50%, 0, 0) scale(${isDragging ? 1.5 : 1})`
          }"
        >
          <div
            class="slider-handle-dot"
            :class="isDragging ? 'slider-handle-dot--small' : 'slider-handle-dot--full'"
          />
        </div>
      </div>
    </div>

    <!-- 右侧图标插槽 -->
    <div v-if="$slots.rightIcon" class="slider-icon-right">
      <slot name="rightIcon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  maxValue?: number
  // 是否启用步进模式（如音量每步 10）
  isStepped?: boolean
  stepSize?: number
}>(), {
  modelValue: 50,
  maxValue: 100,
  isStepped: false,
  stepSize: 1
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()

const sliderRef = ref<HTMLElement | null>(null)
// 是否正在拖拽
const isDragging = ref(false)

// 当前值对应的百分比（0~100）
const percentage = computed(() => Math.min(100, Math.max(0, (props.modelValue / props.maxValue) * 100)))

// 根据鼠标/触摸位置计算新值
function handleInteraction(clientX: number) {
  if (!sliderRef.value) return
  const rect = sliderRef.value.getBoundingClientRect()
  const x = Math.min(Math.max(0, clientX - rect.left), rect.width)
  let newValue = (x / rect.width) * props.maxValue

  // 步进模式：对齐到最近的步进值
  if (props.isStepped && props.stepSize) {
    newValue = Math.round(newValue / props.stepSize) * props.stepSize
  }

  newValue = Math.min(Math.max(0, newValue), props.maxValue)

  emit('update:modelValue', newValue)
  emit('change', newValue)
}

// 鼠标拖拽：mousedown → mousemove → mouseup
function handleMouseDown(e: MouseEvent) {
  isDragging.value = true
  handleInteraction(e.clientX)

  const handleMouseMove = (ev: MouseEvent) => handleInteraction(ev.clientX)
  const handleUp = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleUp)
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleUp)

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleUp)
  })
}

// 触摸拖拽：touchstart → touchmove → touchend
function handleTouchStart(e: TouchEvent) {
  isDragging.value = true
  handleInteraction(e.touches[0].clientX)

  const handleTouchMove = (ev: TouchEvent) => {
    if (ev.cancelable) ev.preventDefault()
    handleInteraction(ev.touches[0].clientX)
  }
  const handleUp = () => {
    isDragging.value = false
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleUp)
  }

  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleUp)

  onUnmounted(() => {
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleUp)
  })
}
</script>

<style lang="less" scoped>
.slider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  user-select: none;
  touch-action: none;
}

.slider-icon-left,
.slider-icon-right {
  flex-shrink: 0;
  color: #71717a;

  .dark & {
    color: #a1a1aa;
  }
}

.slider-track {
  position: relative;
  flex: 1;
  height: 3rem;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.slider-track-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.slider-rail {
  position: absolute;
  width: 100%;
  height: 0.5rem;
  background: #e4e4e7;
  border-radius: 9999px;
  overflow: hidden;
  transition: transform 0.3s ease-out;
  will-change: transform;

  .dark & {
    background: #27272a;
  }

  .slider-track:hover & {
    transform: scaleY(1.5);
  }
}

.slider-fill {
  width: 100%;
  height: 100%;
  background: #000000;
  border-radius: 9999px;
  transform-origin: left center;
  will-change: transform;

  .dark & {
    background: #ffffff;
  }

  &.slider-fill--transition {
    transition: transform 0.2s ease-out;
  }
}

.slider-handle {
  position: absolute;
  left: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 9999px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  will-change: transform;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  .dark & {
    background: #e4e4e7;
    border-color: #3f3f46;
  }
}

.slider-handle-dot {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #000000;
  transition: all 0.3s;

  .dark & {
    background: #18181b;
  }

  &.slider-handle-dot--small {
    transform: scale(0.5);
  }

  &.slider-handle-dot--full {
    transform: scale(1);
  }
}
</style>
