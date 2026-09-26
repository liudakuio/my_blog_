// Axios 请求封装：统一 baseURL、超时设置、响应拦截器（错误提示 + 拆出业务数据）
import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API || '/api',
  timeout: 10000
})

service.interceptors.response.use(
  (response) => {
    // 后端统一响应体：{ code, msg, data }
    const res = response.data
    if (res.code !== undefined && res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    // 直接返回业务数据，业务层无需再取 .data
    return res.data
  },
  (error) => {
    ElMessage.error(error?.message || '网络错误')
    return Promise.reject(error)
  }
)

export default service
