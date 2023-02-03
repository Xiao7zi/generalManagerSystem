/**
 * @description 用户管理模块
 * @author ZiSummer
 */
const router = require('koa-router')()
const User = require('./../models/userSchema')
const Menu = require('./../models/menuSchema')
const Role = require('./../models/roleSchema')
const Counter = require('./../models/counterSchema')
const util = require('./../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
const {getTreeMenu} = require("../utils/util");

// 前缀
router.prefix('/users')

// 用户登录
router.post('/login', async (ctx) => {
    try {
        const {userName, userPwd} = ctx.request.body
        /**
         * 返回数据库指定字段，有三种方式
         * 1. 'userId userName userEmail state role deptId roleList'
         * 2. {userId:1,_id:0}
         * 3. select('userId')
         */
            // 登录校验并查找返回指定字段
        const res = await User.findOne({
                userName,
                userPwd: md5(userPwd)
            }, 'userId userName userEmail state role deptId roleList');
        // 获取用户信息
        const data = res._doc
        // 加密
        const token = jwt.sign({
            data
        }, 'imooc', {expiresIn: '1h'});
        if (data) {
            // 将token添加到返回数据上
            data.token = token
            // 将token发送到前端
            ctx.body = util.success(data)
        } else {
            ctx.body = util.fail("账号或密码错误")
        }
    } catch (error) {
        ctx.body = util.fail(error.msg)
    }
})

// 用户列表
router.get('/list', async (ctx) => {
    // 获取请求参数
    const {userId, userName, state} = ctx.request.query
    // 分页结构
    const {page, skipIndex} = util.pager(ctx.request.body)

    // 将获取到的参数合并到对象里
    const params = {}
    if (userId) params.userId = userId
    if (userName) params.userName = userName
    if (state && state !== '0') params.state = state

    try {
        // 根据条件查询所有用户列表
        const query = User.find(params, {_id: 0, userPwd: 0})
        // 从第几条开始查，查多少条
        const list = await query.skip(skipIndex).limit(page.pageSize)
        // 统计用户总条数
        const total = await User.countDocuments(params)

        ctx.body = util.success({
            page: {
                ...page,
                total
            },
            list
        })
    } catch (error) {
        ctx.body = util.fail(`查询异常:${error.stack}`)
    }
})

// 获取全量用户列表
router.get('/all/list', async ctx => {
    try {
        const list = await User.find({}, 'userId userName userEmail')
        ctx.body = util.success(list)
    } catch (error) {
        ctx.body = util.fail(error.stack)
    }
})

// 用户删除 / 批量删除
router.post('/delete', async (ctx) => {
    // 待删除的用户Id数组
    const {userIds} = ctx.request.body
    // 软删除：将用户标记为离职状态
    const res = await User.updateMany({userId: {$in: userIds}}, {state: 2})
    if (res.modifiedCount) {
        // 删除成功
        ctx.body = util.success(res, `共删除成功${res.modifiedCount}条`)
        return
    }
    ctx.body = util.fail('删除失败')
})

// 用户新增 / 编辑
router.post('/operate', async (ctx) => {
    const {userId, userName, userEmail, mobile, job, state, roleList, deptId, action} = ctx.request.body
    if (action === 'add') {
        // 新增用户

        // 判断必填项是否为空
        if (!userName || !userEmail || !deptId) {
            ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
            return
        }

        // 判断是否有重复的用户名, 邮箱
        const res = await User.findOne({$or: [{userName}, {userEmail}]}, '_id userName userEmail')

        if (res) {
            // 重复了
            ctx.body = util.fail(`系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`)
        } else {
            // 将 sequence_value 加1, 并返回一个新的 Document
            const doc = await Counter.findOneAndUpdate(
                {_id: 'userId'}, {$inc: {sequence_value: 1}}, {new: true})

            try {
                // 创建新用户
                const user = new User({
                    userId: doc.sequence_value,
                    userName,
                    userPwd: md5('123456'),
                    userEmail,
                    role: 1, //默认普通用户
                    roleList,
                    job,
                    state,
                    deptId,
                    mobile
                })
                // 保存
                user.save();
                ctx.body = util.success('', '用户创建成功');
            } catch (error) {
                ctx.body = util.fail(`用户创建失败: ${error.stack}`);
            }

        }
    } else {
        // 编辑用户

        // 判断部门是否为空
        if (!deptId) {
            ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
            return
        }
        try {
            // 通过userId 查询并更新
            await User.findOneAndUpdate({userId}, {mobile, job, state, roleList, deptId})
            ctx.body = util.success('', '更新成功')
        } catch (error) {
            ctx.body = util.fail(`更新失败`)
        }
    }
})

// 获取用户对应权限的菜单列表 和 按钮列表
router.get('/getPermissionList', async ctx => {
    // 获取 token
    const authorization = ctx.request.headers.authorization;

    // 解密获得 userInfo
    const {data} = util.decode(authorization);

    // 获取菜单列表
    const menuList = await getMenuList(data.role, data.roleList);

    // 获取按钮列表
    // 注意：这里要传入深克隆出来的新对象，避免影响到原对象
    const actionList = getActionList(JSON.parse(JSON.stringify(menuList)))

    // 成功返回
    ctx.body = util.success({menuList, actionList})
})

/**
 * 根据角色 role 查询菜单列表
 * @param userRole role 0: 管理员 1: 普通用户
 * @param roleKeys roleList 系统角色
 */
async function getMenuList(userRole, roleKeys) {
    let rootList = []
    if (userRole == 0) {
        //  是系统管理员，获取全部菜单
        rootList = await Menu.find({}) || []
    } else {
        // 根据用户拥有的角色，获取权限列表
        // 先查找用户对应的角色有哪些
        const roleList = await Role.find({_id: {$in: roleKeys}})

        // 权限列表
        let permissionList = []
        // 遍历每一个角色，将用户对应的每一个角色的权限列表合并
        roleList.map(role => {
            const {checkedKeys, halfCheckedKeys} = role.permissionList;
            permissionList = permissionList.concat([...checkedKeys, ...halfCheckedKeys])
        })
        // 去除重复的权限
        permissionList = [...new Set(permissionList)]

        // 在menus 集合里查找 permissionList 权限列表对应的所有 菜单包括按钮
        rootList = await Menu.find({_id: {$in: permissionList}})
    }
    return util.getTreeMenu(rootList, null, [])
}

/**
 * 通过传入的菜单列表 获取其中所有的按钮标识
 * @param list menuList
 *
 */
function getActionList(list) {
    const actionList = []
    const deep = (arr) => {
        while (arr.length) {
            let item = arr.pop()
            // 判断二级菜单是否有按钮
            if (item.action) {
                item.action.map(action => {
                    // menuCode: 按钮标识
                    if (action.menuCode != null) {
                        actionList.push(action.menuCode)
                    }
                })
            }
            // 一级菜单是否有children
            if (item.children && !item.action) {
                // 递归遍历
                deep(item.children)
            }
        }
    }
    deep(list)
    return actionList
}

module.exports = router
