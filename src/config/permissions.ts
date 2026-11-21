// 权限标识常量：后端 sys_permission 表中的权限串，前端按字符串比对。
// 命名约定：业务内容资源用 blog:{resource}:edit，系统管理资源用 system:{resource}:edit。
// 维护注意：blog:upload:edit 不在后端种子数据内（种子只按业务表生成权限），
//   需在 sys_permission 手工插入该权限，否则图片上传请求必然 403。
// 被谁引用：src/composables/useImageUpload.ts、src/composables/useMarkdownUpload.ts（上传权限判断）、
//   src/store/user.ts（资源编辑权限判断）、views/admin/system 三个页面（系统资源编辑权限）。

/** 图片上传权限（需后端手工插入） */
export const PERM_UPLOAD = 'blog:upload:edit'

/**
 * 生成业务资源的编辑权限串，后端约定为 blog:{resource}:edit。
 * @param resource 资源名，如 project / article / nav
 */
export function blogEditPerm(resource: string): string {
  return `blog:${resource}:edit`
}

/**
 * 生成系统管理资源的编辑权限串，后端约定为 system:{resource}:edit。
 * @param resource 资源名，如 user / role / menu
 */
export function systemEditPerm(resource: string): string {
  return `system:${resource}:edit`
}
