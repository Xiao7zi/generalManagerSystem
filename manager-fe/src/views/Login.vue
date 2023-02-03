<template>
  <div class="login-wrapper">
    <div class="modal">
      <el-form :model="user" status-icon :rules="rules" ref="userFormRef">
        <div class="title">火星</div>
        <!-- Prop一定要填，不然校验不生效 -->
        <el-form-item prop="userName">
          <el-input type="text" prefix-icon="User" v-model="user.userName"/>
        </el-form-item>
        <el-form-item prop="userPwd">
          <el-input type="password" prefix-icon="View" v-model="user.userPwd"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="btn-login" @click="login(userFormRef)">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive} from "vue";
import {useStore} from "vuex";
import {useRouter} from "vue-router";
import storage from "../utils/storage";
import api from '../api'
import util from "../utils/utils";
import API from "../api";

// 创建响应式对象
const user = reactive({
  userName: '',
  userPwd: ''
})
// rules 无需使用响应式
const rules = {
  userName: [
    {
      required: true, message: '请输入用户名', trigger: 'blur'
    }
  ],
  userPwd: [
    {
      required: true, message: '请输入密码', trigger: 'blur'
    }
  ]
}
// 获取 el-form 的 DOM节点
const userFormRef = ref()
const store = useStore();
const router = useRouter();

function login(formRef) {
  // 输入校验
  formRef.validate((valid) => {
    if (valid) {
      // 发送请求
      api.login(user).then(async (res) => {
        // 登录成功
        store.commit("saveUserInfo", res);
        // 重新加载路由
        await loadAsyncRoutes()
        await router.push("/welcome");
      });
    } else {
      return false;
    }
  });
}

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
</script>

<style lang="scss">
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9fcff;
  width: 100vw;
  height: 100vh;

  .modal {
    width: 500px;
    padding: 50px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 0 10px 3px #c7c9cb4d;

    .title {
      font-size: 50px;
      line-height: 1.5;
      text-align: center;
      margin-bottom: 30px;
    }

    .btn-login {
      width: 100%;
    }
  }
}
</style>