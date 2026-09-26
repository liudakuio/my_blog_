<!-- 通用 CRUD 视图：由路由 meta.resource + schema 驱动 -->
<template>
  <div class="crud">
    <!-- 页头 -->
    <div class="page-head">
      <h2 class="page-title">{{ schema?.title || resource }}</h2>
      <p class="page-desc">资源：{{ resource }}（共 {{ list.length }} 条）</p>
    </div>

    <!-- 筛选 + 操作工具条 -->
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-for="flt in filterFields"
          :key="flt.key"
          v-model="filters[flt.key]"
          :placeholder="flt.label"
          size="default"
          clearable
          class="filter-input"
        />
        <el-button @click="load">查询</el-button>
        <el-button text @click="resetFilters">重置</el-button>
      </div>
      <div class="actions">
        <el-button v-if="editable" type="primary" @click="openAdd">
          <el-icon><Plus /></el-icon> 新增
        </el-button>
        <el-button @click="load"><el-icon><Refresh /></el-icon> 刷新</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="list" border stripe class="grid">
      <el-table-column
        v-for="col in tableFields"
        :key="col.key"
        :prop="col.key"
        :label="col.label"
        :width="col.width"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <!-- 图片 -->
          <el-image
            v-if="col.type === 'image'"
            :src="row[col.key]"
            fit="cover"
            class="thumb"
            :preview-src-list="row[col.key] ? [row[col.key]] : []"
            preview-teleported
          />
          <!-- 下拉/状态 -->
          <el-tag v-else-if="col.type === 'select'" effect="plain" size="small">
            {{ optionLabel(col, row[col.key]) }}
          </el-tag>
          <!-- 链接 -->
          <a v-else-if="col.type === 'link' && row[col.key]" :href="row[col.key]" target="_blank" class="cell-link">
            {{ row[col.key] }}
          </a>
          <!-- 普通文本 -->
          <span v-else>{{ row[col.key] }}</span>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column v-if="editable" label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      :fullscreen="hasMarkdown"
      :show-close="!hasMarkdown"
      destroy-on-close
    >
      <template #header>
        <div class="crud-dialog-header">
          <span class="crud-dialog-title">{{ dialogTitle }}</span>
          <el-button v-if="hasMarkdown" class="crud-return-btn" @click="dialogVisible = false">
            返回
          </el-button>
        </div>
      </template>
      <div class="crud-form-scroll" :class="{ 'crud-form-scroll--full': hasMarkdown }">
        <el-form ref="formRef" :model="formData" label-width="110px" :rules="formRules">
          <template v-for="field in formFieldsGrouped" :key="field.key">
            <el-divider v-if="field.showDivider && field.section" content-position="left" class="crud-section">
              {{ field.section }}
            </el-divider>
            <el-form-item :label="field.label" :prop="field.key">
              <!-- 文本域 -->
              <el-input
                v-if="field.type === 'textarea'"
                v-model="formData[field.key]"
                type="textarea"
                :rows="3"
                :placeholder="field.label"
              />
              <!-- 数字 -->
              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="formData[field.key]"
                :controls="false"
                class="w-full"
              />
              <!-- 下拉 -->
              <el-select
                v-else-if="field.type === 'select'"
                v-model="formData[field.key]"
                class="w-full"
                :placeholder="field.label"
              >
                <el-option
                  v-for="opt in field.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <!-- 日期时间 -->
              <el-date-picker
                v-else-if="field.type === 'datetime'"
                v-model="formData[field.key]"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
              <!-- Markdown 编辑器（自带实时分屏预览） -->
              <template v-else-if="field.type === 'markdown'">
                <MdEditor
                  v-model="formData[field.key]"
                  :theme="mdTheme"
                  :height="mdHeight"
                  :preview="true"
                  class="md-editor"
                />
              </template>
              <!-- 图片 / 链接：URL 输入 + 预览 -->
              <template v-else>
                <el-input v-model="formData[field.key]" :placeholder="field.label + ' URL'">
                  <template v-if="field.type === 'image' && formData[field.key]" #append>
                    <el-image :src="formData[field.key]" fit="cover" class="mini-thumb" />
                  </template>
                </el-input>
              </template>
            </el-form-item>
          </template>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { adminList, adminGet, adminCreate, adminUpdate, adminDelete } from '@/api/admin'
import { SCHEMA_MAP } from './schema'
import type { FieldSchema } from './types'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const route = useRoute()
const userStore = useUserStore()
const { permissions } = storeToRefs(userStore)

const resource = computed(() => (route.meta.resource as string) || '')
const schema = computed(() => SCHEMA_MAP[resource.value])
const editable = computed(() => userStore.canEdit(resource.value))

const appStore = useAppStore()
// Markdown 编辑器主题跟随全局深色模式
const mdTheme = computed(() => (appStore.isDark ? 'dark' : 'light'))
// 当前资源是否含 Markdown 字段（含则加宽弹窗以容纳编辑器 + 实时预览）
const hasMarkdown = computed(() =>
  (schema.value?.fields || []).some((f) => f.type === 'markdown')
)
const dialogWidth = computed(() => (hasMarkdown.value ? '1080px' : '640px'))
// 编辑器高度：全屏时随视口撑满，普通弹窗固定 400px
const mdHeight = computed(() => {
  void dialogVisible.value
  return hasMarkdown.value ? Math.max(420, window.innerHeight - 360) : 400
})

