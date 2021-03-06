/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: c@coinport.com (Chao Ma)
 */

var BC = require('../lib/bc').BC,
    Redis = require('redis'),
    TH = require('../lib/th').TH,
    readline = require('readline');

var Key = module.exports.Key = function(deviceId) {
    this.did = deviceId;
    this.endpoint = {};
    this.redisClient = Redis.createClient(6379, 'localhost');
    this.bc = new BC(this.did);

    var self = this;
    this.redisClient.get(this.did, function(error, endpointStr) {
        if (error) {
            console.log(error);
        } else {
            self.endpoint = JSON.parse(endpointStr);
            self.th = new TH(self.endpoint);
        }
    });

    BC.getPrivateKey(self.did, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log('\n公钥:\t' + self.did);
            console.log('私钥:\t' + response.privateKey);
        }
    });
};

Key.prototype.processCmd = function(cmd) {
    var self = this;
    var parsedCmd = cmd.split(' ');
    if (parsedCmd.length >= 2) {
        var op = parsedCmd[0];
        var id = parsedCmd[1];
        var tid = parsedCmd[2];
        if (op == 'unlock' || op == 'lock') {
            self.bc.getAccountInfo(id, function(error, keyHash) {
                if (error || !keyHash) {
                    console.log('找不到此锁的hashname: ' + id);
                } else {
                    var hash = keyHash.publicData;
                    if (hash) {
                        self.th.sendMessage(hash, op);
                        console.log('\n建立连接到：\t' + id);
                        console.log('发送请求:\t' + op + ' 到: ' + id + '(' + hash + ')')
                    } else {
                        console.log('找不到此锁的hashname: ' + id);
                    }
                }
            });
        } else if (op == 'auth' || op == 'unauth') {
            self.bc.storeData(self.did, tid, op + ' ' + id, function(error, resp) {
                if (error) {
                    console.log(error);
                }
            });
            console.log('\n发送请求:\t' + op + ' ' + id + ' 到 ' + tid);
        } else if (op == 'transfer') {
            self.bc.storeData(self.did, tid, op + ' ' + id, function() {});
            console.log('\n发送请求:\t' + op + ' ' + id + ' 到 ' + tid);
        } else {
            console.log('unknown command');
        }
    } else {
        if (cmd != 'bye' && cmd.replace(/^\s\s*/, '').replace(/\s\s*$/, '') != '')
            console.log('unknown command');
    }
};

Key.prototype.repl = function() {
    var self = this;
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("command > ", function(cmd) {

        self.processCmd(cmd);

        rl.close();
        if (cmd != 'bye')
            self.repl();
        else
            process.exit(0);
    });
}
