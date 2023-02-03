/**
 * @description 角色管理模块
 * @author ZiSummer
 */

const router = require('koa-router')()
const Role = require('./../models/roleSchema')
const util = require('./../utils/util')

// 前缀
router.prefix('/roles')


// 角色名称列表
router.get('/allList', async ctx => {
    try {
        // 只需要获取每个角色的 _id 和 roleName
        const list = await Role.find({}, '_id, roleName')
        // 成功返回
        ctx.body = util.success(list)
    } catch (error) {
        ctx.body = util.fail(`查询失败：${error.stack}`)
    }
})

// 按页获取角色列表
router.get('/list', async (ctx) => {
    // 获取角色名称
    const {roleName} = ctx.request.query;
    // 获取分页信息
    const {page, skipIndex} = util.pager(ctx.request.query)
    try {
        // 合并参数
        let params = {}
        if (roleName) params.roleName = roleName;
        // 查询数据库
        const query = Role.find(params)
        // 从第几条开始查，查多少条
        const list = await query.skip(skipIndex).limit(page.pageSize)
        // 查询的总条数
        const total = await Role.countDocuments(params);
        // 成功返回
        ctx.body = util.success({
            list,
            page: {
                ...page,
                total
            }
        })
    } catch (error) {
        ctx.body = util.fail(`查询失败：${error.stack}`)
    }
})

// 角色操作 创建/编辑/删除
router.post('/operate', async ctx => {
    // 获取参数
    const {_id, roleName, remark, action} = ctx.request.body
    let res, info;
    try {
        if (action === 'create') {
            // 创建
            res = await Role.create({roleName, remark})
            info = '创建成功'
        } else if (action === 'edit') {
            // 编辑
            if (_id) {
                // 合并参数
                const params = {roleName, remark}
                params.update = new Date()
                // 根据 _id 查找并更新
                res = await Role.findByIdAndUpdate(_id, params)
                info = '编辑成功'
            } else {
                ctx.body = util.fail('缺少参数 params: _id')
                return
            }
        } else {
            // 删除

            if (_id) {
                res = await Role.findByIdAndRemove(_id)
                info = '删除成功'
            } else {
                ctx.body = util.fail('缺少参数 params: _id')
                return
            }
        }
        ctx.body = util.success(res, info)
    } catch (error) {
        ctx.body = util.fail(`操作失败：${error.stack}`)
    }
})

// 权限设置
router.post('/update/permission', async ctx => {
    // 获取参数
    const {_id, permissionList} = ctx.request.body

    try {
        // 根据 _id 查找并更新
        await Role.findByIdAndUpdate(_id, {permissionList, update: new Date()})
        ctx.body = util.success('', '权限设置成功')
    } catch (error) {
        ctx.body = util.fail(`权限设置失败：${error.stack}`)
    }
})


// 导出
module.exports = router