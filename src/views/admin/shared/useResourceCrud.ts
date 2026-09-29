// 后台管理页通用 CRUD 逻辑（若依风格独立页面复用）。
// 自动按 isDedicatedResource 选择专用接口（驼峰 VO）或通用接口（下划线）。
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import { adminList, adminGet, adminCreate, adminUpdate, adminDelete } from '@/api/admin'
import {
  isDedicatedResource,
  adminResourceList,
  adminResourceGet,
  adminResourceCreate,
  adminResourceUpdate,
  adminResourceDelete
} from '@/api/adminResource'

export interface UseResourceCrudOptions {
  /** 资源名，如 project / project_i18n */
  resource: string
  /** 页面标题，用于弹窗标题 */
  title: string
  /** 表单字段与新增默认值（key 决定提交字段集合） */
  defaultForm: Record<string, any>
  /** 筛选字段初始值 */
  defaultFilters?: Record<string, any>
  /** 主键字段，默认 id */
  idKey?: string
  /** 权限标识，默认 blog:{resource}:edit（系统管理页传 system:user:edit） */
  perm?: string
  /** 自定义接口适配器（系统管理页使用），缺省走 admin / adminResource 接口 */
  api?: ResourceApi
  /** 查询时附加的固定参数（如菜单页的 tree 开关） */
  extraParams?: () => Record<string, any>
  /** 弹窗打开后回调（如角色页回填菜单树勾选） */
  afterOpen?: (ctx: { isEdit: boolean; row: any; detail: any }) => void | Promise<void>
  /** 提交前钩子，可改写 payload（如角色页追加 menuIds） */
  beforeSubmit?: (payload: Record<string, any>) => Record<string, any> | void
}

/** CRUD 接口适配器 */
export interface ResourceApi {
  list: (params?: Record<string, any>) => Promise<any>
  get: (id: string | number) => Promise<any>
  create: (body: Record<string, any>) => Promise<any>
  update: (id: string | number, body: Record<string, any>) => Promise<any>
  remove: (id: string | number) => Promise<any>
}

