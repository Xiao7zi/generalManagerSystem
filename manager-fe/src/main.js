import {createApp} from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from "./router";
import store from "./store";
import request from './utils/request'
import storage from './utils/storage'
import api from "./api";
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

console.log('环境变量 => ', import.meta.env);

// 创建 Vue 实例
const app = createApp(App)

// 在全局挂载
app.config.globalProperties.$request = request
app.config.globalProperties.$storage = storage
app.config.globalProperties.$api = api

// 注册全局图标
for (let [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

// 全局指令
// 第一个参数是 指令的名称
// 第二个是Object 里面定义指令相关的 钩子函数
app.directive('has', {
    // el：指令所绑定的元素，可以用来直接操作 DOM
    // binding：一个对象，包含传给指令的参数等 属性
    beforeMount: (el, binding) => {
        // 获取按钮权限
        const actionList = storage.getItem('actionList');
        // 指令的绑定值
        const value = binding.value
        // 判断列表中是否有对应的按钮权限标识
        const hasPermission = actionList.includes(value)

        // 如果没有该权限，先隐藏后删除该节点
        if (!hasPermission) {
            el.style = 'display: none;'
            // 宏任务，在DOM渲染完成后执行
            setTimeout(() => {
                el.parentNode.removeChild(el)
            }, 0)
        }
    }
})

// 使用插件和挂载
app
    .use(ElementPlus)
    .use(router)
    .use(store)
    .mount('#app')

