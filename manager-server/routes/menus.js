/**
 * @description 菜单管理模块
 * @author ZiSummer
 */

const router = require('koa-router')()
const Menu = require('./../models/menuSchema')
const util = require('./../utils/util')

// 前缀
router.prefix('/menu')

// 菜单列表查询
router.get('/list', async (ctx) => {
    // 获取参数
    const {menuName, menuState} = ctx.request.query

    // 合并参数
    const params = {}
    if (menuName) params.menuName = menuName
    if (menuState) params.menuState = menuState

    // 查找
    let rootList = await Menu.find(params) || []

    // 获取拼接好的树形菜单列表
    const permissionList = util.getTreeMenu(rootList, null, []);

    // 成功返回
    ctx.body = util.success(permissionList)
})

// 菜单 创建/编辑/删除
router.post('/operate', async (ctx) => {
    // 先取出_id 和 action，剩下的参数合并为 params 对象
    const {_id, action, ...params} = ctx.request.body
    // 创建 成功的输出内容
    let info
    try {
        if (action === 'add') {
            // 新增

            await Menu.create(params);
            info = '创建成功'
        } else if (action === 'edit') {
            // 创建

            // 更新时间
            params.updateTime = new Date()
            // 根据 _id 查找并更新
            await Menu.findByIdAndUpdate(_id, params)
            info = '编辑成功'
        } else {
            // 删除

            // 根据 _id 查找并删除
            await Menu.findByIdAndRemove(_id)
            // 删除包含父_id 的所有子数据
            await Menu.deleteMany({parentId: {$all: [_id]}})

            info = '删除成功'
        }
    } catch (error) {
        ctx.body = util.fail(error.stack)
    }

    // 成功
    ctx.body = util.success('', info)
})

// 别忘了导出
module.exports = router
