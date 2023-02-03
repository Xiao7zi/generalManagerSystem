<template>
  <div class="leave-manage">
    <div class="query-form">
      <el-form ref="form" :inline="true" :model="queryForm">
        <el-form-item label="审批状态" prop="applyState">
          <el-select v-model="queryForm.applyState">
            <el-option value="" label="全部"></el-option>
            <el-option :value="1" label="待审批"></el-option>
            <el-option :value="2" label="审批中"></el-option>
            <el-option :value="3" label="审批拒绝"></el-option>
            <el-option :value="4" label="审批通过"></el-option>
            <el-option :value="5" label="作废"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getApplyList">查询</el-button>
          <el-button @click="handleReset('form')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="base-table">
      <div class="action">
        <el-button type="primary" @click="handleApply">申请休假</el-button>
      </div>
      <el-table :data="applyList" stripe style="width: 100%">
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
            <el-button type="default" @click="handleDetail(scope.row)">查看</el-button>
            <el-button
                type="danger"
                @click="handleDelete(scope.row._id)"
                v-if="[1,2].includes(scope.row.applyState)">作废
            </el-button>
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
    <el-dialog title="申请休假" v-model="showModal" width="70%">
      <el-form
          ref="dialogForm"
          :model="leaveForm"
          label-width="120px"
          :rules="rules"
      >
        <el-form-item label="休假类型" prop="applyType" required>
          <el-select v-model="leaveForm.applyType">
            <el-option label="事假" :value="1"></el-option>
            <el-option label="调休" :value="2"></el-option>
            <el-option label="年假" :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="休假类型" required>
          <el-row>
            <el-col :span="8">
              <el-form-item prop="startTime" required>
                <el-date-picker
                    v-model="leaveForm.startTime"
                    type="date"
                    placeholder="选择开始日期"
                    @change="(val) => handleDateChange('startTime', val)"
                />
              </el-form-item>
            </el-col>
            <el-col :span="1">&nbsp;&nbsp;-</el-col>
            <el-col :span="8">
              <el-form-item prop="endTime" required>
                <el-date-picker
                    v-model="leaveForm.endTime"
                    type="date"
                    placeholder="选择结束日期"
                    @change="(val) => handleDateChange('endTime', val)"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="休假时长" required>
          {{ leaveForm.leaveTime }}
        </el-form-item>
        <el-form-item label="休假原因" prop="reasons" required>
          <el-input
              type="textarea"
              :row="3"
              placeholder="请输入休假原因"
              v-model="leaveForm.reasons"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose('dialogForm')">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog
        title="申请休假详情"
        width="50%"
        v-model="showDetailModal"
    >
      <el-steps :active="detail.applyState > 2 ? 3 : detail.applyState" align-center>
        <el-step title="待审批"></el-step>
        <el-step title="审批中"></el-step>
        <el-step title="审批通过/审批拒绝"></el-step>
      </el-steps>
      <el-form label-width="120px" label-suffix=":">
        <el-form-item label="休假类型">
          <div>{{ detail.applyTypeName }}</div>
        </el-form-item>
        <el-form-item label="休假时间">
          <div>{{ detail.time }}</div>
        </el-form-item>
        <el-form-item label="休假时长">
          <div>{{ detail.leaveTime }}</div>
        </el-form-item>
        <el-form-item label="休假原因">
          <div>{{ detail.reasons }}</div>
        </el-form-item>
        <el-form-item label="审批状态">
          <div>{{ detail.applyStateName }}</div>
        </el-form-item>
        <el-form-item label="审批人">
          <div>{{ detail.curAuditUserName }}</div>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import {getCurrentInstance, onMounted, reactive, ref, toRaw} from "vue";
import {formatter} from "element-plus";
import utils from './../utils/utils'
import api from "../api";

