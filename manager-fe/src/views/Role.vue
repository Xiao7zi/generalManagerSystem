<template>
  <div class="role-manage">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="queryForm">
        <!-- 不能缺少prop 否则重置不生效 -->
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="queryForm.roleName" placeholder="请输入角色名称"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getRoleList">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleAdd" v-has="'role-create'">创建</el-button>
      </div>
      <!--  渲染嵌套数据需要 prop 的 row-key -->
      <el-table
          :data="roleList"
          style="width: 100%"
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
            <el-button type="default" @click="handleEdit(scope.row)" v-has="'role-edit'">编辑</el-button>
            <el-button type="primary" @click="handleOpenPermission(scope.row)" v-has="'role-setting'">设置权限
            </el-button>
            <el-button type="danger" @click="handleDel(scope.row._id)" v-has="'role-delete'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <el-pagination
          class="pagination"
          background
          layout="->, prev, pager, next"
          :total="pager.total"
          :page-size="pager.pageSize"
          @current-change="handleCurrentChange"
      />
    </div>
    <!-- 弹窗显示和隐藏通过 v-model来控制 -->
    <el-dialog title="用户新增" v-model="showModal">
      <!-- ref和model 的值不能设置相同的值 -->
      <el-form
          :model="roleForm"
          label-width="100px"
          ref="dialogForm"
          :rules="rules"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.roleName" placeholder="请输入角色名称"/>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
              type="textarea"
              :rows="2"
              v-model="roleForm.remark"
              placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <!-- 底部确认和取消 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose('dialogForm')">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            提交
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 权限弹框 -->
    <el-dialog title="权限设置" v-model="showPermission">
      <!-- ref和model 的值不能设置相同的值 -->
      <el-form label-width="100px">
        <el-form-item label="角色名称">{{ curRoleName }}</el-form-item>
        <el-form-item label="选择权限">
          <el-tree
              :data="menuList"
              ref="tree"
              show-checkbox
              node-key="_id"
              :props="{label: 'menuName', children: 'children'}"
              default-expand-all
          />
        </el-form-item>
      </el-form>
      <!-- 底部确认和取消 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPermission = false">取消</el-button>
          <el-button type="primary" @click="handlePermissionSubmit">
            提交
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {formatter} from "element-plus";
import utils from './../utils/utils'
import api from "../api";

