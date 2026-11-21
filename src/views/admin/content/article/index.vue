<!--
  文章列表（/api/admin/article，后端专用接口，字段驼峰；正文为 Markdown）
  结构说明：列表 / 查询 / 多选 / 弹窗 / 提交 / 删除的通用骨架由 @/composables/useAdminCrud
    提供，本页只保留模板、表格列、搜索项、校验规则与差异配置（主键、提交字段），
    以及页面特有的 Markdown 编辑器（正文图片上传、.md 文件导入）。
  数据来源：@/api/adminResource 的 adminResourceList / adminResourceGet /
    adminResourceCreate / adminResourceUpdate / adminResourceDelete（专用接口，字段名驼峰）
  筛选说明：后端该接口支持 title、category、status 三个查询字段，
    其中 title 与 category 是 LIKE 模糊匹配、status 是等值匹配；列表全量返回、无分页。
  引用关系：本文件不被任何模块静态 import，而是由 src/config/adminPages.ts 的 CONTENT_PAGES
    依据后端菜单 perms 推导出的 resource 名动态匹配后，经 router 的 lazy import 加载；
    请勿因「无静态 import」误判为孤儿文件而删除。
  编辑权限：editable = userStore.canEdit('article')，即需 blog:article:edit 权限。
  字段约定：表单字段与后端 AdminArticleVo 一一对应。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="标题">
          <el-input v-model="queryParams.title" placeholder="筛选标题" clearable style="width: 180px"
            @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryParams.category" placeholder="筛选分类" clearable style="width: 180px">
            <el-option v-for="o in CATEGORY_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="筛选状态" clearable style="width: 180px">
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button v-if="editable" type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
          <el-button v-if="editable" type="success" plain :icon="Edit" :disabled="selection.length !== 1"
            @click="handleUpdate()">
            修改
          </el-button>
          <el-button v-if="editable" type="danger" plain :icon="Delete" :disabled="selection.length === 0"
            @click="handleDelete()">
            删除
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
            <button class="icon-btn" @click="showSearch = !showSearch">
              <el-icon>
                <ArrowUp v-if="showSearch" />
                <ArrowDown v-else />
              </el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="刷新" placement="top">
            <button class="icon-btn" @click="getList">
              <el-icon>
                <Refresh />
              </el-icon>
            </button>
          </el-tooltip>
          <span class="total-text">共 {{ total }} 条</span>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" border stripe row-key="id" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="title" label="标题" width="180" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="180" show-overflow-tooltip />
        <el-table-column label="封面" width="90" align="center">
          <template #default="{ row }">
            <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" class="thumb"
              :preview-src-list="[row.coverImage]" preview-teleported />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="publishDate" label="发布日期" width="120" align="center" />
        <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'info'" effect="light" size="small">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="editable" label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleUpdate(row)">修改</el-button>
            <el-button link type="primary" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加 / 修改弹窗（正文为 Markdown，使用全屏弹窗） -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1080px" fullscreen append-to-body
      :close-on-click-modal="false" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="96px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="标题名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="分类" prop="category">
              <el-input v-model="form.category" placeholder="如 notes" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="发布日期" prop="publishDate">
              <el-date-picker v-model="form.publishDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期"
                class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :controls="false" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="w-full">
                <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="外链" prop="link">
              <el-input v-model="form.link" placeholder="https://（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="内部备注" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="封面" prop="coverImage">
              <div class="image-upload">
                <el-image v-if="form.coverImage" :src="form.coverImage" fit="cover" class="iu-thumb"
                  :preview-src-list="[form.coverImage]" preview-teleported />
                <div v-else class="iu-empty">
                  <el-icon>
                    <Picture />
                  </el-icon>
                  <span>未上传</span>
                </div>
                <p v-if="uploadError" class="iu-error">{{ uploadError }}</p>
                <el-upload :show-file-list="false" :accept="ACCEPT" :disabled="!canUpload" :before-upload="beforeUpload"
                  :http-request="handleUpload">
                  <el-button type="primary" size="small" :loading="uploading" :disabled="!canUpload">
                    {{ form.coverImage ? '重新上传' : '上传图片' }}
                  </el-button>
                  <el-button v-if="form.coverImage" size="small" type="danger" plain :disabled="!form.coverImage"
                    @click="form.coverImage = ''">
                    移除
                  </el-button>
                </el-upload>

              </div>
            </el-form-item>
          </el-col>

        </el-row>

        <el-divider content-position="left">正文内容</el-divider>
        <!-- 导入 Markdown：本地读取 .md 文件写入正文（不上传服务器），导入后可继续编辑 -->
        <div class="content-import">
          <el-upload :show-file-list="false" accept=".md,.markdown,text/markdown,text/plain"
            :before-upload="handleImportMd">
            <el-button size="small" :icon="Document">导入 .md</el-button>
          </el-upload>
          <span class="content-import-tip">从本地 Markdown 文件导入正文，可继续编辑</span>
        </div>
        <MdEditor v-model="form.content" :theme="mdTheme" :height="mdHeight" :preview="true"
          :on-upload-img="onUploadImg" :no-upload-img="!canUpload" />
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  ArrowUp,
  Delete,
  Document,
  Edit,
  Picture,
  Plus,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { useMarkdownUpload } from '@/composables/useMarkdownUpload'
