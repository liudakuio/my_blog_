// 作品数据：作品列表、作品分类、作品详情（含图集）
// 被谁引用：components/PortfolioGrid.vue（首页精选与作品页共用同一份 store 数据）。
// 两条数据来源（勿混）：
//   1) 作品页 /portfolio：loadProjects() -> /api/projects
//   2) 首页「精选作品」：前端写死的 FEATURED_PROJECTS，不调用 loadProjects
// 分类字典无论哪条来源都走 loadCategories() -> /api/project-categories。
// 图集策略：列表接口不返回图集内容，点开详情时按 galleryCount 用 fetchDetail 补拉。
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getProjectList, getProjectDetail, getProjectCategories } from '@/api'
import type { CategoryVo, ProjectVo } from '@/api/types'
import type { Project } from '@/types'

/** 将后端 ProjectVo 归一化为前端使用的 Project 结构 */
function normalize(vo: ProjectVo): Project {
  const zh = vo.zh ?? {}
  const en = vo.en ?? {}
  return {
    id: vo.id,
    common: {
      category: vo.category ?? '',
      image: vo.cover ?? '',
      videoUrl: vo.videoUrl || undefined,
      bilibiliId: vo.bilibiliId || undefined,
      figmaUrl: vo.figmaUrl || undefined,
      websiteUrl: vo.websiteUrl || undefined,
      githubUrl: vo.githubUrl || undefined,
      icon: vo.icon || undefined,
      gallery: vo.gallery,
      galleryCount: vo.galleryCount ?? 0
    },
    zh: {
      title: vo.zh ? (zh.title ?? '') : (vo.title ?? ''),
      subtitle: vo.zh ? (zh.subtitle ?? '') : (vo.subtitle ?? ''),
      description: vo.zh ? (zh.description ?? '') : (vo.description ?? ''),
      role: vo.zh ? (zh.role ?? '') : (vo.role ?? ''),
      tags: vo.zh ? (zh.tags ?? []) : (vo.tags ?? []),
      awards: vo.zh ? (zh.awards ?? []) : (vo.awards ?? []),
      concept: vo.zh ? (zh.concept ?? '') : (vo.concept ?? ''),
      roleDetail: vo.zh ? (zh.roleDetail ?? '') : (vo.roleDetail ?? '')
    },
    en: {
      title: vo.en ? (en.title ?? '') : (vo.title ?? ''),
      subtitle: vo.en ? (en.subtitle ?? '') : (vo.subtitle ?? ''),
      description: vo.en ? (en.description ?? '') : (vo.description ?? ''),
      role: vo.en ? (en.role ?? '') : (vo.role ?? ''),
      tags: vo.en ? (en.tags ?? []) : (vo.tags ?? []),
      awards: vo.en ? (en.awards ?? []) : (vo.awards ?? []),
      concept: vo.en ? (en.concept ?? '') : (vo.concept ?? ''),
      roleDetail: vo.en ? (en.roleDetail ?? '') : (vo.roleDetail ?? '')
    }
  }
}

export const usePortfolioStore = defineStore('portfolio', () => {
  const projects = ref<Project[]>([])
  const categories = ref<CategoryVo[]>([])
  const loading = ref(false)
  const categoriesLoading = ref(false)
  const loaded = ref(false)

  async function loadProjects(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const list = await getProjectList()
      projects.value = (list ?? []).map(normalize)
      loaded.value = true
    } catch {
      projects.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadCategories(force = false) {
    if (categories.value.length && !force) return
    categoriesLoading.value = true
    try {
      categories.value = (await getProjectCategories()) ?? []
    } catch {
      categories.value = []
    } finally {
      categoriesLoading.value = false
    }
  }

  /** 拉取作品详情（图集），并回填到列表对应项 */
  async function fetchDetail(id: string): Promise<Project | null> {
    try {
      const vo = await getProjectDetail(id)
      const project = normalize(vo)
      const index = projects.value.findIndex(item => item.id === id)
      if (index >= 0) projects.value[index] = project
      return project
    } catch {
      return null
    }
  }

  return {
    projects,
    categories,
    loading,
    categoriesLoading,
    loaded,
    loadProjects,
    loadCategories,
    fetchDetail
  }
})
