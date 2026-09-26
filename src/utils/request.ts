// Axios 请求封装：统一 baseURL、超时设置、请求拦截器（注入 JWT）、
// 响应拦截器（拆出业务数据 + 401 统一登出跳转）。
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 后台 token 在 localStorage 中的键名（与用户态 store 保持一致）
export const TOKEN_KEY = 'admin_token'

const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API || '/api',
  timeout: 10000
})

// 请求拦截器：若存在 token，则附带 Authorization: Bearer <token>
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 标记是否正在处理 401，避免并发请求反复跳转
let isRedirecting = false

service.interceptors.response.use(
  (response) => {
    // 后端统一响应体：{ code, msg, data }
    const res = response.data
    if (res.code !== undefined && res.code !== 200) {
      if (res.code === 401) {
        handleUnauthorized()
        return Promise.reject(new Error(res.msg || '未登录或登录已失效'))
      }
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    // 直接返回业务数据，业务层无需再取 .data
    return res.data
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      handleUnauthorized()
    } else {
      ElMessage.error(error?.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

// 401 处理：清除 token 并跳转登录页（避免死循环）
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

// 原始请求实例：响应拦截器返回完整的 { code, msg, data }（不做 data 剥离）。
// 用于登录等需要读取 msg 字段（后端偶将令牌置于 msg）的场景。
export const requestRaw = axios.create({
  baseURL: import.meta.env.VITE_BASE_API || '/api',
  timeout: 10000
})

requestRaw.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

requestRaw.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== undefined && res.code !== 200) {
      if (res.code === 401) handleUnauthorized()
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    // 返回完整响应体，由调用方自行取 data / msg
    return res
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401) handleUnauthorized()
    else ElMessage.error(error?.message || '网络错误')
    return Promise.reject(error)
  }
)

export default service
