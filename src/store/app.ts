// 全局状态管理：语言、主题（深色/浅色自动切换）、当前页签
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Language } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 当前语言，默认中文
  const language = ref<Language>('zh')

  // 切换语言（中文 ↔ 英文）
  function toggleLanguage() {
    language.value = language.value === 'zh' ? 'en' : 'zh'
    applyLanguage()
  }

  // 将语言应用到 DOM（设置 lang 属性）并持久化到 localStorage
  function applyLanguage() {
    document.documentElement.setAttribute('lang', language.value)
    localStorage.setItem('language', language.value)
  }

  // 初始化语言：优先读取 localStorage 中的用户选择
  function initLanguage() {
    const saved = localStorage.getItem('language')
    if (saved === 'zh' || saved === 'en') {
      language.value = saved
    }
    applyLanguage()
  }
  // 当前主题，默认浅色
  const theme = ref<'light' | 'dark'>('light')
  // 当前激活的页签，用于导航栏高亮
  const activeTab = ref('dashboard')

  // 计算属性：是否为深色模式
  const isDark = computed(() => theme.value === 'dark')

  // 切换主题（浅色 ↔ 深色）
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme()
  }

  // 将主题应用到 DOM（切换 dark 类）并持久化到 localStorage
  function applyTheme() {
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme.value)
  }

  // 根据当前时间自动初始化主题：18:30 ~ 06:00 为深色模式
  function initTheme() {
    const now = new Date()
    const hour = now.getHours()
    const minutes = now.getMinutes()
    const current = hour * 60 + minutes
    const darkStart = 18 * 60 + 30 // 18:30
    const darkEnd = 6 * 60 // 06:00
    const isDarkTime = current >= darkStart || current < darkEnd
    theme.value = isDarkTime ? 'dark' : 'light'
    applyTheme()
  }

  // 设置当前激活的页签
  function setActiveTab(tab: string) {
    activeTab.value = tab
  }

  return {
    language,
    theme,
    activeTab,
    isDark,
    toggleLanguage,
    initLanguage,
    toggleTheme,
    initTheme,
    setActiveTab
  }
})
