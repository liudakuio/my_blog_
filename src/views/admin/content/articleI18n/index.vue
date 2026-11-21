<!--
  文章多语（/api/admin/article_i18n，后端通用 CRUD 接口，字段为下划线列名）
  结构说明：列表 / 查询 / 多选 / 弹窗 / 提交 / 删除的通用骨架由 @/composables/useAdminCrud
    提供，本页只保留模板、表格列、搜索项、校验规则与差异配置（资源名、主键、提交字段）。
  数据来源：@/api/admin 的 adminList / adminGet / adminCreate / adminUpdate /
    adminDelete（后端通用 CRUD 接口，字段名与后端列名一致，下划线命名）
  接口说明：后端未为 article_i18n 提供专用接口，因此保留通用 CRUD 调用；
    通用接口的出入参 key 必须是下划线列名，且列表按列等值筛选、全量返回无分页。
  引用关系：本文件不被任何模块静态 import，而是由 src/config/adminPages.ts 的 CONTENT_PAGES
    依据后端菜单 perms 推导出的 resource 名动态匹配后，经 router 的 lazy import 加载；
    请勿因「无静态 import」误判为孤儿文件而删除。
  编辑权限：editable = userStore.canEdit('article_i18n')，即需 blog:article_i18n:edit 权限。
  字段约定：表单字段与后端 article_i18n 表列名一一对应。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="文章ID">
          <el-input
            v-model="queryParams.article_id"
            placeholder="文章ID"
            clearable style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="语言">
          <el-select v-model="queryParams.lang" placeholder="语言" clearable style="width: 180px">
            <el-option v-for="o in LANG_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input
            v-model="queryParams.title"
            placeholder="标题"
            clearable style="width: 180px"
            @keyup.enter="handleQuery"
          />
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
        <el-table-column prop="article_id" label="文章ID" width="180" show-overflow-tooltip />
        <el-table-column label="语言" width="90">
          <template #default="{ row }">
            <el-tag :type="row.lang === 'zh' ? 'success' : 'info'" effect="light" size="small">
              {{ row.lang === 'zh' ? '中文' : '英文' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="280" show-overflow-tooltip />
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
            <el-form-item label="文章ID" prop="article_id">
              <el-input v-model="form.article_id" placeholder="文章ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="语言" prop="lang">
              <el-select v-model="form.lang" class="w-full">
                <el-option v-for="o in LANG_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="标题" />
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
import { adminList, adminGet, adminCreate, adminUpdate, adminDelete } from '@/api/admin'

const userStore = useUserStore()
const editable = computed(() => userStore.canEdit('article_i18n'))

const LANG_OPTIONS = [
  { label: '中文', value: 'zh' },
  { label: '英文', value: 'en' }
]

/** article_i18n 表行数据：后端通用 CRUD 返回，字段为下划线列名 */
type ArticleI18nRow = {
  id: string | number
  article_id: string
  lang: string
  title: string
}

/** article_i18n 表单字段 */
type ArticleI18nForm = {
  article_id: string
  lang: string
  title: string
}

/** article_i18n 页查询条件 */
type ArticleI18nQuery = {
  article_id: string
  lang: string
  title: string
}

// CRUD 骨架由 composable 提供，本页只声明差异点：
// 资源名 article_i18n（后端通用 CRUD，字段为下划线列名）、主键 id、默认表单与提交字段。
const {
  list, loading, total, selection, showSearch, queryParams,
  dialogVisible, dialogTitle, saving, formRef, form,
  getList, handleQuery, resetQuery, handleSelectionChange,
  handleAdd, handleUpdate, cancel, submitForm, handleDelete
} = useAdminCrud<ArticleI18nRow, ArticleI18nForm, ArticleI18nQuery>({
  idField: 'id',
  fetchList: (params) => adminList<ArticleI18nRow>('article_i18n', params),
  fetchDetail: (id) => adminGet<ArticleI18nRow>('article_i18n', id),
  createFn: (payload) => adminCreate<ArticleI18nRow>('article_i18n', payload),
  updateFn: (id, payload) => adminUpdate<ArticleI18nRow>('article_i18n', id, payload),
  deleteFn: (id) => adminDelete('article_i18n', id),
  defaultQuery: { article_id: '', lang: '', title: '' },
  createForm: () => ({
    article_id: '',
    lang: 'zh',
    title: ''
  }),
  // 提交字段：只提交 article_i18n 表的 3 个业务字段
  buildPayload: (form) => ({
    article_id: form.article_id,
    lang: form.lang,
    title: form.title
  }),
  titles: { add: '添加文章多语', edit: '修改文章多语' },
  logLabel: '文章多语'
})

const rules = {
  article_id: [{ required: true, message: '文章ID不能为空', trigger: 'blur' }]
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
