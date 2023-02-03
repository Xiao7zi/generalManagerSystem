/**
 * @description API管理
 * @author ZiSummer
 */
import request from "../utils/request";

export default {
    // 登录接口
    login(params) {
        return request({
            url: '/users/login',
            method: 'post',
            data: params,
        })
    },
    // 获取待审批通知数量
    noticeCount() {
        return request({
            url: '/leave/count',
            method: 'get',
            data: {},
        })
    },
    // 获取菜单列表
    getMenuList(params) {
        return request({
            url: '/menu/list',
            method: 'get',
            data: params
        })
    },
    // 获取权限列表
    getPermissionList() {
        return request({
            url: '/users/getPermissionList',
            method: 'get',
            data: {}
        })
    },
    // 获取用户列表
    getUserList(params) {
        return request({
            url: '/users/list',
            method: 'get',
            data: params
        })
    },
    // 获取所有用户列表
    getAllUserList() {
        return request({
            url: '/users/all/list',
            method: 'get',
            data: {},
        })
    },
    // 删除单个用户
    userDel(params) {
        return request({
            url: '/users/delete',
            method: 'post',
            data: params
        })
    },
    // 获取角色名称列表
    getRoleAllList() {
        return request({
            url: '/roles/allList',
            method: 'get',
            data: {},
        })
    },
    // 获取角色列表
    getRoleList(params) {
        return request({
            url: '/roles/list',
            method: 'get',
            data: params,
        })
    },
    // 获取部门列表
    getDeptList(params) {
        return request({
            url: '/dept/list',
            method: 'get',
            data: params,
        })
    },
    // 部门 创建/编辑/删除
    deptOperate(params) {
        return request({
            url: '/dept/operate',
            method: 'post',
            data: params,
        })
    },
    // 创建用户
    userSubmit(params) {
        return request({
            url: '/users/operate',
            method: 'post',
            data: params
        })
    },
    // 菜单提交
    menuSubmit(params) {
        return request({
            url: '/menu/operate',
            method: 'post',
            data: params
        })
    },
    // 角色创建/编辑/删除
    roleOperate(params) {
        return request({
            url: '/roles/operate',
            method: 'post',
            data: params,
        })
    },
    // 角色设置权限
    updatePermission(params) {
        return request({
            url: '/roles/update/permission',
            method: 'post',
            data: params,
        })
    },
    // 休假申请列表
    getApplyList(params) {
        return request({
            url: '/leave/list',
            method: 'get',
            data: params,
        })
    },
    // 创建/删除 申请单
    leaveOperate(params) {
        return request({
            url: '/leave/operate',
            method: 'post',
            data: params,
        })
    },
    // 审核
    leaveApprove(params) {
        return request({
            url: '/leave/approve',
            method: 'post',
            data: params,
        })
    },
}