import { useAdminCrud } from '@/composables/useAdminCrud'
import { useImageUpload } from '@/composables/useImageUpload'
import {
  adminResourceList,
  adminResourceGet,
  adminResourceCreate,
  adminResourceUpdate,
  adminResourceDelete
} from '@/api/adminResource'
import type { AdminArticleVo } from '@/api/adminTypes'

const userStore = useUserStore()
const appStore = useAppStore()
const editable = computed(() => userStore.canEdit('article'))
// 正文编辑器图片上传（canUpload 继续供封面上传控件复用）
const { canUpload, onUploadImg } = useMarkdownUpload()

// Markdown 编辑器主题跟随全局深色模式
const mdTheme = computed(() => (appStore.isDark ? 'dark' : 'light'))
const mdHeight = computed(() => Math.max(420, window.innerHeight - 420))

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

/** 分类下拉：来自 /api/admin/article_category（后端专用接口，字段驼峰） */
interface CategoryOption {
  value: string
  label: string
}
const CATEGORY_OPTIONS = ref<CategoryOption[]>([])

/** 拉取文章分类下拉项（中文名 + 分类值） */
async function loadCategoryOptions() {
  try {
    const data = await adminResourceList('article_category')
    CATEGORY_OPTIONS.value = (Array.isArray(data) ? data : []).map((c) => ({
      value: c.categoryValue,
      label: c.labelZh ? `${c.labelZh}（${c.categoryValue}）` : c.categoryValue
    }))
  } catch (e) {
    console.error('[admin] 文章分类加载失败', e)
    CATEGORY_OPTIONS.value = []
  }
}

/** 文章表单字段：与后端 AdminArticleVo 的可编辑列一致 */
type ArticleForm = {
  id: string
  title: string
  category: string
  link: string
  coverImage: string
  publishDate: string
  sort: number
  status: string
  remark: string
  content: string
}

/** 文章页查询条件：后端支持 title（LIKE）、category（LIKE）、status（等值） */
type ArticleQuery = {
  title: string
  category: string
  status: string
}

/** 表单字段名列表：提交时只提交这些字段，避免把行数据里的额外列一起带上 */
const FORM_KEYS = [
  'id', 'title', 'category', 'link', 'coverImage',
  'publishDate', 'sort', 'status', 'remark', 'content'
] as const

// CRUD 骨架由 composable 提供，本页只声明差异点：
// 后端专用接口（字段驼峰）、主键 id、只提交表单字段的 payload。
const {
  list, loading, total, selection, showSearch, queryParams,
  dialogVisible, dialogTitle, saving, formRef, form,
  getList, handleQuery, resetQuery, handleSelectionChange,
  handleAdd, handleUpdate, cancel, submitForm, handleDelete
} = useAdminCrud<AdminArticleVo, ArticleForm, ArticleQuery>({
  idField: 'id',
  fetchList: (params) => adminResourceList('article', params),
  fetchDetail: (id) => adminResourceGet('article', id),
  createFn: (payload) => adminResourceCreate('article', payload),
  updateFn: (id, payload) => adminResourceUpdate('article', id, payload),
  deleteFn: (id) => adminResourceDelete('article', id),
  defaultQuery: { title: '', category: '', status: '' },
  createForm: () => ({
    id: '',
    title: '',
    category: '',
    link: '',
    coverImage: '',
    publishDate: '',
    sort: 0,
    status: '0',
    remark: '',
    content: ''
  }),
  // 提交字段：只提交表单定义的字段
  buildPayload: (form) => {
    const payload: Record<string, unknown> = {}
    FORM_KEYS.forEach((k) => {
      payload[k] = (form as Record<string, unknown>)[k]
    })
    return payload
  },
  titles: { add: '添加文章', edit: '修改文章' },
  logLabel: '文章'
})

