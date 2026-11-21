<!--
  用户管理（/api/system/user，主键 userId）
  数据来源：@/api/system 的 systemUserList / Get / Create / Update / Delete。
  结构说明：列表 / 查询 / 多选 / 弹窗 / 提交 / 删除的通用骨架由 @/composables/useAdminCrud
    提供，本页只保留模板、表格列、搜索项、校验规则与差异配置（主键、回填、提交字段、删除文案）。
  引用关系：由 router/index.ts 的 SYSTEM_PAGES 注册（权限前缀 system: 的菜单）。
  注意：主键为 userId；修改时 password 留空表示不修改密码；内置 admin 不可删除。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
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
        row-key="userId"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="userId" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="nickName" label="昵称" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'info'" effect="light" size="small">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
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
      width="600px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="90px" :rules="rules">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="form.nickName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" class="w-full">
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isEdit ? '留空表示不修改密码' : '必填，后端 BCrypt 加密'"
          />
        </el-form-item>
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
import { ArrowDown, ArrowUp, Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useAdminCrud } from '@/composables/useAdminCrud'
import { systemEditPerm } from '@/config/permissions'
import {
  systemUserList,
  systemUserGet,
  systemUserCreate,
  systemUserUpdate,
  systemUserDelete
} from '@/api/system'
import type { SysUserQuery, SysUserSaveVo, SysUserVo } from '@/api/system'

const userStore = useUserStore()
const editable = computed(() => userStore.hasPerm(systemEditPerm('user')))

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

/** 用户表单字段；修改时 password 留空表示不修改密码 */
type UserForm = {
  username: string
  nickName: string
  status: string
  password: string
}

// CRUD 骨架由 composable 提供，本页只声明差异点：
// 主键 userId、查询条件、默认表单、回填规则、提交字段与删除文案。
const {
  list, loading, total, selection, showSearch, queryParams,
  dialogVisible, dialogTitle, saving, formRef, isEdit, form,
  getList, handleQuery, resetQuery, handleSelectionChange,
  handleAdd, handleUpdate, cancel, submitForm, handleDelete
} = useAdminCrud<SysUserVo, UserForm, SysUserQuery>({
  idField: 'userId',
  fetchList: (params) => systemUserList(params),
  fetchDetail: systemUserGet,
  createFn: (payload) => systemUserCreate(payload as SysUserSaveVo),
  updateFn: (id, payload) => systemUserUpdate(id, payload as SysUserSaveVo),
  deleteFn: systemUserDelete,
  defaultQuery: { username: '', status: '' },
  createForm: () => ({ username: '', nickName: '', status: '0', password: '' }),
  // 行数据回填：只回填可编辑字段，密码保持为空
  fillForm: (form, row) => {
    Object.assign(form, {
      username: row.username,
      nickName: row.nickName,
      status: row.status
    })
  },
  // 详情覆盖：字段缺失时保留行数据里的值
  applyDetail: (form, detail) => {
    Object.assign(form, {
      username: detail.username ?? form.username,
      nickName: detail.nickName ?? form.nickName,
      status: detail.status ?? form.status
    })
  },
  // 提交字段：密码留空时不提交该字段（后端据此表示不修改密码）
  buildPayload: (form) => {
    const payload: Record<string, unknown> = {
      username: form.username,
      nickName: form.nickName,
      status: form.status
    }
    if (form.password) payload.password = form.password
    return payload
  },
  titles: { add: '添加用户', edit: '修改用户' },
  deleteConfirmText: (rows, isBatch) => isBatch
    ? `确认删除选中的 ${rows.length} 条数据？`
    : `确认删除用户「${rows[0].nickName || rows[0].username}」？`,
  logLabel: '用户'
})

// 新增时密码必填；修改时留空表示不修改
const rules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: isEdit.value ? [] : [{ required: true, message: '请输入密码', trigger: 'blur' }]
}))

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
