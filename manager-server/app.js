const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const logger = require('koa-logger')
const bodyparser = require('koa-bodyparser')
const log4js = require("./utils/log4j.js");
const router = require('koa-router')()
const koaJwt = require('koa-jwt')
const util = require('./utils/util')

// 引入路由
const users = require('./routes/users')
const menus = require('./routes/menus')
const roles = require('./routes/roles')
const depts = require('./routes/depts')
const leaves = require('./routes/leaves')

// error handler
onerror(app)

// 数据库连接
require('./config/db')

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`)
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`)
  await next().catch(err => {
    // token校验失败
    if (err.status == '401') {
      // 状态码设置为 200 OK
      ctx.status = 200
      ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR)
    } else {
      throw err
    }
  })
})

// 使用koa-jwt中间件：jwt拦截token并校验
// 校验失败会返回401, {"error":"Authentication Error"}
app.use(koaJwt({
  // 填写秘钥
  secret: 'imooc'
}).unless({
  // 不需要校验的接口
  path: [/^\/api\/users\/login/]
}))

// routes
// 前缀
router.prefix('/api')

router.use(users.routes(), users.allowedMethods())
router.use(menus.routes(), menus.allowedMethods())
router.use(roles.routes(), roles.allowedMethods())
router.use(depts.routes(), depts.allowedMethods())
router.use(leaves.routes(), leaves.allowedMethods())

app.use(router.routes(), router.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
  log4js.error(err.stack)
});

module.exports = app
