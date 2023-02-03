/**
 * @description 审批流管理模块
 * @author ZiSummer
 */

const router = require('koa-router')()
const Leave = require('./../models/leaveSchema')
const Dept = require('./../models/deptSchema')
const util = require('./../utils/util')

// 前缀
router.prefix('/leave')

// 查询休假申请 / 审批列表
// 若不是管理员，当前用户只能查看到自己的休假申请
router.get('/list', async ctx => {
    // 获取审批状态
    const {applyState, type} = ctx.request.query

    // 获取分页对象
    const {page, skipIndex} = util.pager(ctx.request.query)

    // 获取用户token
    const authorization = ctx.request.headers.authorization

    // 获取当前用户信息
    const {data} = util.decode(authorization)

    let params = {}
    try {
        // 审批列表
        if (type == 'approve') {

            if (applyState == 1 || applyState == 2) {
                // 待审批 和 审批中
                // 当前审批人 必须是 当前用户
                params.curAuditUserName = data.userName
                // 待审批 和 审批中 都要在 待审批中显示
                params.$or = [{applyState: 1}, {applyState: 2}]
            } else if (applyState > 2) {
                // 查询 除待审批 和 审批中 的数据
                params = {"auditFlows.userId": `${data.userId}`, applyState}
            } else {
                // 查询所有
                params = {"auditFlows.userId": `${data.userId}`}
            }
        } else {
            // 休假申请列表

            // 调用子文档要打点调用
            params = {
                "applyUser.userId": `${data.userId}`
            }
            if (applyState) params.applyState = applyState
        }

        // 根据用户Id查询数据库
        const query = Leave.find(params)
        const list = await query.skip(skipIndex).limit(page.pageSize)
        const total = await Leave.countDocuments(params)

        // 成功返回
        ctx.body = util.success({
            page: {
                ...page,
                total
            },
            list
        })
    } catch (error) {
        ctx.body = util.fail(`查询失败: ${error.stack}`)
    }
})

// 创建/删除 休假申请
router.post('/operate', async ctx => {
    // 获取参数
    const {_id, action, ...params} = ctx.request.body

    // 获取用户token
    const authorization = ctx.request.headers.authorization

    // 获取当前用户信息
    const {data} = util.decode(authorization)

    if (action == 'create') {
        // 创建

        // 生产申请单号
        let orderNo = "XJ"
        // XJ202311625
        orderNo += util.formatDate(new Date(), "yyyyMMdd")
        const total = await Leave.countDocuments()
        params.orderNo = orderNo + total

        // 获取用户上级部门负责人信息
        const id = data.deptId.pop()
        // 查找负责人信息
        const dept = await Dept.findById(id);
        // 获取人事部门和财务部门负责人信息
        const userList = await Dept.find({deptName: {$in: ['人事部门', '财务部门']}})

        // 审批人
        const curAuditUserName = dept.userName
        // 完整审批人
        let auditUsers = dept.userName

        // 审批流
        const auditFlows = [
            {
                userId: dept.userId,
                userName: dept.userName,
                userEmail: dept.userEmail
            }
        ]
        userList.map(item => {
            auditFlows.push({
                userId: item.userId,
                userName: item.userName,
                userEmail: item.userEmail
            })
            auditUsers += ',' + item.userName
        })

        params.auditUsers = auditUsers
        params.curAuditUserName = curAuditUserName
        params.auditFlows = auditFlows
        params.auditLogs = []
        params.applyUser = {
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail
        }


        // 创建休假申请
        const res = await Leave.create(params)
        ctx.body = util.success("", "创建成功")
    } else {
        // 删除
        await Leave.findByIdAndUpdate(_id, {applyState: 5})
        ctx.body = util.success('', '删除成功')
    }
})

// 审核 通过 / 驳回
router.post("/approve", async ctx => {
    // 获取参数
    const {_id, action, remark} = ctx.request.body

    // 获取用户token
    const authorization = ctx.request.headers.authorization

    // 获取当前用户信息 即 当前审批人
    const {data} = util.decode(authorization)

    // 参数
    let params = {}

    try {
        // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
        // 获取当前 休假申请
        const doc = await Leave.findById(_id)

        // 审批日志
        const auditLogs = doc.auditLogs || []

        if (action == 'refuse') {
            // 拒绝
            params.applyState = 3
        } else {
            // 通过
            if (doc.auditFlows.length == doc.auditLogs.length) {
                // 审批日志满了 即 已经审批完了
                ctx.body = util.success('', '当前申请单已处理，请勿重复提交')
                return
            } else if (doc.auditFlows.length == doc.auditLogs.length + 1) {
                // 最后一级
                params.applyState = 4
            } else if (doc.auditFlows.length > doc.auditLogs.length) {
                // 审批流的长度 大于 审批日志的长度 即是在 审批中
                params.applyState = 2
                // 将审批人 置为 审批流中下一位
                params.curAuditUserName = doc.auditFlows[doc.auditLogs.length + 1].userName
            }
        }

        // 添加审批日志
        auditLogs.push({
            userId: data.userId,
            userName: data.userName,
            createTime: new Date(),
            remark,
            action: action == "refuse" ? "审核拒绝" : "审核通过"
        })
        params.auditLogs = auditLogs

        // 通过_id查找并更新
        await Leave.findByIdAndUpdate(_id, params)

        ctx.body = util.success("", "处理成功")
    } catch (error) {
        ctx.body = util.fail(`查询异常: ${error.stack}`)
    }
})

// 获取待审批通知数量
router.get('/count', async ctx => {
    // 获取用户token
    const authorization = ctx.request.headers.authorization

    // 获取当前用户信息 即 当前审批人
    const {data} = util.decode(authorization)

    try {
        const params = {}
        params.curAuditUserName = data.userName
        // 待审批 和 审批中 都属于 待审批
        params.$or = [{applyState: 1}, {applyState: 2}]

        // 统计数量
        const total = await Leave.countDocuments(params)
        ctx.body = util.success(total)
    } catch (error) {
        ctx.body = util.fail(`查询异常: ${error.stack}`)
    }
})

module.exports = router