/**
 * @description 工具函数封装
 * @author ZiSummer
 */
export default {
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
    // 根据树形菜单列表生成 路由列表
    generateRoute(menuList) {
        const routes = []
        const deepList = (list) => {
            while (list.length) {
                let item = list.pop()
                // 只获取二级菜单的路由
                if (item.action) {
                    routes.push({
                        name: item.component,
                        path: item.path,
                        meta: {
                            title: item.menuName
                        },
                        component: item.component,
                    })
                }
                // 一级菜单
                if (item.children && !item.action) {
                    deepList(item.children)
                }
            }
        }
        deepList(menuList)

        return routes
    }
}