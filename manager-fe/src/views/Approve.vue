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
            <el-button
                type="default"
                @click="handleDetail(scope.row)"
                v-if="scope.row.curAuditUserName == userInfo.userName && [1,2].includes(scope.row.applyState)"
            >审核
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
    <el-dialog
        title="审核"
        width="50%"
        v-model="showDetailModal"
    >
      <el-form
          ref="dialogForm"
          :model="auditForm"
          label-width="120px"
          label-suffix=":"
          :rules="rules"
      >
        <el-form-item label="申请人">
          <div>{{ detail.applyUser.userName }}</div>
        </el-form-item>
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
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" :rows="3" placeholder="请输入审核备注" v-model="auditForm.remark"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleApprove('pass')">审核通过</el-button>
          <el-button type="danger" @click="handleApprove('refuse')">驳回</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {getCurrentInstance, onMounted, reactive, ref} from "vue";
import {useStore} from "vuex";
import {formatter} from "element-plus";
import utils from './../utils/utils'
import api from "../api";

export default {
  name: "Approve",
  methods: {formatter},
  setup() {

    // 获取 Composition API 上下文对象
    const {proxy} = getCurrentInstance()

    // 获取 Vuex
    const store = useStore()

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

    // 控制显示详情弹窗
    const showDetailModal = ref(false)

    // 详情弹框
    let detail = ref({})

    // 获取当前用户信息
    const {userInfo} = store.state

    // 审核表单
    const auditForm = reactive({
      remark: ""
    })

    // 表单校验规则
    const rules = {
      remark: [
        {
          required: true,
          message: '请输入审核备注',
          trigger: 'change'
        }
      ]
    }

    // 定义动态表格-格式
    const columns = [
      {
        label: '单号',
        prop: 'orderNo'
      },
      {
        label: '申请人',
        prop: "",
        formatter(row) {
          return row.applyUser.userName
        }
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
      const params = {...queryForm, ...pager, type: 'approve'}
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

    // 弹框关闭
    const handleClose = (form) => {
      showDetailModal.value = false
      handleReset(form)
    }

    // 审核通过 / 拒绝
    const handleApprove = (action) => {
      proxy.$refs.dialogForm.validate(async isValid => {
        if (isValid) {
          // 合并参数
          const params = {_id: detail.value._id, action, remark: auditForm.remark}
          try {
            await api.leaveApprove(params)
            // 关闭弹窗
            handleClose('dialogForm')
            proxy.$message.success('处理成功')
            // 刷新数据
            getApplyList()

            // 提交到 Vuex 的 state
            store.commit('saveNoticeCount', store.state.noticeCount - 1)
          } catch (error) {
            proxy.$message.error(`处理失败：${error.stack}`)
          }
        }
      })
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
      showDetailModal,
      detail,
      userInfo,
      auditForm,
      rules,
      columns,
      getApplyList,
      handleReset,
      handleDetail,
      handleCurrentChange,
      handleApprove
    }
  }
}
</script>

<style scoped>

</style>