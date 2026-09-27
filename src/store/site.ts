// 站点全局数据：配置（导航/页脚/首页/内页文案/联系信息）
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSiteConfig } from '@/api'
import type { SiteConfigVo } from '@/api/types'
import { pickText } from '@/utils/i18n'
import type { Language } from '@/types'

export const useSiteStore = defineStore('site', () => {
  const config = ref<SiteConfigVo | null>(null)
  const configLoading = ref(false)
  const configLoaded = ref(false)

  const nav = computed(() => config.value?.nav ?? [])
  const footer = computed(() => config.value?.footer ?? null)
  const home = computed(() => config.value?.home ?? null)
  const pages = computed(() => config.value?.pages ?? null)
  const contact = computed(() => config.value?.contact ?? null)
  const musicPlaylistLink = computed(() => config.value?.musicPlaylistLink ?? null)

  /** 加载站点配置，失败时保持 null（各页面按空态渲染） */
  async function loadConfig(force = false) {
    if (configLoaded.value && !force) return
    configLoading.value = true
    try {
      config.value = await getSiteConfig('all')
      configLoaded.value = true
    } catch {
      // 错误提示由请求拦截器统一处理
    } finally {
      configLoading.value = false
    }
  }

  /** 取导航菜单（已按当前语言解析文案、按 sort 排序） */
  function navItems(lang: Language) {
    return [...nav.value]
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map(item => ({ id: item.id, label: pickText(item.label, lang, item.id) }))
  }

  return {
    config,
    configLoading,
    configLoaded,
    nav,
    footer,
    home,
    pages,
    contact,
    musicPlaylistLink,
    loadConfig,
    navItems
  }
})
