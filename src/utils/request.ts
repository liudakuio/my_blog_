// Axios 请求封装：统一 baseURL、超时设置、请求拦截器（注入 JWT）、
// 响应拦截器（拆出业务数据 + 401 统一登出跳转）。
// 调用约定：
//   service 的返回值已是业务 data（拦截器剥掉了 { code, msg, data } 外壳），业务层不要再取 .data；
//   需要读 msg 的场景（如登录取令牌）改用 requestRaw，它返回完整响应体。
// 结构说明：此前 service 与 requestRaw 各自写了一份请求 / 响应拦截器（37 行重复），
//   现统一为 createHttpInstance 工厂，两个实例只在「是否剥离 data 外壳」与
//   「业务码 401 的兜底提示文案」两点上不同。
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 后台 token 在 localStorage 中的键名（与用户态 store 保持一致）
export const TOKEN_KEY = 'admin_token'

// 标记是否正在处理 401，避免并发请求反复跳转（两个实例共享此标记）
let isRedirecting = false

/** 401 处理：清除 token 并跳转登录页（避免死循环） */
function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY)
  if (isRedirecting) return
  isRedirecting = true
  if (!window.location.pathname.startsWith('/admin/login')) {
    window.location.href = '/admin/login'
  } else {
    isRedirecting = false
  }
}

/** axios 实例的行为开关 */
interface HttpInstanceOptions {
  /** 是否剥离 { code, msg, data } 外壳：true 只返回 data，false 返回完整响应体 */
  unwrap: boolean
  /** 业务码 401（而非 HTTP 401）时的兜底提示文案 */
  unauthorizedText: string
}

/**
 * 创建带统一拦截器的 axios 实例。
 * 请求拦截器：存在 token 时附带 Authorization: Bearer <token>。
 * 响应拦截器：后端统一响应体 { code, msg, data }，code 非 200 时弹提示并 reject。
 */
function createHttpInstance(options: HttpInstanceOptions) {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_BASE_API || '/api',
    timeout: 10000
  })

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => {
      const res = response.data
      if (res.code !== undefined && res.code !== 200) {
        if (res.code === 401) {
          handleUnauthorized()
          ElMessage.error(res.msg || options.unauthorizedText)
          return Promise.reject(new Error(res.msg || options.unauthorizedText))
        }
        ElMessage.error(res.msg || '请求失败')
        return Promise.reject(new Error(res.msg || '请求失败'))
      }
      // unwrap=true 只返回业务数据；unwrap=false 返回完整响应体，由调用方自行取 data / msg
      return options.unwrap ? res.data : res
    },
    (error) => {
      const status = error?.response?.status
      const msg = error?.response?.data?.msg
      if (status === 401) {
        handleUnauthorized()
      }
      // 401（含登录失败）也要把后端的 msg 提示出来；非 401 走网络错误兜底
      ElMessage.error(msg || error?.message || '网络错误')
      return Promise.reject(error)
    }
  )

  return instance
}

/** 业务实例：响应拦截器已剥出 data，业务层直接使用返回值 */
const service = createHttpInstance({
  unwrap: true,
  unauthorizedText: '未登录或登录已失效'
})

/**
 * 原始请求实例：响应拦截器返回完整的 { code, msg, data }（不做 data 剥离）。
 * 用于登录等需要读取 msg 字段（后端偶将令牌置于 msg）的场景。
 */
export const requestRaw = createHttpInstance({
  unwrap: false,
  unauthorizedText: '请求失败'
})

export default service
