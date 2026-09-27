<!-- 用户管理：GET/POST/PUT/DELETE /api/system/user -->
<template>
  <div class="sys-page">
    <div class="page-head">
      <h2 class="page-title">用户管理</h2>
      <p class="page-desc">系统用户（共 {{ list.length }} 条）</p>
    </div>

    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="filters.username"
          placeholder="用户名"
          size="default"
          clearable
          class="filter-input"
        />
        <el-select v-model="filters.status" placeholder="状态" clearable class="filter-input">
          <el-option v-for="o in STATUS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
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

    <el-table v-loading="loading" :data="list" border stripe class="grid">
      <el-table-column prop="userId" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickName" label="昵称" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'info'" effect="plain" size="small">
            {{ row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column v-if="editable" label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="formData" label-width="90px" :rules="formRules">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="isEdit" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="formData.nickName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" class="w-full">
            <el-option v-for="o in STATUS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            show-password
            :placeholder="isEdit ? '留空表示不修改密码' : '必填，后端 BCrypt 加密'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  systemUserList,
  systemUserGet,
  systemUserCreate,
  systemUserUpdate,
  systemUserDelete,
  type SysUserSaveVo
} from '@/api/system'

const userStore = useUserStore()
const editable = computed(() => userStore.hasPerm('system:user:edit'))

const STATUS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

const list = ref<any[]>([])
const loading = ref(false)
const filters = reactive<{ username: string; status: string }>({ username: '', status: '' })

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (filters.username) params.username = filters.username
    if (filters.status) params.status = filters.status
    const data = await systemUserList(params)
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.username = ''
  filters.status = ''
  load()
}

// ---------------- 弹窗表单 ----------------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const formRef = ref()
const editingId = ref<number | string | null>(null)
const isEdit = computed(() => editingId.value !== null)
const formData = reactive({ username: '', nickName: '', status: '0', password: '' })

// 新增时密码必填；编辑时留空表示不修改
const formRules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: isEdit.value ? [] : [{ required: true, message: '请输入密码', trigger: 'blur' }]
}))

function openAdd() {
  editingId.value = null
  dialogTitle.value = '新增用户'
  formData.username = ''
  formData.nickName = ''
  formData.status = '0'
  formData.password = ''
  dialogVisible.value = true
}

async function openEdit(row: any) {
  editingId.value = row.userId
  dialogTitle.value = '编辑用户'
  try {
    const detail: any = await systemUserGet(row.userId)
    formData.username = detail?.username ?? ''
    formData.nickName = detail?.nickName ?? ''
    formData.status = detail?.status ?? '0'
  } catch (e) {
    // 详情失败则用行数据兜底
    formData.username = row.username ?? ''
    formData.nickName = row.nickName ?? ''
    formData.status = row.status ?? '0'
  }
  // 后端不返回密码，编辑时始终留空
  formData.password = ''
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: SysUserSaveVo = {
      username: formData.username,
      nickName: formData.nickName,
      status: formData.status
    }
    if (formData.password) payload.password = formData.password
    if (editingId.value !== null) {
      await systemUserUpdate(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await systemUserCreate(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    load()
  } catch (e) {
    // 用户名重复等由拦截器统一提示
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.username}」？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await systemUserDelete(row.userId)
    ElMessage.success('已删除')
    load()
  } catch (e) {
    // 内置 admin 不可删等由拦截器统一提示
  }
}

onMounted(load)
</script>

<style lang="less" scoped>
.sys-page {
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

.w-full {
  width: 100%;
}
</style>