const rules = {
  category: [{ required: true, message: '分类不能为空', trigger: 'blur' }],
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
}

/**
 * 导入 Markdown：本地读取 .md 文件内容写入正文，不上传服务器，导入后可继续编辑。
 * 借助 el-upload 的 before-upload 钩子拿到原始 File，返回 false 阻止真实上传请求。
 * 处理四件事：体积上限、去 BOM、覆盖前二次确认、非 UTF-8 编码（出现替换字符）时提示。
 */
async function handleImportMd(file: File): Promise<boolean> {
  // Markdown 文件正常都很小，2MB 足够，超了直接拒绝避免误传大文件
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('文件超过 2MB，请检查是否选错了文件')
    return false
  }
  try {
    // File.text() 按 UTF-8 解码；去掉可能存在的 BOM
    const raw = await file.text()
    const text = raw.replace(/^\uFEFF/, '')

    // 正文已有内容时先确认，避免误覆盖
    if (form.content && form.content.trim()) {
      const ok = await ElMessageBox.confirm('导入将覆盖当前正文内容，确定继续吗？', '提示', {
        type: 'warning',
        confirmButtonText: '覆盖导入',
        cancelButtonText: '取消'
      })
        .then(() => true)
        .catch(() => false)
      if (!ok) return false
    }

    form.content = text
    ElMessage.success(`已导入 ${file.name}`)

    // UTF-8 解码失败会出现替换字符 U+FFFD，通常是 GBK / GB2312 编码
    if (text.includes('\uFFFD')) {
      ElMessage.warning('文件可能不是 UTF-8 编码，中文可能乱码，建议另存为 UTF-8 后重试')
    }
  } catch (e) {
    console.error('[admin] Markdown 导入失败', e)
    ElMessage.error('文件读取失败')
  }
  // 返回 false：阻止 el-upload 发起上传请求
  return false
}


// ---------------- 封面上传 ----------------
// 上传逻辑（权限判断 / 类型与体积校验 / 上传请求）由 useImageUpload 统一提供，
// 模板里使用的变量名保持不变，页面样式与交互不变。
const {
  uploading,
  errorMsg: uploadError,
  ACCEPT,
  beforeUpload,
  handleUpload
} = useImageUpload({
  // 上传成功后回写封面字段
  onUploaded: (url) => {
    form.coverImage = url
  }
})

onMounted(() => {
  loadCategoryOptions()
  getList()
})
</script>

<style lang="less" scoped>
/* 样式分区：
   1) .app-container  页面容器，纵向排列各区块
   2) .search-card    搜索卡片
   3) .table-card     表格卡片
   4) .toolbar       工具栏（左侧操作区 / 右侧统计与刷新）
   5) .image-upload  封面上传区（缩略图 / 空态 / 按钮）
   6) .icon-btn      圆形图标按钮
   7) .w-full        表单控件占满宽度 */
.app-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 正文区：导入条 */
.content-import {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.content-import-tip {
  font-size: 12px;
  color: #909399;
}


.search-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px 16px 0;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}

.table-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;

  .dark & {
    border-color: #2a2a2a;
  }
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-text {
  margin-left: 4px;
  font-size: 13px;
  color: #8c8c8c;
}

.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
  border-radius: 50%;
  background: transparent;
  color: #5a5a5a;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #409eff;
    border-color: #409eff;
    background: #f5f7fa;
  }
}

.thumb {
  width: 56px;
  height: 40px;
  border-radius: 3px;
  display: block;
  background: #f5f7fa;
}

.cell-link {
  color: #409eff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.w-full {
  width: 100%;
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.iu-thumb {
  width: 120px;
  height: 90px;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #f3f4f6;

  .dark & {
    border-color: #2a2a2a;
  }
}

.iu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 120px;
  height: 90px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #9ca3af;

  .dark & {
    border-color: #2a2a2a;
    color: #6b7280;
  }
}

.iu-error {
  margin: 0;
  color: #f56c6c;
  font-size: 12px;
}
</style>
