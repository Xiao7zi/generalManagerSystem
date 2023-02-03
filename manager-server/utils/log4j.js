/**
 * @description 日志存储
 * @author ZiSummer
 */

// 获取log4js实例
const log4js = require("log4js");

// 定义日志级别
const levels = {
    'trace': log4js.levels.TRACE,
    'debug': log4js.levels.DEBUG,
    'info': log4js.levels.INFO,
    'warn': log4js.levels.WARN,
    'error': log4js.levels.ERROR,
    'fatal': log4js.levels.FATAL,
}

// 配置：定义追加器 -> 日志出口
log4js.configure({
    appenders: {
        // 输出到控制台
        console: {type: 'console'},
        info: {
            // 输出到文件
            type: 'file',
            filename: "logs/all-logs.log"
        },
        error: {
            // 输出为每日日志
            type: "dateFile",
            filename: "logs/log",
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true// 设置文件名称为 filename + pattern
        }
    },
    // 通过 categories 来选择要输出日志的类别
    categories: {
        // 默认
        default: {appenders: ["console"], level: "debug"},
        info: {
            // 指定输出的追加器
            appenders: ["console", "info"],
            level: 'info'
        },
        // 报错
        error: {
            appenders: ["console", "error"],
            level: 'error'
        }
    }
})

/**
 * @description 日志输出，level为 debug
 * @param {String} content
 */
exports.debug = (content) => {
    let logger = log4js.getLogger()
    logger.level = levels.debug
    logger.debug(content)
}

/**
 * @description 日志输出，level为 info
 * @param {String} content
 */
exports.info = (content) => {
    let logger = log4js.getLogger('info')
    logger.level = levels.info
    logger.info(content)
}

/**
 * @description 日志输出，level为 error
 * @param {String} content
 */
exports.error = (content) => {
    let logger = log4js.getLogger('error')
    logger.level = levels.error
    logger.error(content)
}