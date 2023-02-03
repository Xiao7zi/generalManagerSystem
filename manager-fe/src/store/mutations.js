/**
 * @description Mutations业务层数据提交
 * @author ZiSummer
 */
import Storage from "../utils/storage";

export default {
    saveUserInfo(state, userInfo) {
        state.userInfo = userInfo
        Storage.setItem('userInfo', userInfo)
    },
    saveUserMenu(state, menuList) {
        state.menuList = menuList
        Storage.setItem('menuList', menuList)
    },
    saveUserAction(state, actionList) {
        state.actionList = actionList
        Storage.setItem('actionList', actionList)
    },
    saveNoticeCount(state, noticeCount) {
        state.noticeCount = noticeCount
        Storage.setItem('noticeCount', noticeCount)
    }
}