/**
 * @description Axios二次封装
 * @author ZiSummer
 */
import axios from 'axios'
import config from './../config'
import router from './../router'
import {ElMessage} from 'element-plus'
import storage from "./storage";

// 登录过期
const TOKEN_INVALID = 'Token认证失败，请重新登录'
// 网络错误
const NETWORK_ERROR = '网络请求异常，请稍后重试'

// 创建axios实例对象，添加全局配置
const service = axios.create({
    baseURL: config.baseApi,
    timeout: 8000
})

// 请求拦截
service.interceptors.request.use((req) => {
    // TO-DO
    const headers = req.headers
    // 获取token
    const {token} = storage.getItem('userInfo')
    // 给请求头加上token
    if (!headers.Authorization) headers.Authorization = 'Bearer ' + token
    return req
})

// 响应拦截
service.interceptors.response.use((res) => {
    // 从data中获取数据
    const {code, data, msg} = res.data
    // 根据code值判断
    if (code === 200) {
        return data
    } else if (code === 50001) {
        ElMessage.error(TOKEN_INVALID)
        // 1s 后跳转登录页面
        setTimeout(() => {
            router.push('/login')
        }, 1000)
        return Promise.reject(TOKEN_INVALID)
    } else {
        ElMessage.error(msg || NETWORK_ERROR)
        return Promise.reject(msg || NETWORK_ERROR)
    }
})

/**
 * @description 请求核心函数
 * @param {*} options 请求配置
 */

function request(options) {
    options.method = options.method || 'get'
    if (options.method.toLowerCase() === 'get') {
        options.params = options.data
    }

    // 防止 config.mock 被覆盖
    let isMock = config.mock
    // 如果传进来的参数有指定是否启用 mock
    if (typeof options.mock !== 'undefined') {
        isMock = options.mock
    }

    // 如果是生产模式，就一定要调用线上API
    if (config.env === 'prod') {
        service.defaults.baseURL = config.baseApi
    } else {
        // 可以切换调用Mock 还是 baseApi
        service.defaults.baseURL = isMock ? config.mockApi : config.baseApi
    }

    return service(options)
}

/**
 * 这段代码的意思是在request对象中添加了get，post，put，delete，patch等方法， 
 * 这样就可以通过request对象直接调用get，post，put，delete，patch等方法来发送对应的请求了。
 */
['get', 'post', 'put', 'delete', 'patch'].forEach((item) => {
    request[item] = (url, data, options) => {
        return request({
            url,
            data,
            method: item,
            ...options
        })
    }
})

export default request