export function useResourceCrud(options: UseResourceCrudOptions) {
  const { resource, title, defaultForm, defaultFilters = {}, idKey = 'id' } = options
  const userStore = useUserStore()

  // 缺省接口：专用资源走驼峰 VO，其余走通用 CRUD
  const api: ResourceApi = options.api ?? {
    list: (params) =>
      isDedicatedResource(resource)
        ? adminResourceList(resource, params)
        : adminList(resource, params),
    get: (id) => (isDedicatedResource(resource) ? adminResourceGet(resource, id) : adminGet(resource, id)),
    create: (body) =>
      isDedicatedResource(resource) ? adminResourceCreate(resource, body) : adminCreate(resource, body),
    update: (id, body) =>
      isDedicatedResource(resource)
        ? adminResourceUpdate(resource, id, body)
        : adminUpdate(resource, id, body),
    remove: (id) =>
      isDedicatedResource(resource) ? adminResourceDelete(resource, id) : adminDelete(resource, id)
  }

  const list = ref<any[]>([])
  const loading = ref(false)
  const filters = reactive<Record<string, any>>({ ...defaultFilters })
  const selection = ref<any[]>([])

  const editable = computed(() => userStore.hasPerm(options.perm ?? `blog:${resource}:edit`))
  const total = computed(() => list.value.length)

  const dialogVisible = ref(false)
  const isEdit = ref(false)
  const saving = ref(false)
  const formRef = ref<any>(null)
  const editingId = ref<string | number | null>(null)
  const formData = reactive<Record<string, any>>({ ...defaultForm })

  const dialogTitle = computed(() => `${isEdit.value ? '修改' : '添加'}${title}`)

  /** 取当前主键值（删除 / 批量删除用） */
  function idOf(row: any) {
    return row?.[idKey]
  }

  function buildParams() {
    const params: Record<string, any> = {}
    Object.keys(filters).forEach((k) => {
      const v = filters[k]
      if (v !== undefined && v !== null && v !== '') params[k] = v
    })
    return { ...params, ...(options.extraParams?.() ?? {}) }
  }

  /** 查询列表（后端全量返回，按字段等值筛选） */
  async function query() {
    loading.value = true
    try {
      const data: any = await api.list(buildParams())
      list.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('[admin] 列表加载失败', resource, e)
      list.value = []
    } finally {
      loading.value = false
    }
  }

  /** 重置筛选并重新查询 */
  function resetQuery() {
    Object.keys(filters).forEach((k) => {
      filters[k] = ''
    })
    query()
  }

  function fillForm(source: Record<string, any>) {
    Object.keys(defaultForm).forEach((k) => {
      formData[k] = source?.[k] ?? defaultForm[k]
    })
  }

  async function openAdd() {
    editingId.value = null
    isEdit.value = false
    fillForm(defaultForm)
    dialogVisible.value = true
    await options.afterOpen?.({ isEdit: false, row: null, detail: null })
  }

  /** 打开编辑：优先用详情接口（子表/大字段更完整），失败则用行数据兜底 */
  async function openEdit(row: any) {
    const pk = idOf(row)
    editingId.value = pk
    isEdit.value = true
    fillForm(row)
    let detail: any = null
    try {
      detail = await api.get(pk)
      if (detail) fillForm(detail)
    } catch (e) {
      console.error('[admin] 详情加载失败，使用行数据兜底', resource, e)
    }
    dialogVisible.value = true
    await options.afterOpen?.({ isEdit: true, row, detail })
  }

  /** 提交新增 / 修改 */
  async function submit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    saving.value = true
    try {
      const payload: Record<string, any> = {}
      Object.keys(defaultForm).forEach((k) => {
        payload[k] = formData[k]
      })
      const patched = options.beforeSubmit?.(payload)
      if (editingId.value !== null) {
        await api.update(editingId.value, patched ?? payload)
        ElMessage.success('修改成功')
      } else {
        await api.create(patched ?? payload)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      query()
    } catch (e) {
      console.error('[admin] 保存失败', resource, e)
    } finally {
      saving.value = false
    }
  }

  function removeOne(id: string | number) {
    return api.remove(id)
  }

  /** 单条删除（二次确认） */
  async function remove(row: any) {
    const ok = await ElMessageBox.confirm('确认删除该条数据？', '提示', { type: 'warning' })
      .then(() => true)
      .catch(() => false)
    if (!ok) return
    try {
      await removeOne(idOf(row))
      ElMessage.success('删除成功')
      query()
    } catch (e) {
      console.error('[admin] 删除失败', resource, e)
    }
  }

  /** 批量删除：后端无批量接口，并发单条删除后汇总提示 */
  async function batchRemove() {
    const rows = selection.value
    if (!rows.length) return
    const ok = await ElMessageBox.confirm(`确认删除选中的 ${rows.length} 条数据？`, '提示', {
      type: 'warning'
    })
      .then(() => true)
      .catch(() => false)
    if (!ok) return
    const results = await Promise.allSettled(rows.map((r) => removeOne(idOf(r))))
    const failed = results.filter((r) => r.status === 'rejected')
    failed.forEach((r: any) => console.error('[admin] 删除失败', resource, r.reason))
    if (failed.length) {
      ElMessage.warning(`成功 ${results.length - failed.length} 条，失败 ${failed.length} 条`)
    } else {
      ElMessage.success(`已删除 ${results.length} 条`)
    }
    query()
  }

  function onSelectionChange(rows: any[]) {
    selection.value = rows
  }

  return {
    list,
    loading,
    filters,
    selection,
    editable,
    total,
    dialogVisible,
    dialogTitle,
    isEdit,
    saving,
    formRef,
    formData,
    query,
    resetQuery,
    openAdd,
    openEdit,
    submit,
    remove,
    batchRemove,
    onSelectionChange
  }
}
