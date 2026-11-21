// 作品数据：作品列表、作品分类、作品详情（含图集）
// 被谁引用：components/PortfolioGrid.vue（首页与作品页共用同一份 store 数据）。
// 数据来源：统一走接口 /api/projects，由 query.category 决定筛选哪一个分类，
// 筛选在后端完成（列表只含该分类），前端不再本地过滤；切换分类用 setCategory()，
// 它会带 force 重新请求（每次切换都请求，不做缓存）。
// 分类字典独立：无论列表怎么查，分类栏始终走 loadCategories() -> /api/project-categories。
// 图集策略：列表接口不返回图集内容，点开详情时按 galleryCount 用 fetchDetail 补拉。
// 依赖后端：/api/projects 需支持 category 查询参数（不传则视为全部）。
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getProjectList, getProjectDetail, getProjectCategories,getProjectGallery } from '@/api'
import type { CategoryVo, ProjectVo } from '@/api/types'
import type { Project } from '@/types'
import { pickField, pickFieldList } from '@/utils/i18n'

/**
 * 将后端 ProjectVo 归一化为前端使用的 Project 结构。
 * 多语取值：lang=all 时后端把文案收在 vo.zh / vo.en 里（字段平铺），
 *   lang=zh|en 时则直接平铺在对象上（vo.title / vo.subtitle ...），
 *   故两套字段都要能取到值——这正是 utils/i18n.ts 的 pickField / pickFieldList 存在的原因。
 */
function normalize(vo: ProjectVo): Project {
  const zh = vo.zh
  const en = vo.en
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
      title: zh ? pickField(zh, 'title') : (vo.title ?? ''),
      subtitle: zh ? pickField(zh, 'subtitle') : (vo.subtitle ?? ''),
      description: zh ? pickField(zh, 'description') : (vo.description ?? ''),
      role: zh ? pickField(zh, 'role') : (vo.role ?? ''),
      tags: zh ? pickFieldList(zh, 'tags') : (vo.tags ?? []),
      awards: zh ? pickFieldList(zh, 'awards') : (vo.awards ?? []),
      concept: zh ? pickField(zh, 'concept') : (vo.concept ?? ''),
      roleDetail: zh ? pickField(zh, 'roleDetail') : (vo.roleDetail ?? '')
    },
    en: {
      title: en ? pickField(en, 'title') : (vo.title ?? ''),
      subtitle: en ? pickField(en, 'subtitle') : (vo.subtitle ?? ''),
      description: en ? pickField(en, 'description') : (vo.description ?? ''),
      role: en ? pickField(en, 'role') : (vo.role ?? ''),
      tags: en ? pickFieldList(en, 'tags') : (vo.tags ?? []),
      awards: en ? pickFieldList(en, 'awards') : (vo.awards ?? []),
      concept: en ? pickField(en, 'concept') : (vo.concept ?? ''),
      roleDetail: en ? pickField(en, 'roleDetail') : (vo.roleDetail ?? '')
    }
  }
}

export const usePortfolioStore = defineStore('portfolio', () => {
  const projects = ref<Project[]>([])
  const categories = ref<CategoryVo[]>([])
  const loading = ref(false)
  const categoriesLoading = ref(false)
  const loaded = ref(false)

  /**
   * 当前查询条件（分类由后端筛选）。
   * category 为空串 / undefined 表示「全部」，请求时不带 category 参数。
   */
  const query = ref<{ category?: string }>({})

  /**
   * 拉取作品列表：按 query.category 向后端筛选，列表只含该分类数据。
   * @param force 是否强制请求。loaded 为去重标记，切换分类必须传 true，
   *              否则第二次调用会被直接跳过、列表不刷新。
   * 失败兜底：列表置空（错误提示由请求拦截器统一弹出）。
   * @returns 归一化后的作品数组（按后端返回顺序，不做额外分组或排序）
   */
  async function loadProjects(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const list = await getProjectList({ category: query.value.category || undefined })
      projects.value = (list ?? []).map(normalize)
      loaded.value = true
    } catch {
      projects.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换作品分类：更新查询条件后重新请求（每次切换都请求，不做缓存）。
   * @param category 分类值，取值来自 /api/project-categories 的 value；'All' 表示全部。
   */
  function setCategory(category: string) {
    query.value.category = category === 'All' ? '' : category
    return loadProjects(true)
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

  /** 按标题拉取图集：同标题多行记录的 cover 即为图片列表 */
async function fetchGalleryByTitle(title: string): Promise<string[]> {
  if (!title) return []
  try {
    const list = await getProjectGallery(title)
    return (list ?? []).map(vo => vo.cover).filter(Boolean) as string[]
  } catch {
    return []
  }
}


  return {
    projects,
    categories,
    loading,
    categoriesLoading,
    loaded,
    query,
    loadProjects,
    loadCategories,
    setCategory,
    fetchDetail,
    fetchGalleryByTitle
  }
})
