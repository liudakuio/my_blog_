<!--
  导航菜单（/api/admin/nav，后端通用 CRUD 接口，字段为下划线列名）
  数据来源：@/api/admin 的 adminList / adminGet / adminCreate / adminUpdate /
    adminDelete（后端通用 CRUD 接口，字段名与后端列名一致，下划线命名）
  结构说明：列表 / 查询 / 多选 / 弹窗 / 提交 / 删除的通用骨架由 @/composables/useAdminCrud
    提供，本页只保留模板、表格列、搜索项、校验规则与差异配置（资源名、主键、提交字段）。
  接口说明：后端未为 nav 提供专用接口，因此保留通用 CRUD 调用；
    通用接口的出入参 key 必须是下划线列名，且列表按列等值筛选、全量返回无分页。
  引用关系：本文件不被任何模块静态 import，而是由 src/config/adminPages.ts 的 CONTENT_PAGES
    依据后端菜单 perms 推导出的 resource 名动态匹配后，经 router 的 lazy import 加载；
    请勿因「无静态 import」误判为孤儿文件而删除。
  编辑权限：editable = userStore.canEdit('nav')，即需 blog:nav:edit 权限。
  字段约定：表单字段与后端 nav 表列名一一对应。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="导航键">
          <el-input
            v-model="queryParams.nav_key"
            placeholder="导航键"
            clearable style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="中文名">
          <el-input
            v-model="queryParams.label_zh"
            placeholder="中文名"
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
        <el-table-column prop="nav_key" label="导航键" width="180" show-overflow-tooltip />
        <el-table-column prop="label_zh" label="中文名" width="200" show-overflow-tooltip />
        <el-table-column prop="label_en" label="英文名" width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" show-overflow-tooltip />
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
            <el-form-item label="导航键" prop="nav_key">
              <el-input v-model="form.nav_key" placeholder="导航键" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中文名" prop="label_zh">
              <el-input v-model="form.label_zh" placeholder="中文名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名" prop="label_en">
              <el-input v-model="form.label_en" placeholder="英文名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :controls="false" class="w-full" />
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
const editable = computed(() => userStore.canEdit('nav'))

/** nav 表行数据：后端通用 CRUD 返回，字段为下划线列名 */
type NavRow = {
  id: string | number
  nav_key: string
  label_zh: string
  label_en: string
  sort: number
}

/** nav 表单字段 */
type NavForm = {
  nav_key: string
  label_zh: string
  label_en: string
  sort: number
}

/** nav 页查询条件 */
type NavQuery = {
  nav_key: string
  label_zh: string
}

// CRUD 骨架由 composable 提供，本页只声明差异点：
// 资源名 nav（后端通用 CRUD，字段为下划线列名）、主键 id、默认表单与提交字段。
const {
  list, loading, total, selection, showSearch, queryParams,
  dialogVisible, dialogTitle, saving, formRef, form,
  getList, handleQuery, resetQuery, handleSelectionChange,
  handleAdd, handleUpdate, cancel, submitForm, handleDelete
} = useAdminCrud<NavRow, NavForm, NavQuery>({
  idField: 'id',
  fetchList: (params) => adminList<NavRow>('nav', params),
  fetchDetail: (id) => adminGet<NavRow>('nav', id),
  createFn: (payload) => adminCreate<NavRow>('nav', payload),
  updateFn: (id, payload) => adminUpdate<NavRow>('nav', id, payload),
  deleteFn: (id) => adminDelete('nav', id),
  defaultQuery: { nav_key: '', label_zh: '' },
  createForm: () => ({
    nav_key: '',
    label_zh: '',
    label_en: '',
    sort: 0
  }),
  // 提交字段：只提交 nav 表的 4 个业务字段
  buildPayload: (form) => ({
    nav_key: form.nav_key,
    label_zh: form.label_zh,
    label_en: form.label_en,
    sort: form.sort
  }),
  titles: { add: '添加导航菜单', edit: '修改导航菜单' },
  logLabel: '导航菜单'
})

const rules = {
  nav_key: [{ required: true, message: '导航键不能为空', trigger: 'blur' }]
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