export default {
  name: "Leave",
  methods: {formatter},
  setup() {

    // 获取 Composition API 上下文对象
    const {proxy} = getCurrentInstance()

    // 获取查询表单
    const queryForm = reactive({
      applyState: 1
    })

    // 初始化分页对象
    const pager = reactive({
      pageNum: 1,
      pageSize: 10,
      total: 0
    })

    // 休假申请列表
    const applyList = ref([])

    // 控制显示创建弹窗
    const showModal = ref(false)

    // 用户操作行为，create:创建 edit:编辑 delete:删除
    const action = ref("create")

    // 控制显示详情弹窗
    const showDetailModal = ref(false)

    // 详情弹框
    let detail = ref({})

    // 弹窗表单
    const leaveForm = reactive({
      applyType: 1,
      startTime: '',
      endTime: '',
      leaveTime: '0天',
      reasons: ''
    })

    // 表单校验规则
    const rules = {
      startTime: [
        {
          type: "date",
          required: true,
          message: "请输入开始日期",
          trigger: "change",
        },
      ],
      endTime: [
        {
          type: "date",
          required: true,
          message: "请输入结束日期",
          trigger: "change",
        },
      ],
      reasons: [
        {
          required: true,
          message: "请输入休假原因",
          trigger: ["change", "blur"],
        },
      ],
    }

    // 定义动态表格-格式
    const columns = [
      {
        label: '单号',
        prop: 'orderNo'
      },
      {
        label: '休假时间',
        prop: '',
        width: 250,
        formatter(row) {
          return utils.formatDate(new Date(row.startTime), "yyyy-MM-dd")
              + " 到 "
              + utils.formatDate(new Date(row.endTime), "yyyy-MM-dd")
        }
      },
      {
        label: '休假时长',
        prop: 'leaveTime'
      },
      {
        label: '休假类型',
        prop: 'applyType',
        formatter(row, column, val) {
          //  1:事假 2：调休 3:年假
          return {
            1: '事假',
            2: '调休',
            3: '年假'
          }[val]
        }
      },
      {
        label: '休假原因',
        prop: 'reasons',
      },
      {
        label: '申请时间',
        prop: 'createTime',
        width: 250,
        formatter: (row, column, val) => {
          return utils.formatDate(new Date(val))
        }
      },
      {
        label: '审批人',
        prop: 'auditUsers',
      },
      {
        label: '当前审批人',
        prop: 'curAuditUserName',
      },
      {
        label: '审批状态',
        prop: 'applyState',
        formatter(row, column, val) {
          // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
          return {
            1: '待审批',
            2: '审批中',
            3: '审批拒绝',
            4: '审批通过',
            5: '作废'
          }[val]
        }
      },
    ]

    // 初始化接口调用
    onMounted(() => {
      getApplyList()
    })

    // 获取审批列表
    const getApplyList = async () => {
      // 合并参数
      const params = {...queryForm, ...pager}
      // 带着参数请求接口
      const {list, page} = await api.getApplyList(params)
      // 处理响应结果
      applyList.value = list
      pager.total = page.total
    }

    // 重置查询表单
    const handleReset = (form) => {
      proxy.$refs[form].resetFields()
    }

    // 点击申请休假 -- 展示弹框
    const handleApply = () => {
      // 用户操作行为 -> 创建
      action.value = "create"
      // 显示弹窗
      showModal.value = true
    }

    // 获取休假时长
    const handleDateChange = (key, val) => {
      const {startTime, endTime} = leaveForm

      // 有一个为空 不处理
      if (!startTime || !endTime) return

      if (startTime > endTime) {
        proxy.$message.error("开始日期不能晚于结束日期")
        leaveForm.leaveTime = '0天'
        setTimeout(() => {
          // 清空
          leaveForm[key] = ""
        }, 0)
      } else {
        leaveForm.leaveTime = ((endTime - startTime) / (24 * 60 * 60 * 1000)) + 1 + "天"
      }
    }

    // 弹框关闭
    const handleClose = (form) => {
      showModal.value = false
      handleReset(form)
    }

    // 申请提交
    const handleSubmit = () => {
      proxy.$refs.dialogForm.validate(async isValid => {
        if (isValid) {
          // 校验通过
          try {
            // 合并参数
            const params = {...leaveForm, action: action.value}
            await api.leaveOperate(params)
            proxy.$message.success('创建成功')

            // 关闭清空表单
            handleClose('dialogForm')

            // 将时长作0
            leaveForm.leaveTime = "0天"

            // 刷新数据
            getApplyList()
          } catch (error) {
            proxy.$message.error(`创建失败：${error.stack}`)
          }
        }
      })
    }

    // 查看休假申请详情
    const handleDetail = (row) => {
      // 深克隆
      const data = {...row};
      // 对一些数据 进行 转换
      data.applyTypeName = {
        1: "事假",
        2: "调休",
        3: "年假",
      }[data.applyType];
      data.time =
          utils.formatDate(new Date(data.startTime), "yyyy-MM-dd") +
          "到" +
          utils.formatDate(new Date(data.endTime), "yyyy-MM-dd");
      // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
      data.applyStateName = {
        1: "待审批",
        2: "审批中",
        3: "审批拒绝",
        4: "审批通过",
        5: "作废",
      }[data.applyState];

      // 将 data 赋值给 detail
      detail.value = data;
      showDetailModal.value = true;
    }

    // 作废休假申请
    const handleDelete = async (_id) => {
      try {
        // 合并参数
        const params = {_id, action: 'delete'}
        await api.leaveOperate(params)
        proxy.$message.success('删除成功')

        // 刷新数据
        getApplyList()
      } catch (error) {
        proxy.$message.error(`删除失败：${error.stack}`)
      }
    }

    // 分页事件处理
    const handleCurrentChange = (current) => {
      // 当前是第几页
      pager.pageNum = current
      getApplyList()
    }


    return {
      queryForm,
      pager,
      applyList,
      leaveForm,
      showModal,
      showDetailModal,
      detail,
      rules,
      columns,
      getApplyList,
      handleReset,
      handleApply,
      handleDateChange,
      handleClose,
      handleSubmit,
      handleDetail,
      handleDelete,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>

</style>