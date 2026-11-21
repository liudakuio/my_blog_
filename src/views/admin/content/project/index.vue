<!--
  作品列表（/api/admin/project，后端专用接口，字段驼峰）
  结构说明：列表 / 查询 / 多选 / 弹窗 / 提交 / 删除的通用骨架由 @/composables/useAdminCrud
    提供，图片上传逻辑由 @/composables/useImageUpload 提供；
    本页只保留模板、表格列、搜索项、校验规则与差异配置（主键、分类下拉、提交字段）。
  数据来源：@/api/adminResource 的 adminResourceList / adminResourceGet /
    adminResourceCreate / adminResourceUpdate / adminResourceDelete（专用接口，字段名驼峰）
  筛选说明：后端该接口支持 category、status 两个查询字段（均为等值匹配）；列表全量返回、无分页。
  引用关系：本文件不被任何模块静态 import，而是由 src/config/adminPages.ts 的 CONTENT_PAGES
    依据后端菜单 perms 推导出的 resource 名动态匹配后，经 router 的 lazy import 加载；
    请勿因「无静态 import」误判为孤儿文件而删除。
  编辑权限：editable = userStore.canEdit('project')，即需 blog:project:edit 权限。
  字段约定：表单字段与后端 AdminProjectVo 一一对应。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="作品ID">
          <el-input
            v-model="queryParams.id"
            placeholder="请输入作品ID"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input
            v-model="queryParams.category"
            placeholder="请输入分类"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 180px">
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
          <el-button
            v-if="editable"
            type="success"
            plain
            :icon="Edit"
            :disabled="selection.length !== 1"
            @click="handleUpdate()"
          >
            修改
          </el-button>
          <el-button
            v-if="editable"
            type="danger"
            plain
            :icon="Delete"
            :disabled="selection.length === 0"
            @click="handleDelete()"
          >
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
              <el-icon><Refresh /></el-icon>
            </button>
          </el-tooltip>
          <span class="total-text">共 {{ total }} 条</span>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="category" label="分类" width="120" show-overflow-tooltip />
        <el-table-column prop="categoryValue" label="分类中文名" width="140" show-overflow-tooltip />
        <el-table-column label="封面" width="90" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.cover"
              :src="row.cover"
              fit="cover"
              class="thumb"
              :preview-src-list="[row.cover]"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="110" show-overflow-tooltip />
        <el-table-column prop="tags" label="标签" width="120" show-overflow-tooltip />
        <el-table-column label="视频" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <a v-if="row.videoUrl" :href="row.videoUrl" target="_blank" class="cell-link">
              {{ row.videoUrl }}
            </a>
            <span v-else>-</span>
          </template>
        </el-table-column>
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

    <!-- 添加 / 修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="80px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" filterable clearable class="w-full">
                <el-option
                  v-for="o in categoryOptions"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :controls="false" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="form.icon" placeholder="图标类名" />
            </el-form-item>
          </el-col>
           <!-- 角色 -->
          <el-col :span="8">
            <el-form-item label="角色" prop="role">
              <el-input v-model="form.role"/>
            </el-form-item>
          </el-col>
          <!-- 状态 -->
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="w-full">
                <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 标签 -->
          <el-col :span="8">
            <el-form-item label="标签" prop="tags">
              <el-input v-model="form.tags"/>
            </el-form-item>
          </el-col>
          <!-- 标题 -->
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title"/>
            </el-form-item>
          </el-col>
          <!-- 子标题 -->
          <el-col :span="12">
            <el-form-item label="子标题" prop="subtitle">
              <el-input v-model="form.subtitle"/>
            </el-form-item>
          </el-col>
          <!-- 角色详情 -->
          <el-col :span="12">
            <el-form-item label="角色详情" prop="roleDetail">
              <el-input v-model="form.roleDetail"/>
            </el-form-item>
          </el-col>
          <!-- 想法 -->
          <el-col :span="12">
            <el-form-item label="想法" prop="concept">
              <el-input v-model="form.concept"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="视频链接" prop="videoUrl">
              <el-input v-model="form.videoUrl" placeholder="https://" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="GitHub" prop="githubUrl">
              <el-input v-model="form.githubUrl" placeholder="https://" />
            </el-form-item>
          </el-col>
          <!-- 描述 -->
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="项目描述" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="封面" prop="cover">
              <div class="image-upload">
                <el-image
                  v-if="form.cover"
                  :src="form.cover"
                  fit="cover"
                  class="iu-thumb"
                  :preview-src-list="[form.cover]"
                  preview-teleported
                />
                <div v-else class="iu-empty">
                  <el-icon><Picture /></el-icon>
                  <span>未上传</span>
                </div>
                <p v-if="uploadError" class="iu-error">{{ uploadError }}</p>
                <div class="iu-actions">
                  <el-upload
                    :show-file-list="false"
                    :accept="ACCEPT"
                    :disabled="!canUpload"
                    :before-upload="beforeUpload"
                    :http-request="handleUpload"
                  >
                    <el-button
                      type="primary"
                      size="small"
                      :loading="uploading"
                      :disabled="!canUpload"
                    >
                      {{ form.cover ? '重新上传' : '上传图片' }}
                    </el-button>
                  </el-upload>
                  <el-button
                    v-if="form.cover"
                    size="small"
                    type="danger"
                    plain
                    :disabled="!canUpload"
                    @click="form.cover = ''"
                  >
                    移除
                  </el-button>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
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
import {
  ArrowDown,
  ArrowUp,
  Delete,
  Edit,
  Picture,
  Plus,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useAdminCrud } from '@/composables/useAdminCrud'
