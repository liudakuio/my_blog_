<!--
  技术栈跑马灯：无限横向滚动的关键词条，用作首页模块之间的视觉分隔。
  实现：内容渲染两份，父容器 translateX(-50%) 循环，无缝衔接。
  无障碍：滚动内容对屏幕阅读器隐藏，另附一份 sr-only 的静态列表。
-->
<template>
  <div class="ticker" role="region" :aria-label="appStore.language === 'zh' ? '技术栈' : 'Tech stack'">
    <ul class="sr-only">
      <li v-for="item in items" :key="'sr-' + item">{{ item }}</li>
    </ul>

    <div class="ticker-track" aria-hidden="true">
      <span v-for="(item, i) in loopItems" :key="i" class="ticker-item">
        {{ item }}
        <span class="ticker-sep">◆</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

const ITEMS = [
  'VUE 3', 'TYPESCRIPT', 'ELEMENT PLUS', 'VITE', 'PINIA', 'NODE.JS',
  'MYSQL', 'EXPRESS', 'STM32', 'C / RTOS', 'FIGMA', 'TAILWIND',
  'GIT', 'DOCKER', 'PYTHON', 'REST API'
]

const items = computed(() => ITEMS)
// 两份内容拼接，配合 translateX(-50%) 实现无缝循环
const loopItems = computed(() => [...ITEMS, ...ITEMS])
</script>

<style lang="less" scoped>
.ticker {
  position: relative;
  width: 100%;
  padding: 0.875rem 0;
  margin: 0 0 5rem;
  overflow: hidden;
  border-top: 2px solid var(--ink);
  border-bottom: 2px solid var(--ink);
  background: var(--bg);

  @media (min-width: 1024px) {
    margin-bottom: 7rem;
  }
}

.ticker-track {
  display: flex;
  align-items: center;
  width: max-content;
  animation: marquee 38s linear infinite;

  &:hover {
    animation-play-state: paused;
  }
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 1.75rem;
  padding-right: 1.75rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--fg);

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
}

/* 菱形分隔符，奇数项用强调色制造节奏 */
.ticker-sep {
  color: var(--accent);
  font-size: 0.625rem;
  letter-spacing: 0;
}

/* 屏幕阅读器专用：隐藏但可读 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