export default {
  name: "Role",
  data() {
    return {
      // 查询表单
      queryForm: {
        roleName: ''
      },
      // 角色列表
      roleList: [],
      // 操作角色表单,
      roleForm: {},
      // 分页结构
      pager: {
        pageNum: 1,
        pageSize: 10
      },
      // 控制显示用户弹窗
      showModal: false,
      // 操作模式
      action: '',
      // 权限展示
      showPermission: false,
      curRoleId: '',
      curRoleName: '',
      // 树形菜单列表
      menuList: [],
      // 菜单映射表
      actionMap: {},
      // 定义动态表格-格式
      columns: [
        {
          label: '角色名称',
          prop: 'roleName',
          width: 200
        },
        {
          label: '备注',
          prop: 'remark',
        },
        {
          label: '权限列表',
          prop: 'permissionList',
          // 格式化输出 ，只展示二级菜单
          // 这里使用箭头函数，不然this 取不到
          formatter: (row, column, val) => {
            // 获取半选中的菜单的key值，也就是一级和二级菜单的key值
            const list = val.halfCheckedKeys || []
            // 菜单名称
            const names = []
            // 获取映射
            list.map(key => {
              const name = this.actionMap[key]
              if (key && name) names.push(name)
            })
            return names.join(',')
          }
        },
        {
          label: '创建时间',
          prop: 'createTime',
          width: 220,
          // 格式化时间
          formatter(row, column, val) {
            return utils.formatDate(new Date(val))
          }
        },
        {
          label: '更新时间',
          prop: 'updateTime',
          width: 220,
          // 格式化时间
          formatter(row, column, val) {
            return utils.formatDate(new Date(val))
          }
        },
      ],
      // 表单校验规则
      rules: {
        roleName: [
          {
            required: true,
            message: '请输入角色名称',
            trigger: 'blur'
          }
        ]
      },
    }
  },
  mounted() {
    // 初始化获取角色列表
    this.getRoleList()
    // 初始化获取菜单列表
    this.getMenuList()
  },
  methods: {
    formatter,
    // 角色列表初始化
    async getRoleList() {
      try {
        const {list, page} = await api.getRoleList({
          ...this.queryForm,
          ...this.pager
        })
        // 菜单列表
        this.roleList = list
        // 分页结构
        this.pager.total = page.total;
      } catch (error) {
        throw new Error(error)
      }
    },
    // 菜单列表初始化
    async getMenuList() {
      try {
        // 菜单列表
        const list = await api.getMenuList()
        this.menuList = list
        this.getActionMap(list)
      } catch (error) {
        throw new Error(error)
      }
    },
    // 分页事件处理
    handleCurrentChange(current) {
      // 当前是第几页
      this.pager.pageNum = current
      this.getRoleList()
    },
    // 重置表单
    handleReset(form) {
      this.$refs[form].resetFields()
    },
    // 取消
    handleClose(form) {
      // 关闭弹窗
      this.showModal = false
      // 重置表单
      this.handleReset(form)
    },
    // 提交
    handleSubmit() {
      // 表单校验
      this.$refs.dialogForm.validate(async isValid => {
        if (isValid) {
          // 验证通过

          // 获取参数
          const {roleForm, action} = this
          // 合并参数
          const params = {...roleForm, action}
          const res = await api.roleOperate(params);

          if (res) {
            // 关闭弹窗
            this.showModal = false
            // 成功信息
            this.$message.success('操作成功')
            // 重置表单
            this.handleReset('dialogForm')
            // 刷新数据
            this.getRoleList()
          }
        }
      })
    },
    // 创建角色
    handleAdd() {
      // 更改操作模式
      this.action = 'create'
      // 显示弹窗
      this.showModal = true
    },
    // 编辑角色
    handleEdit(row) {
      // 更改操作模式
      this.action = 'edit'
      // 显示弹窗
      this.showModal = true
      this.$nextTick(() => {
        // 浅克隆
        Object.assign(this.roleForm, {_id: row._id, roleName: row.roleName, remark: row.remark})
      })
    },
    // 删除角色
    async handleDel(_id) {
      await api.roleOperate({_id, action: 'delete'})
      this.$message.success('删除成功')
      // 刷新数据
      this.getRoleList()
    },
    // 打开权限弹窗
    handleOpenPermission(row) {
      // 将数据赋值到表单
      this.curRoleId = row._id
      this.curRoleName = row.roleName
      // 显示弹窗
      this.showPermission = true
      // 获取需要设置选中的 id 也就是 node_key
      const {checkedKeys} = row.permissionList
      this.$nextTick(() => {
        // 通过key值设置 选中
        this.$refs.tree.setCheckedKeys(checkedKeys)
      })
    },
    // 设置权限提交
    async handlePermissionSubmit() {
      // 获取选中的节点数据
      const nodes = this.$refs.tree.getCheckedNodes()
      // 获取半选中的的 key值
      const halfKeys = this.$refs.tree.getHalfCheckedKeys()
      // 获取 选中节点的id -> checkedKeys
      const checkedKeys = []
      const parentKeys = []
      nodes.map(node => {
        if (!node.children) {
          checkedKeys.push(node._id)
        } else {
          // 获取父菜单的key值
          parentKeys.push(node._id)
        }
      })
      // 合并参数
      const params = {
        _id: this.curRoleId,
        permissionList: {
          checkedKeys: checkedKeys,
          halfCheckedKeys: parentKeys.concat(halfKeys)
        }
      }
      // 请求接口
      await api.updatePermission(params)
      // 关闭弹窗
      this.showPermission = false
      this.$message.success('设置成功')
      // 刷新数据
      this.getRoleList()
    },
    // 递归遍历key值，转换成 _id -> menuName 的 字典
    getActionMap(list) {
      const actionMap = {}

      const deep = (arr) => {
        while (arr.length) {
          let item = arr.pop()
          // 二级菜单
          if (item.children && item.action) {
            actionMap[item._id] = item.menuName
          }
          // 一级菜单
          if (item.children && !item.action) {
            // 递归遍历
            deep(item.children)
          }
        }
      }

      // 深克隆 防止原对象被操作
      deep(JSON.parse(JSON.stringify(list)))
      this.actionMap = actionMap
    }
  }
}
</script>

<style>

</style>