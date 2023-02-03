<template>
  <div class="user-manage">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="user">
        <!-- 不能缺少prop 否则重置不生效 -->
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="user.userId" placeholder="请输入用户ID"/>
        </el-form-item>
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="user.userName" placeholder="请输入用户名称"/>
        </el-form-item>
        <el-form-item label="用户状态" prop="state">
          <el-select v-model="user.state">
            <el-option :value="0" label="所有"></el-option>
            <el-option :value="1" label="在职"></el-option>
            <el-option :value="2" label="离职"></el-option>
            <el-option :value="3" label="试用期"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleCreate" v-has="'user-create'">新增</el-button>
        <el-button type="danger" @click="handlePatchDel" v-has="'user-patch-delete'">批量删除</el-button>
      </div>
      <el-table :data="userList" stripe style="width: 100%" @selection-change="handleSelectionChange">
        <!-- 复选框 -->
        <el-table-column type="selection" width="55"/>
        <!-- 列名 -->
        <el-table-column
            v-for="item in columns"
            :key="item.prop"
            :prop="item.prop"
            :label="item.label"
            :width="item.width"
            :formatter="item.formatter"
        />
        <!-- 编辑和删除 -->
        <el-table-column label="操作" width="180">
          <!-- scope 当前操作的这一行的对象 -->
          <template #default="scope">
            <el-button type="default" @click="handleEdit(scope.row)" v-has="'user-edit'">
              编辑
            </el-button>
            <el-button type="danger" @click="handleDel(scope.row)" v-has="'user-delete'">删除</el-button>
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
    <!-- 新增用户弹窗 -->
    <!-- 弹窗显示和隐藏通过 v-model来控制 -->
    <el-dialog title="用户新增" v-model="showModal">
      <!-- ref和model 的值不能设置相同的值 -->
      <el-form
          :model="userForm"
          label-width="100px"
          ref="dialogForm"
          :rules="rules"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="userForm.userName" placeholder="请输入用户名" :disabled="action === 'edit'"/>
        </el-form-item>
        <el-form-item label="邮箱" prop="userEmail">
          <el-input v-model="userForm.userEmail" placeholder="请输入用户邮箱" :disabled="action === 'edit'">
            <!-- 添加后缀 -->
            <template #append>@imooc.com</template>
          </el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="userForm.mobile" placeholder="请输入手机号"/>
        </el-form-item>
        <el-form-item label="岗位" prop="job">
          <el-input v-model="userForm.job" placeholder="请输入岗位"/>
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-select v-model="userForm.state">
            <el-option :value="1" label="在职"></el-option>
            <el-option :value="2" label="离职"></el-option>
            <el-option :value="3" label="试用期"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="系统角色" prop="roleList">
          <el-select
              v-model="userForm.roleList"
              placeholder="请选择用户系统角色"
              style="width: 100%"
              multiple>
            <el-option
                v-for="role in roleList"
                :key="role._id"
                :label="role.roleName"
                :value="role._id"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- 级联选择器 -->
        <el-form-item label="部门" prop="deptId">
          <!-- value: 指定选项的值为选项对象的某个属性值 -->
          <!-- label: 指定选项的值为选项对象的某个属性值 -->
          <el-cascader
              style="width: 100%"
              v-model="userForm.deptId"
              placeholder="请选择所属部门"
              :options="deptList"
              :props="{checkStrictly: true, value: '_id', label: 'deptName'}"
              clearable
          />
        </el-form-item>
      </el-form>
      <!-- 底部确认和取消 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose('dialogForm')">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {getCurrentInstance, onMounted, reactive, ref, toRaw} from "vue";
import {formatter} from "element-plus";
import utils from './../utils/utils'
import api from "../api";

