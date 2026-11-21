// 后台接口路径的单一出处：集中拼接 /api/admin/{resource}[/{id}]。
// 背景：此前 admin.ts 与 adminResource.ts 各自拼接前缀，路径字面量分散在两个文件里，
//   改前缀时极易漏改；收敛到本文件后，代码中不再出现 '/api/admin/' 字面量。
// 被谁引用：src/api/admin.ts（通用 CRUD）、src/api/adminResource.ts（走专用接口的 CRUD）。
// 命名约定：resource 为后端资源名（nav / article / project ...），id 为该资源的主键值。
// 维护注意：后端通用 CRUD 只接受 TableRegistry 白名单内的资源
//   （nav、project_category、project、article_category、article、article_i18n），
//   未注册的资源一律返回 400「未知资源」，不要往这里塞新资源。

/** 后台通用 / 专用接口的统一路径前缀（模块私有，统一由 adminPath 使用） */
const ADMIN_API_PREFIX = '/api/admin/'

/** 后台图片上传接口路径（不属于 TableRegistry 资源，单独定义） */
export const ADMIN_UPLOAD_IMAGE_PATH = ADMIN_API_PREFIX + 'upload/image'

/**
 * 拼接后台资源路径。
 * @param resource 资源名（后端 TableRegistry 注册名）
 * @param id 主键值；不传 / 为空时只返回资源路径，否则追加经 URL 编码的 id
 * @returns 形如 '/api/admin/article' 或 '/api/admin/article/12' 的路径
 */
export function adminPath(resource: string, id?: string | number): string {
  const base = ADMIN_API_PREFIX + resource
  return id === undefined || id === null || id === ''
    ? base
    : base + '/' + encodeURIComponent(String(id))
}