const list = ref<any[]>([])
const loading = ref(false)

// 可筛选字段：文本/数字/下拉 且 在表格展示、非 id
const filterFields = computed(() =>
  (schema.value?.fields || []).filter(
    (f) => f.table && f.key !== 'id' && ['text', 'number', 'select'].includes(f.type)
  )
)
const filters = reactive<Record<string, string>>({})
const tableFields = computed(() => (schema.value?.fields || []).filter((f) => f.table))
const formFields = computed(() => (schema.value?.fields || []).filter((f) => f.form))

// 表单字段分组：按 section 变化插入分区标题（首个字段前也显示其所属分区）
const formFieldsGrouped = computed(() =>
  formFields.value.map((f, i) => ({
    ...f,
    showDivider: i === 0 || f.section !== formFields.value[i - 1].section
  }))
)

// 表单校验规则（必填项）
const formRules = computed(() => {
  const rules: Record<string, any> = {}
  formFields.value.forEach((f) => {
    if (f.required) rules[f.key] = [{ required: true, message: `请输入${f.label}`, trigger: 'blur' }]
  })
  return rules
})

function resetFilters() {
  Object.keys(filters).forEach((k) => (filters[k] = ''))
  load()
}

function buildParams() {
  const params: Record<string, any> = {}
  filterFields.value.forEach((f) => {
    const v = filters[f.key]
    if (v !== undefined && v !== null && v !== '') params[f.key] = v
  })
  return params
}

async function load() {
  if (!resource.value) return
  loading.value = true
  try {
    const data = await adminList(resource.value, buildParams())
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

// 下拉值 -> 标签
function optionLabel(field: FieldSchema, value: any) {
  const opt = field.options?.find((o) => o.value === String(value))
  return opt ? opt.label : value
}

// ---------------- 弹窗表单 ----------------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const formRef = ref()
const editingId = ref<string | number | null>(null)
const formData = reactive<Record<string, any>>({})

function defaultFor(field: FieldSchema): any {
  if (field.type === 'number') return ''
  if (field.type === 'select') return field.options?.[0]?.value ?? ''
  return ''
}

function openAdd() {
  editingId.value = null
  dialogTitle.value = `新增 - ${schema.value?.title}`
  formFields.value.forEach((f) => (formData[f.key] = defaultFor(f)))
  dialogVisible.value = true
}

async function openEdit(row: any) {
  const pk = row.id
  editingId.value = pk
  dialogTitle.value = `编辑 - ${schema.value?.title}`
  try {
    const detail = await adminGet(resource.value, pk)
    formFields.value.forEach((f) => (formData[f.key] = detail?.[f.key] ?? defaultFor(f)))
  } catch (e) {
    // 详情失败则用行数据兜底
    formFields.value.forEach((f) => (formData[f.key] = row[f.key] ?? defaultFor(f)))
  }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: Record<string, any> = {}
    formFields.value.forEach((f) => (payload[f.key] = formData[f.key]))
    if (editingId.value !== null) {
      await adminUpdate(resource.value, editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await adminCreate(resource.value, payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    load()
  } catch (e) {
    // 错误已由拦截器提示
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除该条数据？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await adminDelete(resource.value, row.id)
    ElMessage.success('已删除')
    load()
  } catch (e) {
    // 错误已由拦截器提示
  }
}

// 首次进入自动加载列表
onMounted(load)

// 复用同一组件时（多个菜单共用 crud 视图），切换菜单不会重新触发 onMounted，
// 监听路由变化，资源（菜单）切换时自动重置筛选并重新调用列表接口
watch(
  () => route.fullPath,
  () => {
    if (!resource.value) return
    // 清空筛选条件，避免上一个菜单的筛选带入当前菜单
    Object.keys(filters).forEach((k) => (filters[k] = ''))
    load()
  }
)
</script>

<style lang="less" scoped>
.crud {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;

    .dark & {
      color: #f0f0f0;
    }
  }
  .page-desc {
    margin: 4px 0 0;
    font-size: 13px;
    color: #9ca3af;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 14px 16px;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-input {
  width: 160px;
}

.actions {
  display: flex;
  gap: 10px;
}

.grid {
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #ececec;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.thumb {
  width: 48px;
  height: 36px;
  border-radius: 6px;
}

.mini-thumb {
  width: 28px;
  height: 28px;
  border-radius: 5px;
}

.cell-link {
  color: #1a1a1a;
  text-decoration: underline;
  font-size: 12px;
  word-break: break-all;

  .dark & {
    color: #cfcfcf;
  }
}

// 弹窗头部：标题居左，返回按钮居右
.crud-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;

  .crud-dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;

    .dark & {
      color: #f0f0f0;
    }
  }

  .crud-return-btn {
    margin-left: auto;
  }
}

// 弹窗内容区滚动容器：长表单可滚动，页脚固定
.crud-form-scroll {
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 8px;

  // 全屏模式：撑满视口（扣除头部与页脚）
  &.crud-form-scroll--full {
    max-height: calc(100vh - 160px);
  }

  // 分区标题
  .crud-section {
    margin: 4px 0 18px;
    color: #9ca3af;
    font-size: 13px;
    font-weight: 600;

    .dark & {
      color: #6b7280;
    }
  }
}

.w-full {
  width: 100%;
}
</style>
