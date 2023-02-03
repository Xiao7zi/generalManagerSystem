<template>
  <div class="menu-manage">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="queryForm">
        <!-- 不能缺少prop 否则重置不生效 -->
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="queryForm.menuName" placeholder="请输入菜单名称"/>
        </el-form-item>
        <el-form-item label="菜单状态" prop="menuState">
          <el-select v-model="queryForm.menuState">
            <el-option :value="1" label="正常"></el-option>
            <el-option :value="2" label="停用"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getMenuList">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleAdd(1)" v-has="'menu-create'">新增</el-button>
      </div>
      <!--  渲染嵌套数据需要 prop 的 row-key -->
      <el-table
          :data="menuList"
          row-key="_id"
          style="width: 100%"
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
        <el-table-column label="操作" width="240">
          <!-- scope 当前操作的这一行的对象 -->
          <template #default="scope">
            <el-button type="primary" @click="handleAdd(2, scope.row)" v-has="'menu-create'">新增</el-button>
            <el-button type="default" @click="handleEdit(scope.row)" v-has="'menu-edit'">
              编辑
            </el-button>
            <el-button type="danger" @click="handleDel(scope.row._id)" v-has="'menu-delete'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 新增用户弹窗 -->
    <!-- 弹窗显示和隐藏通过 v-model来控制 -->
    <el-dialog title="用户新增" v-model="showModal">
      <!-- ref和model 的值不能设置相同的值 -->
      <el-form
          :model="menuForm"
          label-width="100px"
          ref="dialogForm"
          :rules="rules"
      >
        <el-form-item label="父级菜单" prop="parentId">
          <!-- value: 指定选项的值为选项对象的某个属性值 -->
          <!-- label: 指定选项的值为选项对象的某个属性值 -->
          <el-cascader
              v-model="menuForm.parentId"
              placeholder="请选择父级菜单"
              :options="menuList"
              :props="{ checkStrictly: true, value: '_id', label: 'menuName' }"
              clearable
          />
          <span class="menuName-info">不选，则直接创建一级菜单</span>
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="menuForm.menuType">
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="menuForm.menuName" placeholder="请输入菜单名称"/>
        </el-form-item>
        <el-form-item label="菜单图标" prop="icon" v-show="menuForm.menuType == 1">
          <el-input v-model="menuForm.icon" placeholder="请输入岗位"/>
        </el-form-item>
        <el-form-item label="路由地址" prop="path" v-show="menuForm.menuType == 1">
          <el-input v-model="menuForm.path" placeholder="请输入路由地址"/>
        </el-form-item>
        <el-form-item label="权限标识" prop="menuCode" v-show="menuForm.menuType == 2">
          <el-input v-model="menuForm.menuCode" placeholder="请输入权限标识"/>
        </el-form-item>
        <el-form-item label="组件路径" prop="component" v-show="menuForm.menuType == 1">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径"/>
        </el-form-item>
        <el-form-item label="菜单状态" prop="menuState" v-show="menuForm.menuType == 1">
          <el-radio-group v-model="menuForm.menuState">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="2">停用</el-radio>
          </el-radio-group>
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
  </div>
</template>

<script>
import {formatter} from "element-plus";
import utils from './../utils/utils'
import api from "../api";
import {toRaw} from "vue";

export default {
  name: "Menu",
  data() {
    return {
      // 查询表单
      queryForm: {
        menuState: 1
      },
      // 菜单列表
      menuList: [],
      // 菜单新增表单,
      menuForm: {
        parentId: [null],
        menuType: 1,
        menuState: 1
      },
      // 控制显示弹窗
      showModal: false,
      // 用户行为 编辑 / 新建
      action: '',
      // 定义动态表格-格式
      columns: [
        {
          label: '菜单名称',
          prop: 'menuName',
          width: 180
        },
        {
          label: '图标',
          prop: 'icon',
        },
        {
          label: '菜单类型',
          prop: 'menuType',
          // 格式化菜单类型
          formatter(row, column, val) {
            return {
              "1": "菜单",
              "2": "按钮"
            }[val]
          }
        },
        {
          label: '权限标识',
          prop: 'menuCode',
        },
        {
          label: '路由地址',
          prop: 'path',
        },
        {
          label: '组件路径',
          prop: 'component',
        },
        {
          label: '菜单状态',
          prop: 'menuState',
          // 格式化菜单状态
          formatter(row, column, val) {
            return {
              "1": "正常",
              "2": "停用"
            }[val]
          }
        },
        {
          label: '创建时间',
          prop: 'createTime',
          width: 210,
          // 格式化时间
          formatter(row, column, val) {
            return utils.formatDate(new Date(val))
          }
        },
      ],
      // 表单校验规则
      rules: {
        menuName: [
          {
            required: true,
            message: '请输入菜单名称',
            trigger: 'blur'
          },
          {
            min: 2,
            max: 10,
            message: '长度在2-8个字符',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  mounted() {
    // 初始化获取菜单列表
    this.getMenuList()
  },
  methods: {
    formatter,
    // 菜单列表初始化
    async getMenuList() {
      try {
        this.menuList = await api.getMenuList(this.queryForm)
      } catch (error) {
        throw new Error(error)
      }
    },
    // 重置表单
    handleReset(form) {
      this.$refs[form].resetFields()
    },
    // 新增菜单
    handleAdd(type, row) {
      // 显示弹窗
      this.showModal = true
      // 设置用户行为 -> 创建
      this.action = 'add'

      // 从列表项里点击新增
      if (type === 2) {
        this.menuForm.parentId = [...row.parentId, row._id].filter(item => item)
      }

    },
    // 编辑
    handleEdit(row) {
      // 显示弹窗
      this.showModal = true
      // 设置用户行为 -> 编辑
      this.action = 'edit'
      // 等DOM渲染完成后再执行，这样初始数据就是空
      // 如果不这样做，初始数据就是row里的数据
      this.$nextTick(() => {
        // 浅拷贝
        Object.assign(this.menuForm, row)
      })
    },
    // 删除
    async handleDel(_id) {
      await api.menuSubmit({_id, action: 'delete'})
      this.$message.success('删除成功')
      // 刷新数据
      this.getMenuList()
    },
    // 菜单操作-提交
    handleSubmit() {
      // 校验表单
      this.$refs.dialogForm.validate(async (isValid) => {
        if (isValid) {
          // 校验成功

          // 获取用户行为 和 菜单表单
          const {action, menuForm} = this
          // 合并请求参数
          let params = {...menuForm, action}
          await api.menuSubmit(params)
          // 关闭弹窗
          this.showModal = false
          // 成功提示
          this.$message.success('操作成功')
          // 重置表单
          this.handleReset('dialogForm')
          // 刷新数据
          await this.getMenuList()
        }
      })
    },
    // 关闭弹窗
    handleClose() {
      // 关闭弹窗
      this.showModal = false
      // 重置表单
      this.handleReset('dialogForm')
    }
  }
}
</script>

<style scoped lang="scss">
.menuName-info {
  margin-left: 10px;
}
</style>