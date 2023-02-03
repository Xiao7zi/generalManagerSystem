/**
 * @description Storage二次封装
 * @author ZiSummer
 */

// 引入命名空间
import config from "./../config"

export default {
    setItem(key, val) {
        // 获取命名空间内的值
        let storage = this.getStorage();
        // 将参数 val 存储到 storage 对象中
        storage[key] = val;
        // 将 storage 对象转换为字符串并存储
        window.localStorage.setItem(config.namespace, JSON.stringify(storage));
    },
    getItem(key) {
        // 获取命名空间内相对应的值
        return this.getStorage()[key]
    },
    // 从本地存储中获取与 命名空间 对应的值，并将其转换为对象并返回
    getStorage() {
        return JSON.parse(window.localStorage.getItem(config.namespace) || "{}");
    },
    clearItem(key) {
        // 获取命名空间内的值
        let storage = this.getStorage()
        // 从 storage 对象中删除与参数 key 对应的值
        delete storage[key]
        // 将修改后的 storage 对象转换为字符串并存储到本地存储中
        window.localStorage.setItem(config.namespace, JSON.stringify(storage));
    },
    clearAll() {
        // 清楚全部缓存信息
        window.localStorage.clear()
    }
}