export default {
  name: "User",
  methods: {formatter},
  setup() {
    // 初始化用户表单对象
    const user = reactive({
      state: 1
    })
    // 初始化用户列表数据
    const userList = ref([])
    // 初始化分页对象
    const pager = reactive({
      pageNum: 1,
      pageSize: 10
    })
    // 获取Composition API 上下文对象 相当于 Options API的 this
    // const { ctx }  = getCurrentInstance() // 方式一，这种方式只能在开发环境下使用，生产环境下的ctx将访问不到
    const {proxy} = getCurrentInstance()  // 方式二，此方法在开发环境以及生产环境下都能访问到组件上下文对象

    // 选中用户列表对象
    const checkedUserIds = ref([])

    // 弹框显示对象
    const showModal = ref(false)

    // 新增用户form对象
    const userForm = reactive({
      state: 3
    })

    // 所有角色列表
    const roleList = ref([])

    // 所有部门列表
    const deptList = ref([])

    // 定义用户操作的行为
    const action = ref('add')

    // 定义动态表格-格式
    const columns = [
      {
        label: '用户id',
        prop: 'userId'
      },
      {
        label: '用户名',
        prop: 'userName'
      },
      {
        label: '用户邮箱',
        prop: 'userEmail'
      },
      {
        label: '用户角色',
        prop: 'role',
        // 用来格式化内容
        // 接受一个 Function，会传入两个参数：row 和 column
        formatter(row, column, val) {
          return {
            0: '管理员',
            1: '普通用户',
          }[val]
        }
      },
      {
        label: '用户状态',
        prop: 'state',
        formatter(row, column, value) {
          return {
            1: "在职",
            2: "离职",
            3: "试用期",
          }[value];
        },
      },
      {
        label: '注册时间',
        prop: 'createTime',
        width: 250,
        formatter: (row, column, val) => {
          return utils.formatDate(new Date(val))
        }
      },
      {
        label: '最后登录时间',
        prop: 'lastLoginTime',
        width: 250,
        formatter: (row, column, val) => {
          return utils.formatDate(new Date(val))
        }
      }
    ]

    // 表单校验规则
    const rules = reactive({
      // 通过v-model的值来指定
      userName: [
        {
          required: true,
          message: '请输入用户名称',
          trigger: 'blur'
        }
      ],
      userEmail: [
        {
          required: true,
          message: '请输入用户邮箱',
          trigger: 'blur'
        }
      ],
      mobile: [
        {
          pattern: /1[3-9]\d{9}/,
          message: "请输入正确的手机号格式",
          trigger: "blur",
        },
      ],
      deptId: [
        {
          required: true,
          message: "请输入用户邮箱",
          trigger: "blur",
        },
      ],
    })

    // 初始化接口调用
    onMounted(() => {
      getUserList()
      getDeptList()
      getRoleAllList()
    })

    // 获取用户列表
    const getUserList = async () => {
      // 合并参数
      const params = {...user, ...pager}
      try {
        // 请求数据
        const {list, page} = await api.getUserList(params)
        userList.value = list
        // 获取分页总数
        pager.total = page.total
      } catch (error) {
        console.log(error)
      }
    }

    // 查询事件，获取用户列表
    const handleQuery = () => {
      getUserList()
    }

    // 重置查询表单
    const handleReset = (form) => {
      proxy.$refs[form].resetFields()
    }

    // 分页事件处理
    const handleCurrentChange = (current) => {
      // 当前是第几页
      pager.pageNum = current
      getUserList()
    }

    // 用户单个删除
    const handleDel = async (row) => {
      await api.userDel({
        userIds: [row.userId]
      })
      proxy.$message.success('删除成功')

      // 刷新数据
      await getUserList();
    }

    // 用户批量删除
    const handlePatchDel = async () => {
      // 如果checkedUserIds 里面没内容就是 没有选中
      if (checkedUserIds.value.length === 0) {
        proxy.$message.error('请选择要删除的用户')
        return
      }

      const res = await api.userDel({
        userIds: checkedUserIds.value   // 可批量删除，可单个删除
      });

      console.log('res => ', res)
      // 删除成功
      if (res.modifiedCount > 0) {
        proxy.$message.success('删除成功')
        // 刷新数据
        await getUserList();
      } else {
        // 删除失败
        proxy.$message.success('删除失败')
      }
    }

    // 表格多选
    const handleSelectionChange = (list) => {
      const arr = []
      // 获取所有选中的userId
      list.map(item => {
        arr.push(item.userId)
      })
      checkedUserIds.value = arr
    }

    // 用户新增
    const handleCreate = () => {
      // 更改操作模式 为 新增
      action.value = 'add'
      showModal.value = true
    }

    // 获取部门列表
    const getDeptList = async () => {
      deptList.value = await api.getDeptList()
    }

    // 获取角色列表
    const getRoleAllList = async () => {
      roleList.value = await api.getRoleAllList()
    }

    // 用户弹窗关闭
    const handleClose = (form) => {
      // 隐藏弹窗
      showModal.value = false
      // 重置表单
      handleReset(form)
    }

    // 用户提交
    const handleSubmit = () => {
      proxy.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          // 校验通过
          const params = toRaw(userForm)
          // 给邮箱添加后缀
          params.userEmail += '@imooc.com'
          // 指定操作
          params.action = action.value
          // 提交请求
          await api.userSubmit(params)
          // 隐藏弹窗
          showModal.value = false
          // 获取操作名称
          const actionName = action.value === 'add' ? '创建' : '修改'
          proxy.$message.success(`用户${actionName}成功`)
          // 重置表单
          handleReset('dialogForm')
          // 刷新数据
          await getUserList()

        }
      })
    }

    // 用户编辑
    const handleEdit = (row) => {
      // 修改操作模式 为 编辑
      action.value = 'edit'
      // 显示弹窗
      showModal.value = true
      // 等DOM渲染完成后再执行，这样初始数据就是空
      // 如果不这样做，初始数据就是row里的数据
      proxy.$nextTick(() => {
        // 浅拷贝
        Object.assign(userForm, row)
      })
    }

    return {
      user,
      userList,
      columns,
      pager,
      checkedUserIds,
      showModal,
      userForm,
      rules,
      roleList,
      deptList,
      action,
      getUserList,
      handleQuery,
      handleReset,
      handleCurrentChange,
      handleDel,
      handlePatchDel,
      handleSelectionChange,
      handleCreate,
      getRoleAllList,
      getDeptList,
      handleClose,
      handleSubmit,
      handleEdit
    }
  }
}
</script>

<style scoped>

</style>