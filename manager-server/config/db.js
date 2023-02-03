/**
 * @description 数据库连接
 * @author ZiSummer
 */
const mongoose = require('mongoose')
const config = require('./index')
const log4js = require('../utils/log4j')

// 创建连接
mongoose.connect(config.URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// 获取连接
const db = mongoose.connection

db.on('error', () => {
    log4js.error('***数据库连接失败***')
})

db.on('open', () => {
    log4js.info('***数据库连接成功***')
})