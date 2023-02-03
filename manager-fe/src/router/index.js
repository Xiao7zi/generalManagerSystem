import {createRouter, createWebHashHistory} from "vue-router";
import Home from "../components/Home.vue";
import storage from "../utils/storage";
import API from '../api'
import util from "../utils/utils";

const routes = [
    {
        name: 'home',
        path: '/',
        // meta元数据
        meta: {
            // 更改标题
            title: '首页'
        },
        component: Home,
        // 重定向
        redirect: '/welcome',
        // 子组件
        children: [
            {
                name: 'welcome',
                path: '/welcome',
                meta: {
                    title: '欢迎体验Vue3全栈课程'
                },
                // 按需加载
                component: () => import('./../views/Welcome.vue'),
            }
        ]
    },
    {
        name: 'login',
        path: '/login',
        meta: {
            title: '登录'
        },
        component: () => import('./../views/Login.vue')
    },
    {
        name: '404',
        path: '/404',
        meta: {
            title: '页面不存在'
        },
        component: () => import('./../views/404.vue')
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})


// 动态加载路由
async function loadAsyncRoutes() {
    // 获取用户信息
    const userInfo = storage.getItem('userInfo') || {}
    // 是否有token
    if (userInfo.token) {
        try {
            // 调接口而不使用 storage 防止被篡改
            const {menuList} = await API.getPermissionList()
            // 根据树形菜单列表生成 路由列表
            const routes = util.generateRoute(menuList)
            // 获取views文件夹下所有组件的名称 和 路径
            const modules = import.meta.glob('../views/*.vue')
            // 给 Home 添加 子路由
            routes.map(route => {
                const url = `../views/${route.component}.vue`
                route.component = modules[url]
                router.addRoute("home", route)
            })
        } catch (error) {

        }
    }
}

await loadAsyncRoutes()

// 导航守卫
router.beforeEach((to, from, next) => {
    if (checkPermission(to.path)) {
        // 更改页面标题
        document.title = to.meta.title
        next()
    } else {
        next('/404')
    }
})

// 判断当前地址是否可以访问
function checkPermission(path) {
    // 判断要跳转的路径 是否在 所有路由中
    const hasPermission = router.getRoutes().filter(route => route.path == path).length;
    return !!hasPermission;
}

export default router