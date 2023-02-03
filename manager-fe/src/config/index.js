/**
 * @description 环境配置封装
 * @author ZiSummer
 */

// 获取模式
const env = import.meta.env.MODE || 'prod';

// 模式配置
const EnvConfig = {
    // 开发
    dev: {
        baseApi: '/api',
        mockApi: 'https://www.fastmock.site/mock/7ada079dc42164fccb51aa7b32dbc700/api'
    },
    // 测试
    test: {
        baseApi: '/test.futurefe.com/api',
        mockApi: 'https://www.fastmock.site/mock/7ada079dc42164fccb51aa7b32dbc700/api'
    },
    // 生产
    prod: {
        baseApi: '/futurefe.com/api',
        mockApi: 'https://www.fastmock.site/mock/7ada079dc42164fccb51aa7b32dbc700/api'
    }
}

export default {
    env,
    mock: false,
    // 设置命名空间
    namespace: 'manager',
    ...EnvConfig[env]
}