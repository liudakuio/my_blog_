// 接口层统一出口（可选入口）
// 分层说明：
//   公开接口（前台）—— types / site / project / article
//   后台通用 CRUD —— admin（资源白名单见该文件头注释，出入参为下划线列名）
//   后台专用接口 —— adminResource + adminTypes（4 个资源，出入参为驼峰字段）
//   第三方接口 —— dailyEnglish（独立 axios 实例，不受本项目拦截器影响）
//   路径常量 —— paths（后台资源路径的单一出处）
// 使用约定：本文件提供统一入口，便于「整包引入」；
//   但同一模块内部也可按需深路径 import（如 '@/api/admin'、 '@/api/system'），
//   两种写法并存是有意为之：接口模块之间存在职责区分，深路径 import 更能体现依赖来源。
// 维护注意：新增接口模块后，建议在此登记，保证从根入口也能访问到。
export * from './types'
export * from './paths'
export * from './site'
export * from './project'
export * from './article'
export * from './auth'
export * from './admin'
export * from './adminTypes'
export * from './adminResource'
export * from './system'
export * from './dailyEnglish'
