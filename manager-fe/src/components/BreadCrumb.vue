<template>
  <el-breadcrumb :separator-icon="ArrowRight">
    <el-breadcrumb-item
        v-for="(item, index) in breadList"
        :key="item.path"
    >
      <!--   只有一个代表着在首页   -->
      <router-link to="/welcome" v-if="index === 0">{{ item.meta.title }}</router-link>
      <!--   否则是有多个就展示多个   -->
      <span v-else>{{ item.meta.title }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script>
import {ArrowRight} from "@element-plus/icons-vue";

export default {
  name: "BreadCrumb",
  computed: {
    // 引入右箭头
    ArrowRight() {
      return ArrowRight
    },
    breadList() {
      // 一个数组，包含当前路由的所有嵌套路径片段的路由记录。路由记录就是 routes 配置数组中的对象副本 (还有在 children 数组)。
      return this.$route.matched
    }
  }
}
</script>

<style scoped>

</style>