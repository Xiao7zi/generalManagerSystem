/**
 * @description 通用工具函数
 * @author ZiSummer
 */

const log4js = require('./log4j')
const jwt = require("jsonwebtoken");

const CODE = {
    SUCCESS: 200,
    PARAM_ERROR: 10001,     // 参数错误
    USER_ACCOUNT_ERROR: 20001,      // 账号或密码错误
    USER_LOGIN_ERROR: 30001,    // 用户未登录
    BUSINESS_ERROR: 40001,      // 业务请求失败
    AUTH_ERROR: 50001,  // 认证失败 或 Token过期
}

module.exports = {
    // 导出状态码
    CODE,
    /**
     * 分页结构封装
     * @param {Number} pageNum 页码
     * @param {Number} pageSize 一页有多少条数据
     */
    pager({pageNum = 1, pageSize = 10}) {
        // 将pageNum 和 pageSize 转换成Number类型
        pageNum *= 1
        pageSize *= 1
        // 获取索引
        const skipIndex = (pageNum - 1) * pageSize
        return {
            page: {
                pageNum,
                pageSize
            },
            skipIndex
        }
    },
    success(data, msg = '', code = CODE.SUCCESS) {
        const successData = data || ''
        log4js.debug(successData)
        return {
            code, data: successData, msg
        }
    },
    fail(msg = '', code = CODE.BUSINESS_ERROR) {
        log4js.debug(msg)
        return {
            code, msg
        }
    },
    // 解密 token
    decode(authorization) {
        if (authorization) {
            const token = authorization.split(' ')[1]
            // 解密
            return jwt.verify(token, 'imooc')
        }
        return ''
    },
    /**
     * 递归拼接树形菜单列表
     * @param rootList 需要递归拼接的菜单列表
     * @param id 每一级菜单的parentId，一开始传入的是一级菜单的Id
     * @param list 保存 拼接好的树形菜单列表 的结果数组
     */
    getTreeMenu(rootList, id, list) {
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
            this.getTreeMenu(rootList, item._id, item.children)
            if (item.children.length === 0) {
                // 删除 子菜单为空 的 children 属性
                delete item.children
            } else if (item.children.length > 0 && item.children[0].menuType === 2) {
                // 快速区分按钮和菜单，用于后期做菜单按钮权限控制
                item.action = item.children
            }
        })

        return list
    },
    /**
     * 格式化日期对象
     * @param date 日期对象
     * @param rule 格式化规则
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date, rule = 'yyyy-MM-dd hh:mm:ss') {
        // 确定格式化规则，默认为 yyyy-MM-dd hh:mm:ss
        let fmt = rule
        // 判断格式化规则中是否包含 'y'
        if (/(y+)/.test(fmt)) {
            // 若包含则将 格式化规则中的 y 替换成年份
            fmt = fmt.replace(RegExp.$1, date.getFullYear())
        }
        //  以正则为Key, 获取对应时间的字符串
        const o = {
            // 'y+': date.getFullYear(),
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'h+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds()
        }
        // 循环遍历 o 对象中的每一个属性，获取对应的字符串
        for (let k in o) {
            if (new RegExp(`(${k})`).test(fmt)) {
                const val = o[k] + ''
                // 给一位数时间 补0
                fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? val : ('00' + val).substr(val.length))
            }
        }
        return fmt
    },
}