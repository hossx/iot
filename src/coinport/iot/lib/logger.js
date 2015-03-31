/**
 *Copyright 2014 Coinport Inc. All Rights Reserved.
 *Author: YangLi--ylautumn84@gmail.com
 *Filename: logger.js
 *Description:
 */

//TRACE,
//DEBUG,
//INFO,
//WARN,
//ERROR,
//FATAL

var log4js = require('log4js');

log4js.configure({
    appenders: [
        {
            type: 'console',
            category: "console"
        }, //控制台输出
        {
            type: "dateFile",
            filename: 'bc.log',
            pattern: "-yyyy-MM-dd",
            alwaysIncludePattern: true,
            category: "1000"
        },
    ],
    replaceConsole: true, //替换console.log
    levels:{
        1000: 'INFO',
    }
});

exports.logger = function(currency){
    var dateFileLog = log4js.getLogger(currency);
    return dateFileLog;
}