import { useImageUpload } from '@/composables/useImageUpload'
import {
  adminResourceList,
  adminResourceGet,
  adminResourceCreate,
  adminResourceUpdate,
  adminResourceDelete
} from '@/api/adminResource'
import type { AdminProjectVo } from '@/api/adminTypes'

const userStore = useUserStore()
const editable = computed(() => userStore.canEdit('project'))

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

/** 作品表单字段：与后端 AdminProjectVo 的可编辑列一致（id 等主键列不进表单） */
type ProjectForm = {
  category: string
  cover: string
  icon: string
  videoUrl: string
  bilibiliId: string
  figmaUrl: string
  websiteUrl: string
  githubUrl: string
  sort: number
  status: string
  remark: string
  title: string
  subtitle: string
  description: string
  role: string
  roleDetail: string
  concept: string
  tags: string
}

/** 作品页查询条件：后端仅识别 category、status 两个字段；id 为用户输入后写入的动态键 */
type ProjectQuery = {
  id: string
  category: string
  status: string
}

/** 表单字段名列表：提交时只提交这些字段，避免把行数据里的额外列（如 id）一起带上 */
const FORM_KEYS = [
  'category', 'cover', 'icon', 'videoUrl', 'bilibiliId', 'figmaUrl', 'websiteUrl', 'githubUrl',
  'sort', 'status', 'remark', 'title', 'subtitle', 'description', 'role', 'roleDetail', 'concept', 'tags'
] as const

// 分类下拉：来自 /api/admin/project_category（页面特有，后端专用接口字段驼峰）
interface CategoryOption {
  value: string
  label: string
}
const categoryOptions = ref<CategoryOption[]>([])

/** 拉取作品分类下拉项（中文名 + 分类值） */
async function loadCategoryOptions() {
  try {
    const data = await adminResourceList('project_category')
    categoryOptions.value = (Array.isArray(data) ? data : []).map((c) => ({
      value: c.categoryValue,
      label: c.labelZh ? `${c.labelZh}（${c.categoryValue}）` : c.categoryValue
    }))
  } catch (e) {
    console.error('[admin] 作品分类加载失败', e)
    categoryOptions.value = []
  }
}

// CRUD 骨架由 composable 提供，本页只声明差异点：
// 后端专用接口（字段驼峰）、主键 id、只提交表单字段的 payload。
const {
  list, loading, total, selection, showSearch, queryParams,
  dialogVisible, dialogTitle, saving, formRef, form,
  getList, handleQuery, resetQuery, handleSelectionChange,
  handleAdd, handleUpdate, cancel, submitForm, handleDelete
} = useAdminCrud<AdminProjectVo, ProjectForm, ProjectQuery>({
  idField: 'id',
  fetchList: (params) => adminResourceList('project', params),
  fetchDetail: (id) => adminResourceGet('project', id),
  createFn: (payload) => adminResourceCreate('project', payload),
  updateFn: (id, payload) => adminResourceUpdate('project', id, payload),
  deleteFn: (id) => adminResourceDelete('project', id),
  defaultQuery: { category: '', status: '' },
  createForm: () => ({
    category: '',
    cover: '',
    icon: '',
    videoUrl: '',
    bilibiliId: '',
    figmaUrl: '',
    websiteUrl: '',
    githubUrl: '',
    sort: 0,
    status: '0',
    remark: '',
    title: '',
    subtitle: '',
    description: '',
    role: '',
    roleDetail: '',
    concept: '',
    tags: ''
  }),
  // 提交字段：只提交表单定义的字段
  buildPayload: (form) => {
    const payload: Record<string, unknown> = {}
    FORM_KEYS.forEach((k) => {
      payload[k] = (form as Record<string, unknown>)[k]
    })
    return payload
  },
  titles: { add: '添加作品', edit: '修改作品' },
  logLabel: '作品'
})

const rules = {
  id: [{ required: true, message: '作品ID不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// ---------------- 封面上传 ----------------
// 上传逻辑（权限判断 / 类型与体积校验 / 上传请求）由 useImageUpload 统一提供，
// 模板里使用的变量名保持不变，页面样式与交互不变。
const {
  canUpload,
  uploading,
  errorMsg: uploadError,
  ACCEPT,
  beforeUpload,
  handleUpload
} = useImageUpload({
  // 上传成功后回写封面字段
  onUploaded: (url) => {
    form.cover = url
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

// 封面上传（页面内联）
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

// 上传 / 移除 按钮同一行
.iu-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
