<template>
  <div class="basic-layout">
    <div :class="['nav-side', isCollapse ? 'fold' : 'unfold']">
      <!-- 系统LOGO -->
      <div class="logo">
        <img src="./../assets/logo.png"/>
        <span>Manager</span>
      </div>
      <!-- 导航菜单 -->
      <el-menu
          :default-active="activeMenu"
          background-color="#001529"
          text-color="#fff"
          router
          :collapse="isCollapse"
          class="nav-menu"
      >
        <tree-menu :user-menu="userMenu"/>
      </el-menu>
    </div>
    <div :class="['content-right', isCollapse ? 'fold' : 'unfold']">
      <div class="nav-top">
        <div class="nav-left">
          <div class="menu-fold" @click="toggle">
            <el-icon>
              <Fold/>
            </el-icon>
          </div>
          <div class="bread">
            <bread-crumb/>
          </div>
        </div>
        <div class="user-info">
          <el-badge
              :is-dot="noticeCount > 0"
              class="notice"
              type="danger"
              @click="$router.push('/audit/approve')"
          >
            <el-icon class="notice-icon">
              <Bell/>
            </el-icon>
          </el-badge>
          <el-dropdown @command="handleLogout">
            <span class="user-link">
              {{ userInfo.userName }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="email"
                >邮箱：{{ userInfo.userEmail }}
                </el-dropdown-item
                >
                <el-dropdown-item command="logout">退出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="wrapper">
        <!-- 子路由 -->
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import TreeMenu from "./TreeMenu.vue";
import BreadCrumb from "./BreadCrumb.vue";

export default {
  name: "Home",
  components: {BreadCrumb, TreeMenu},
  data() {
    return {
      isCollapse: false,
      userInfo: this.$store.state.userInfo,
      noticeCount: 0,
      userMenu: [],
      activeMenu: window.location.hash.slice(1)   // 获取路径
    };
  },
  computed: {
    noticeCount() {
      return this.$store.state.noticeCount
    }
  },
  mounted() {
    this.getNoticeCount();
    this.getMenuList();
  },
  methods: {
    // 是否展开
    toggle() {
      this.isCollapse = !this.isCollapse;
    },
    // 登出
    handleLogout(key) {
      if (key === "email") return;
      this.$store.commit("saveUserInfo", "");
      this.userInfo = {};
      this.$router.push("/login");
    },
    // 获取待审批数量
    async getNoticeCount() {
      try {
        const count = await this.$api.noticeCount();
        this.$store.commit('saveNoticeCount', count)
      } catch (error) {
        console.error(error);
      }
    },
    // 获取菜单列表
    async getMenuList() {
      try {
        const {menuList, actionList} = await this.$api.getPermissionList();
        this.userMenu = menuList
        // 提交到数据仓库，存储在本地 localStorage 中
        this.$store.commit('saveUserMenu', menuList)
        this.$store.commit('saveUserAction', actionList)
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>

<style lang="scss">
.basic-layout {
  position: relative;
  .nav-side {
    position: fixed;
    width: 200px;
    height: 100vh;
    background-color: #001529;
    color: #fff;
    overflow-x: hidden;
    overflow-y: auto;
    transition: width 0.5s;

    .logo {
      display: flex;
      align-items: center;
      font-size: 18px;
      height: 50px;

      img {
        margin: 0 16px;
        width: 32px;
        height: 32px;
      }
    }
    .nav-menu {
      height: calc(100vh - 50px);
      border-right: none;
    }
    // 合并
    &.fold {
      width: 64px;
    }
    // 展开
    &.unfold {
      width: 200px;
    }
  }
  .content-right {
    margin-left: 200px;
    transition: margin-left .5s;
    // 合并
    &.fold {
      margin-left: 64px;
    }
    // 展开
    &.unfold {
      margin-left: 200px;
    }
    .nav-top {
      height: 50px;
      line-height: 50px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      padding: 0 20px;
      .nav-left {
        display: flex;
        align-items: center;
        .menu-fold {
          height: 18px;
          line-height: 18px;
          margin-right: 15px;
          font-size: 18px;
        }
      }
      .user-info {
        display: flex;
        align-items: center;
        .notice {
          line-height: 25px;
          margin-right: 15px;
          cursor: pointer;

          .notice-icon {
            position: relative;
            top: 2px;
          }
        }
        .user-link {
          cursor: pointer;
          color: #409eff;
        }
      }
    }
    .wrapper {
      background: #eef0f3;
      padding: 20px;
      height: calc(100vh - 50px);
      .main-page {
        background: #fff;
        height: 100%;
      }
    }
  }
}
</style>