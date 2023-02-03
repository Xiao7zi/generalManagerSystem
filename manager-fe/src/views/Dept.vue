<template>
  <div class="dept-manage">
    <div class="query-form">
      <el-form :model="queryForm" :inline="true" ref="queryForm">
        <el-form-item label="部门名称" prop="deptName">
          <el-input placeholder="请输入部门名称" v-model="queryForm.deptName"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getDeptList">查询</el-button>
          <el-button type="default" @click="handleReset('queryForm')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleOpen" v-has="'dept-create'">创建</el-button>
      </div>
      <el-table
          :data="deptList"
          style="width: 100%"
          row-key="_id"
          :tree-props="{children: 'children'}"
      >
        <!-- 列名 -->
        <el-table-column
            v-for="item in columns"
            :key="item.prop"
            :prop="item.prop"
            :label="item.label"
            :width="item.width"
            :formatter="item.formatter"
        />
        <!-- 新增，编辑和删除 -->
        <el-table-column label="操作" width="300">
          <!-- scope 当前操作的这一行的对象 -->
          <template #default="scope">
            <el-button type="default" @click="handleEdit(scope.row)" v-has="'dept-edit'">编辑</el-button>
            <el-button type="danger" @click="handleDel(scope.row._id)" v-has="'dept-delete'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog :title="action === 'create' ? '创建部门' : '编辑部门'" v-model="showModal">
      <el-form
          ref="dialogForm"
          :model="deptForm"
          :rules="rules"
          label-width="120px"
      >
        <el-form-item label="上级部门" prop="parentId">
          <el-cascader
              placeholder="请选择上级部门"
              v-model="deptForm.parentId"
              :options="deptList"
              :show-all-levels="true"
              :props="{ checkStrictly: true, value: '_id', label: 'deptName' }"
              clearable
          ></el-cascader>
        </el-form-item>
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="deptForm.deptName" placeholder="请输入部门名称"/>
        </el-form-item>
        <el-form-item label="负责人" prop="user">
          <el-select v-model="deptForm.user" placeholder="请选择部门负责人" @change="handleUser">
            <el-option
                v-for="item in userList"
                :key="item._id"
                :label="item.userName"
                :value="`${item.userId}/${item.userName}/${item.userEmail}`"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="负责人邮箱" prop="userEmail">
          <el-input
              v-model="deptForm.userEmail"
              placeholder="请输入负责人邮箱"
              disabled
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose('dialogForm')">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            提交
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import api from "../api";
import utils from "../utils/utils";

export default {
  name: "Dept",
  data() {
    return {
      // 查询表单
      queryForm: {
        deptName: ''
      },
      // 部门列表
      deptList: [],
      // 创建/编辑部门表单
      deptForm: {
        parentId: [null]
      },
      // 分页结构
      pager: {
        pageNum: 1,
        pageSize: 10
      },
      // 用户列表
      userList: [],
      // 用户操作
      action: 'create',
      // 控制显示弹窗,
      showModal: false,
      // 定义动态表格-格式
      columns: [
        {
          label: '部门名称',
          prop: 'deptName'
        },
        {
          label: '负责人',
          prop: 'userName'
        },
        {
          label: '更新时间',
          prop: 'updateTime',
          // 格式化时间
          formatter(row, column, val) {
            return utils.formatDate(new Date(val))
          }
        },
        {
          label: '创建时间',
          prop: 'createTime',
          // 格式化时间
          formatter(row, column, val) {
            return utils.formatDate(new Date(val))
          }
        }
      ],
      // 表单校验规则
      rules: {
        parentId: [
          {
            required: true,
            message: '请选择上级部门',
            trigger: 'blur'
          }
        ],
        deptName: [
          {
            required: true,
            message: '请输入部门名称',
            trigger: 'blur'
          }
        ],
        user: [
          {
            required: true,
            message: '请选择负责人',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  mounted() {
    // 初始化获取部门列表
    this.getDeptList()
    // 初始化获取用户列表
    this.getAllUserList()
  },
  methods: {
    // 获取部门列表
    async getDeptList() {
      this.deptList = await api.getDeptList(this.queryForm)
    },
    // 获取用户列表
    async getAllUserList() {
      this.userList = await api.getAllUserList()
    },
    // 选中负责人后显示其邮箱的逻辑
    handleUser(val) {
      // 从 value 中获取值
      const [userId, userName, userEmail] = val.split('/')
      // 浅拷贝
      Object.assign(this.deptForm, {userId, userName, userEmail})
    },
    // 重置查询表单
    handleReset(form) {
      this.$refs[form].resetFields()
    },
    // 创建部门
    handleOpen() {
      // 将用户操作设置为 -> 创建
      this.action = 'create'
      // 显示弹窗
      this.showModal = true
    },
    // 编辑部门
    handleEdit(row) {
      // 将用户操作设置为 -> 编辑
      this.action = 'edit'
      // 显示弹窗
      this.showModal = true

      this.$nextTick(() => {
        Object.assign(this.deptForm, row, {
          // 给负责人 赋值
          user: `${row.userId}/${row.userName}/${row.userEmail}`
        })
      })
    },
    // 删除部门
    async handleDel(_id) {
      // 将用户操作设置为 -> 删除
      this.action = 'delete'
      // 根据_id 和 action 删除数据
      await api.deptOperate({_id, action: this.action})
      // 成功返回
      this.$message.success('删除成功')
      // 刷新数据
      this.getDeptList()
    },
    // 取消表单
    handleClose(form) {
      // 关闭弹窗
      this.showModal = false
      // 重置表单
      this.handleReset(form)
    },
    // 提交表单
    handleSubmit() {
      // 表单校验
      this.$refs.dialogForm.validate(async isValid => {
        if (isValid) {
          // 校验成功

          // 获取参数
          const params = {...this.deptForm, action: this.action}
          // 删除无用属性
          delete params.user
          // 请求接口
          await api.deptOperate(params)
          // 成功返回
          this.$message.success('操作成功')
          // 刷新数据
          this.getDeptList()
          // 关闭弹窗
          this.handleClose('dialogFrom')
        }
      })
    }
  }
}
</script>

<style scoped>

</style>