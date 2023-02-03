<template>
  <template v-for="menu in userMenu">
    <el-sub-menu
        v-if="
        menu.children &&
        menu.children.length > 0 &&
        menu.children[0].menuType == '1'
      "
        :key="menu._id"
        :index="menu.path"
    >
      <template #title>
        <el-icon>
          <component :is="menu.icon.split('-').pop()"/>
        </el-icon>
        <span>{{ menu.menuName }}</span>
      </template>
      <!-- 递归 -->
      <tree-menu :user-menu="menu.children"/>
    </el-sub-menu>
    <!-- menuType: 1是菜单 2是按钮 -->
    <el-menu-item
        v-else-if="menu.menuType == '1'"
        :index="menu.path"
        :key="menu._id"
    >{{ menu.menuName }}
    </el-menu-item>
  </template>
</template>

<script>
import {Setting, Promotion} from "@element-plus/icons-vue";

export default {
  name: "TreeMenu",
  props: {
    userMenu: {
      type: Array,
      default() {
        return []
      },
    },
  },
  components: {
    Setting,
    Promotion
  }
};
</script>