// 站点全局数据：导航菜单（/api/site/config 目前仅返回 nav；
// 首页/联系/页脚/内页标题等文案已回退为 src/data 下的本地数据）
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
    loadConfig,
    navItems
  }
})
