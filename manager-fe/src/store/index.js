/**
 * @description Vuex状态管理
 * @author ZiSummer
 */
import {createStore} from "vuex";
import mutations from './mutations'
import storage from "../utils/storage";

const state = {
    userInfo: storage.getItem("userInfo") || {},    // 获取用户信息
    menuList: storage.getItem("menuList") || [],    // 获取菜单列表
    actionList: storage.getItem("actionList") || [],  // 获取按钮列表
    noticeCount: 0  // 获取待审批通知列表
}
// 创建一个store实例
export default createStore({
    state,
    mutations
})

