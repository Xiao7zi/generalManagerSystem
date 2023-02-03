/**
 * @description 部门管理模块
 * @author ZiSummer
 */

const router = require('koa-router')()
const Dept = require('./../models/deptSchema')
const util = require('./../utils/util')

// 前缀
router.prefix('/dept')

// 部门列表
router.get('/list', async ctx => {
    // 获取参数
    const {deptName} = ctx.request.body
    // 合并参数
    const params = {}
    if (deptName) params.deptName = deptName

    // 查询所有部门
    const rootList = await Dept.find(params)

    // 如果是 单个查询 不需要做树形结构
    if (deptName) {
        ctx.body = util.success(rootList)
    } else {
        const treeList = getTreeDept(rootList, null, [])
        ctx.body = util.success(treeList)
    }
})

// 递归拼接树形列表
function getTreeDept(rootList, id, list) {
    // 先遍历拼接一级菜单
    for (let i = 0; i < rootList.length; i++) {
        let item = rootList[i]

        // 获取 parentId 的第一项 就是 一级菜单的 Id
        if (String(item.parentId.slice().pop()) == String(id)) {
            // 获得一级菜单
            // 这里要用_doc来获得数据，item本身是一个mongoose对象
            list.push(item._doc)
        }
    }

    list.map(item => {
        // 给每一级菜单添加子菜单数组
        item.children = []
        // 递归遍历下一级菜单
        getTreeDept(rootList, item._id, item.children)
        if (item.children.length === 0) {
            // 删除 子菜单为空 的 children 属性
            delete item.children
        }
    })

    return list
}

// 部门 创建/编辑/删除
router.post('/operate', async ctx => {
    // 获取参数
    const {_id, action, ...params} = ctx.request.body
    // 创建结果 和 成功信息
    let info

    try {
        if (action === 'create') {
            // 创建

            await Dept.create(params)
            info = '创建成功'
        } else if (action === 'edit') {
            // 编辑

            params.updateTime = new Date()
            await Dept.findByIdAndUpdate(_id, params)
            info = '编辑成功'
        } else if (action === 'delete') {
            // 删除

            await Dept.findByIdAndRemove(_id)
            // 把 parentId 包含 当前_id 的 全部删除
            await Dept.deleteMany({parentId: {$all: [_id]}})
            info = '删除成功'
        }
        ctx.body = util.success('', info)
    } catch (error) {
        ctx.body = util.fail(error.stack)
    }
})


module.exports = router