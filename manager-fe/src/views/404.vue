<template>
  <div class="exception">
    <div class="exception-img">
      <img src="../assets/images/404.jpeg" alt="">
    </div>
    <el-button @click="goHome" class="btn-home">回首页</el-button>
  </div>
</template>

<script>
export default {
  name: "404",
  methods: {
    goHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style lang="scss">
.exception {
  position: relative;

  .exception-img {
    img {
      width: 100%;
      height: 100vh;
    }
  }

  .btn-home {
    position: fixed;
    bottom: 100px;
    left: 50%;
    margin-left: -37px;
  }
}

</style>