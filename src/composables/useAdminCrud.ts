// 后台 CRUD 通用骨架：把多个后台页面里逐字重复的「列表 / 查询 / 多选 / 弹窗 / 提交 / 删除」
// 逻辑上移到这里，页面只保留模板、表格列、搜索项与校验规则。
// 背景：src/views/admin 下的 user / role / menu / nav / articleI18n / article / project /
//   articleCategory / projectCategory 共 9 个页面复制了同一套骨架（约 1350 行），
//   改一处逻辑需要同步改 9 处，极易漏改。
// 设计原则（行为不变优先）：
//   1) 本 composable 只做「逻辑上移」：不新增请求、不改渲染结构、不引入 watch / effect 副作用；
//   2) 页面之间的差异全部通过配置项显式声明，composable 内部不做任何隐式判断；
//   3) 不在内部 onMounted 拉列表——挂载点保留在页面，避免与页面自身的 onMounted 形成双调用；
//   4) 返回的变量名与各页面原有变量名保持一致，因此页面模板无需任何改动。
// 被谁引用：views/admin/system/{user,role,menu}、
//   views/admin/content/{nav,articleI18n,article,project,articleCategory,projectCategory}。
import { computed, reactive, ref, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { AdminRow } from '@/api/types'

/** 后台 CRUD 的行为配置；未提供的能力对应按钮不可用 */
export interface AdminCrudOptions<
  T extends object = AdminRow,
  F extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>
> {
  /** 主键字段名（如 userId / roleId / id），用于取 id */
  idField: keyof T & string
  /** 列表请求：入参为已剔除空值的查询参数，返回全量数组（后端无分页） */
  fetchList: (params: P) => Promise<T[]>
  /** 详情请求（可选）：失败不阻塞弹窗，沿用行数据兜底 */
  fetchDetail?: (id: string | number) => Promise<T>
  /** 新增请求（缺省则新增按钮不可用） */
  createFn?: (payload: Record<string, unknown>) => Promise<unknown>
  /** 修改请求（缺省则修改按钮不可用） */
  updateFn?: (id: string | number, payload: Record<string, unknown>) => Promise<unknown>
  /** 删除请求（缺省则删除按钮不可用） */
  deleteFn?: (id: string | number) => Promise<unknown>
  /**
   * 初始查询条件（键名即后端可识别的筛选列）；同时作为 queryParams 的类型来源。
   * 允许只声明部分字段：有些搜索项初始不出现（如作品ID 是用户输入后才写入的动态键）。
   */
  defaultQuery?: Partial<P>
  /** 表单默认值工厂（新增与修改时都以此重置表单） */
  createForm: () => F
  /** 行数据回填表单；缺省时把行数据的所有字段合并进表单 */
  fillForm?: (form: F, row: T) => void
  /** 详情覆盖表单；缺省时把详情的所有字段合并进表单 */
  applyDetail?: (form: F, detail: T) => void
  /** 提交前组装 payload；缺省时提交表单的全部字段 */
  buildPayload?: (form: F, isEdit: boolean) => Record<string, unknown>
  /** 组装列表请求参数；缺省为「剔除空值后的查询条件」 */
  buildParams?: (query: Record<string, unknown>) => Record<string, unknown>
  /**
   * 弹窗打开后的额外动作（可异步），如回显菜单树勾选。
   * @param ctx isEdit 是否修改模式；id 正在修改的主键；detail 详情数据（加载失败时为 null）；row 行数据
   */
  afterOpen?: (ctx: {
    isEdit: boolean
    id: string | number | null
    detail: T | null
    row: T | null
  }) => void | Promise<void>
  /** 保存成功后的额外动作（可异步），如刷新下拉选项 */
  afterSave?: () => void | Promise<void>
  /** 删除成功后的额外动作（可异步），如刷新下拉选项 */
  afterDelete?: () => void | Promise<void>
  /** 弹窗标题；缺省为「添加」/「修改」 */
  titles?: { add: string; edit: string }
  /** 删除二次确认文案；缺省为通用文案 */
  deleteConfirmText?: (rows: T[], isBatch: boolean) => string
  /** 日志前缀中的资源名（如「用户」「导航」），用于拼接默认日志文案 */
  logLabel?: string
  /** 列表加载失败日志文案（缺省按 logLabel 拼接） */
  listErrorLog?: string
  /** 详情加载失败日志文案（缺省按 logLabel 拼接） */
  detailErrorLog?: string
  /** 保存失败日志文案（缺省按 logLabel 拼接） */
  saveErrorLog?: string
  /** 删除失败日志文案（缺省按 logLabel 拼接） */
  deleteErrorLog?: string
}

/**
 * 后台 CRUD 通用骨架。
 * @param options 行为配置，页面之间的一切差异都在此声明
 */
export function useAdminCrud<
  T extends object = AdminRow,
  F extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>
>(options: AdminCrudOptions<T, F, P>) {
  const {
    idField,
    fetchList,
    fetchDetail,
    createFn,
    updateFn,
    deleteFn,
    createForm,
    fillForm,
    applyDetail,
    buildPayload,
    buildParams,
    afterOpen,
    afterSave,
    afterDelete,
    titles = { add: '添加', edit: '修改' },
    deleteConfirmText,
    logLabel = ''
  } = options

  // ---------------- 列表 ----------------
  // 列表与多选结果整体替换、不做就地修改，故用 shallowRef 避免深层响应式开销
  /** 当前列表数据 */
  const list = shallowRef<T[]>([])
  /** 列表加载中（表格 loading 指示） */
  const loading = ref(false)
  /** 总条数：后台接口全量返回无分页，等于列表长度 */
  const total = ref(0)
  /** 表格多选结果 */
  const selection = shallowRef<T[]>([])
  /** 搜索区是否展开 */
  const showSearch = ref(true)
  /** 查询条件；空值在请求前会被剔除 */
  const queryParams = reactive({ ...(options.defaultQuery ?? {}) }) as P

  /** 默认日志文案：按资源名拼接，页面也可逐条覆盖 */
  const listErrorLog = options.listErrorLog ?? `[admin] ${logLabel}列表加载失败`
  const detailErrorLog = options.detailErrorLog ?? `[admin] ${logLabel}详情加载失败，使用行数据兜底`
  const saveErrorLog = options.saveErrorLog ?? `[admin] ${logLabel}保存失败`
  const deleteErrorLog = options.deleteErrorLog ?? `[admin] ${logLabel}删除失败`

  /** 读取行数据的主键值 */
  function idOf(row: T): string | number | undefined {
    const value = row[idField] as unknown
    return typeof value === 'string' || typeof value === 'number' ? value : undefined
  }

  /** 拉取列表：剔除空查询参数后请求，失败时列表置空、总条数归零 */
  async function getList() {
    loading.value = true
    try {
      const params = (buildParams
        ? buildParams({ ...(queryParams as Record<string, unknown>) })
        : collectNonEmptyParams()) as P
      const data = await fetchList(params)
      list.value = Array.isArray(data) ? data : []
      total.value = list.value.length
    } catch (e) {
      console.error(listErrorLog, e)
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /** 剔除空值后的查询条件（空字符串 / undefined / null 都不参与请求） */
  function collectNonEmptyParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {}
    Object.keys(queryParams).forEach((k) => {
      const v = (queryParams as Record<string, unknown>)[k]
      if (v !== '' && v !== undefined && v !== null) params[k] = v
    })
    return params
  }

  /** 搜索：按当前查询条件重新拉取列表 */
  function handleQuery() {
    getList()
  }

  /** 重置：把所有查询条件清空后重新拉取列表 */
  function resetQuery() {
    Object.keys(queryParams).forEach((k) => {
      (queryParams as Record<string, unknown>)[k] = ''
    })
    getList()
  }

  /** 表格多选变化 */
  function handleSelectionChange(rows: T[]) {
    selection.value = rows
  }

  // ---------------- 弹窗表单 ----------------
  /** 弹窗显隐 */
  const dialogVisible = ref(false)
  /** 弹窗标题 */
  const dialogTitle = ref('')
  /** 提交中（按钮 loading） */
  const saving = ref(false)
  /** el-form 实例引用（用于触发校验） */
  const formRef = ref<FormInstance>()
  /** 正在修改的主键；null 表示新增 */
  const editingId = ref<string | number | null>(null)
  /** 是否处于修改模式 */
  const isEdit = computed(() => editingId.value !== null)
  /** 表单数据 */
  const form = reactive(createForm()) as F

  /** 新增：重置表单并打开弹窗 */
  async function handleAdd() {
    editingId.value = null
    dialogTitle.value = titles.add
    Object.assign(form, createForm())
    dialogVisible.value = true
    await afterOpen?.({ isEdit: false, id: null, detail: null, row: null })
  }

  /**
   * 修改：既支持传入行数据，也支持只传选中项（工具栏的「修改」按钮）。
   * 流程为「行数据回填 -> 详情覆盖」，详情请求失败时沿用行数据，不阻塞弹窗。
   */
  async function handleUpdate(row?: T) {
    const target = row ?? selection.value[0]
    if (!target) return
    editingId.value = idOf(target) ?? null
    dialogTitle.value = titles.edit
    Object.assign(form, createForm())
    if (fillForm) {
      fillForm(form, target)
    } else {
      Object.assign(form, target)
    }
    const id = idOf(target)
    let detail: T | null = null
    if (fetchDetail && id !== undefined) {
      try {
        detail = await fetchDetail(id)
        if (detail) {
          if (applyDetail) {
            applyDetail(form, detail)
          } else {
            Object.assign(form, detail)
          }
        }
      } catch (e) {
        console.error(detailErrorLog, e)
      }
    }
    dialogVisible.value = true
    await afterOpen?.({ isEdit: true, id: id ?? null, detail, row: target })
  }

  /** 关闭弹窗 */
  function cancel() {
    dialogVisible.value = false
  }

  /** 提交：校验通过后按新增 / 修改分支调用对应接口，成功后关弹窗并刷新列表 */
  async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    saving.value = true
    try {
      const payload = buildPayload ? buildPayload(form, isEdit.value) : { ...form }
      if (editingId.value !== null) {
        await updateFn?.(editingId.value, payload)
        ElMessage.success('修改成功')
      } else {
        await createFn?.(payload)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      getList()
      await afterSave?.()
    } catch (e) {
      console.error(saveErrorLog, e)
    } finally {
      saving.value = false
    }
  }

  // ---------------- 删除 ----------------
  /**
   * 删除：单行删除传 row，批量删除不传（取表格多选结果）。
   * 批量删除并发执行并统计成功 / 失败条数。
   */
  async function handleDelete(row?: T) {
    const rows = row ? [row] : selection.value
    if (!rows.length) return
    const confirmText = deleteConfirmText
      ? deleteConfirmText(rows, !row)
      : row
        ? '确认删除该条数据？'
        : `确认删除选中的 ${rows.length} 条数据？`
    const ok = await ElMessageBox.confirm(confirmText, '提示', { type: 'warning' })
      .then(() => true)
      .catch(() => false)
    if (!ok) return

    const results = await Promise.allSettled(
      rows.map((r) => deleteFn?.(idOf(r) as string | number))
    )
    const failed = results.filter((r) => r.status === 'rejected')
    failed.forEach((r) => console.error(deleteErrorLog, (r as PromiseRejectedResult).reason))
    if (failed.length) {
      ElMessage.warning(`成功 ${results.length - failed.length} 条，失败 ${failed.length} 条`)
    } else {
      ElMessage.success(`已删除 ${results.length} 条`)
    }
    getList()
    await afterDelete?.()
  }

  return {
    // 列表
    list,
    loading,
    total,
    selection,
    showSearch,
    queryParams,
    // 弹窗表单
    dialogVisible,
    dialogTitle,
    saving,
    formRef,
    editingId,
    isEdit,
    form,
    // 方法
    getList,
    handleQuery,
    resetQuery,
    handleSelectionChange,
    handleAdd,
    handleUpdate,
    cancel,
    submitForm,
    handleDelete
  }
}
