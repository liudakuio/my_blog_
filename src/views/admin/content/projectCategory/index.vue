<!--
  作品分类（/api/admin/project_category，后端专用接口，字段驼峰）
  结构说明：列表 / 查询 / 多选 / 弹窗 / 提交 / 删除的通用骨架由 @/composables/useAdminCrud
    提供，本页只保留模板、表格列、搜索项、校验规则与差异配置（主键、本地过滤规则、提交字段）。
  数据来源：@/api/adminResource 的 adminResourceList / adminResourceGet /
    adminResourceCreate / adminResourceUpdate / adminResourceDelete（专用接口，字段名驼峰）
  筛选说明：后端该接口仅支持 status 筛选（后端 AdminProjectCategoryQuery 只有这一个字段），
    且列表全量返回、无分页；因此「分类值」「中文名」两个输入框改为前端本地过滤，不额外发请求。
  引用关系：本文件不被任何模块静态 import，而是由 src/config/adminPages.ts 的 CONTENT_PAGES
    依据后端菜单 perms 推导出的 resource 名动态匹配后，经 router 的 lazy import 加载；
    请勿因「无静态 import」误判为孤儿文件而删除。
  编辑权限：editable = userStore.canEdit('project_category')，即需 blog:project_category:edit 权限。
  字段约定：表单字段与后端 AdminProjectCategoryVo 一一对应（id 由 URL 决定，不进表单）。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="分类值">
          <el-input
            v-model="queryParams.categoryValue"
            placeholder="分类值"
            clearable style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="中文名">
          <el-input
            v-model="queryParams.labelZh"
            placeholder="中文名"
            clearable style="width: 180px"
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
        <el-table-column prop="id" label="ID" width="70" align="center" show-overflow-tooltip />
        <el-table-column prop="categoryValue" label="分类值" width="160" show-overflow-tooltip />
        <el-table-column prop="labelZh" label="中文名" width="140" show-overflow-tooltip />
        <el-table-column prop="labelEn" label="英文名" width="140" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
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
      width="640px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="110px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类值" prop="categoryValue">
              <el-input v-model="form.categoryValue" placeholder="分类值" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中文名" prop="labelZh">
              <el-input v-model="form.labelZh" placeholder="中文名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名" prop="labelEn">
              <el-input v-model="form.labelEn" placeholder="英文名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :controls="false" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="w-full">
                <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
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
import { computed, onMounted } from 'vue'
import {
  ArrowDown,
  ArrowUp,
  Delete,
  Edit,
  Plus,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useAdminCrud } from '@/composables/useAdminCrud'
import {
  adminResourceList,
  adminResourceGet,
  adminResourceCreate,
  adminResourceUpdate,
  adminResourceDelete
} from '@/api/adminResource'
import type { AdminProjectCategoryVo } from '@/api/adminTypes'
import { createLocalFilter } from '@/utils/list'

const userStore = useUserStore()
const editable = computed(() => userStore.canEdit('project_category'))

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

/** 表单模型：字段集与后端 AdminProjectCategoryVo 一致（id 由 URL 决定，不进表单） */
type CategoryForm = {
  categoryValue: string
  labelZh: string
  labelEn: string
  sort: number
  status: string
}

/** 查询条件：status 走后端筛选；categoryValue / labelZh 由前端本地过滤（后端不识别） */
type CategoryQuery = {
  categoryValue: string
  labelZh: string
  status: string
}

/** 表单默认值工厂 */
function createDefaultForm(): CategoryForm {
  return {
    categoryValue: '',
    labelZh: '',
    labelEn: '',
    sort: 0,
    status: '0'
  }
}

/** 用给定数据填充表单：只取表单字段，避免把 id 之类写进表单 */
function fillFormWith(form: CategoryForm, source: Partial<CategoryForm>) {
  const d = createDefaultForm()
  form.categoryValue = source.categoryValue ?? d.categoryValue
  form.labelZh = source.labelZh ?? d.labelZh
  form.labelEn = source.labelEn ?? d.labelEn
  form.sort = source.sort ?? d.sort
  form.status = source.status ?? d.status
}

/** 本地过滤：分类值 / 中文名（模糊匹配，后端不支持这两个查询参数） */
const matchLocalFilter = createLocalFilter<AdminProjectCategoryVo>(['categoryValue', 'labelZh'])

// CRUD 骨架由 composable 提供，本页只声明差异点：
// 后端专用接口（字段驼峰）、本地过滤规则、只提交表单字段的 payload。
const {
  list, loading, total, selection, showSearch, queryParams,
  dialogVisible, dialogTitle, saving, formRef, form,
  getList, handleQuery, resetQuery, handleSelectionChange,
  handleAdd, handleUpdate, cancel, submitForm, handleDelete
} = useAdminCrud<AdminProjectCategoryVo, CategoryForm, CategoryQuery>({
  idField: 'id',
  // 后端专用接口仅支持 status 筛选，其余两个条件由本地过滤
  fetchList: async (params): Promise<AdminProjectCategoryVo[]> => {
    const data = await adminResourceList('project_category', params)
    const rows: AdminProjectCategoryVo[] = Array.isArray(data) ? data : []
    return rows.filter((row) => matchLocalFilter(row, queryParams))
  },
  fetchDetail: (id) => adminResourceGet('project_category', id),
  createFn: (payload) => adminResourceCreate('project_category', payload),
  updateFn: (id, payload) => adminResourceUpdate('project_category', id, payload),
  deleteFn: (id) => adminResourceDelete('project_category', id),
  defaultQuery: { categoryValue: '', labelZh: '', status: '' },
  createForm: createDefaultForm,
  // 行数据回填：只取表单字段，避免把 id 之类写进表单
  fillForm: (form, row) => fillFormWith(form, row),
  // 详情覆盖：字段缺失时回落默认值
  applyDetail: (form, detail) => fillFormWith(form, detail),
  // 只下发后端支持的 status 条件
  buildParams: (query) => (query.status !== '' ? { status: query.status } : {}),
  titles: { add: '添加作品分类', edit: '修改作品分类' },
  logLabel: '作品分类'
})

const rules = {
  categoryValue: [{ required: true, message: '分类值不能为空', trigger: 'blur' }]
}

onMounted(getList)
</script>

<style lang="less" scoped>
/* 样式分区：
   1) .app-container  页面容器，纵向排列各区块
   2) .search-card    搜索卡片
   3) .table-card     表格卡片
   4) .toolbar       工具栏（左侧操作区 / 右侧统计与刷新）
   5) .icon-btn      圆形图标按钮
   6) .w-full        表单控件占满宽度 */
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

.w-full {
  width: 100%;
}

</style>
