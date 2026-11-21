// 后台列表的本地过滤工具。
// 背景：文章分类 / 作品分类两个页面的查询条件里，只有 status 是后端支持的筛选列，
//   分类值与中文名需在前端做模糊匹配；两处此前各写了一份几乎相同的 matchLocalFilter，
//   现收敛到本文件，避免规则漂移。
// 被谁引用：src/views/admin/content/articleCategory/index.vue、
//   src/views/admin/content/projectCategory/index.vue。

/**
 * 创建「多字段模糊匹配」过滤器。
 * @param fields 参与匹配的字段名；任一字段不命中即过滤掉该行
 * @returns 过滤器函数：入参为行数据与查询条件，返回该行是否保留
 */
export function createLocalFilter<T>(fields: string[]) {
  return (row: T, query: Record<string, string>): boolean => {
    for (const field of fields) {
      const keyword = (query[field] ?? '').trim()
      if (keyword && !String((row as Record<string, unknown>)[field] ?? '').includes(keyword)) {
        return false
      }
    }
    return true
  }
}
