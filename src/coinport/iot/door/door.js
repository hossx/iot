/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: c@coinport.com (Chao Ma)
 */

var Async = require('async'),
    BC    = require('../lib/bc').BC,
    Redis = require('redis'),
    TH    = require('../lib/th').TH;

var Door = module.exports.Door = function(deviceId) {
    this.did = deviceId;
    this.endpoint = {};
    this.redisClient = Redis.createClient(6379, 'localhost');
    this.authedKeys = {keys:{}, hashs:{}, remb:{}};
    this.admin = null;
    this.bc = new BC(this.did);
    this.isDoorOpened = false;
    this.doorOk = false;
    this.adminOk = false;
    this.authOk = false;
};

Door.prototype.printStats = function() {
    if (this.doorOk && this.adminOk && this.authOk) {
        console.log();
        console.log('\n======================================================' +
            '\n锁状态：\t\t' + (this.isDoorOpened ? '打开' : '关闭') +
            '\n管理员：\n\t\t' + this.admin +
            '\n已授权钥匙：\n\t\t' + Object.keys(this.authedKeys.keys).join('\n\t\t') +
            '\n======================================================');
    }
};

Door.prototype.init = function() {
    var self = this;
    BC.getPrivateKey(self.did, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log('\n公钥: \t' + self.did + '\n' + '私钥: \t' + response.privateKey);
        }
    });
    this.redisClient.smembers('auth', function(error, keys) {
        if (error) {
            console.log("无法获取认证钥匙信息");
            process.exit(1);
        } else {
            if (keys.length != 0) {
                self.initKeys(keys);
            }
        }
    });

    this.redisClient.get('doorStatus', function(error, s) {
        if (error) {
            console.log(error);
        } else {
            self.isDoorOpened = (s == 'true');
            self.doorOk = true;
            self.printStats();
        }
    });

    this.redisClient.get('admin', function(error, s) {
        if (error) {
            console.log('锁必须有初始管理员');
            process.exit(1);
        } else {
            self.admin = s;
            self.adminOk = true;
            self.printStats();
        }
    });

    this.listenOnBc();

    this.redisClient.get(this.did, function(error, endpointStr) {
        if (error) {
            console.log(error);
        } else {
            self.endpoint = JSON.parse(endpointStr);
            self.th = new TH(self.endpoint);
            self.th.on(TH.EventType.MESH_READY, function() {
                self.th.listen();
            });
            self.th.on(TH.EventType.NEW_MESSAGE, function(message) {
                console.log('建立连接到：\t' + self.authedKeys.remb[message.from])
                if (message.from in self.authedKeys.hashs) {
                    console.log('收到命令：\t' + message.message + '\n' + '来自钥匙：\t' + self.authedKeys.remb[message.from]);
                    if (message.message == 'open') {
                        if (self.isDoorOpened) {
                            console.log('锁已经处于打开状态');
                        } else {
                            self.isDoorOpened = true;
                            self.redisClient.set('doorStatus', self.isDoorOpened, function(error, redisResp) {
                                if (error) {
                                    console.log(error + ' ' + redisResp);
                                } else {
                                    self.printStats();
                                }
                            });
                        }
                    } else if (message.message == 'close') {
                        if (!self.isDoorOpened) {
                            console.log('锁已经处于关闭状态');
                        } else {
                            self.isDoorOpened = false;
                            self.redisClient.set('doorStatus', self.isDoorOpened, function(error, redisResp) {
                                if (error) {
                                    console.log(error + ' ' + redisResp);
                                } else {
                                    self.printStats();
                                }
                            });
                        }
                    }
                } else {
                    console.log('此钥匙未通过授权: ' + self.authedKeys.remb[message.from]);
                }
            });
        }
    });
};

Door.prototype.listenOnBc = function() {
    var self = this;
    this.bc.start()
    this.bc.on(BC.EventType.NEW_INFO, function(info) {
        if (info.from == self.admin) {
            console.log('收到命令：\t' + info.memo + '\n' + '来自钥匙：\t' + info.from);
            var parsedCmd = info.memo.split(' ');
            if (parsedCmd.length == 2) {
                cmd = parsedCmd[0];
                newKey = parsedCmd[1];
                if (cmd == 'auth') {
                    self.authKey(newKey, self.authedKeys);
                } else if (cmd == 'unauth') {
                    self.unauthKey(newKey, self.authedKeys);
                } else if (cmd == 'transfer') {
                    self.transferKey(newKey);
                } else {
                    console.log('未知命令: ' + info.memo);
                }
            } else {
                console.log('未知命令: ' + info.memo);
            }
        } else {
            console.log('非管理员无法执行命令: ' + info.memo);
        }
    });
};

Door.prototype.transferKey = function(key) {
    var self = this;
    if (self.admin == key) {
        self.printStats();
    } else {
        self.redisClient.set('admin', key, function(error, redisResp) {
            if (error) {
                console.log(error);
            } else {
                self.admin = key;
                self.printStats();
            }
        });
    }
};

Door.prototype.authKey = function(key, keyMap) {
    var self = this;
    this.bc.getAccountInfo(key, function(error, completeKey) {
        if (error) {
            console.log(error);
        } else {
            keyMap.keys[completeKey.name] = completeKey.publicData;
            keyMap.hashs[completeKey.publicData] = completeKey.name;
            keyMap.remb[completeKey.publicData] = completeKey.name;
            self.redisClient.sadd('auth', [key], function(err, redisResp) {
                if (err) {
                    console.log(err + ' ' + redisResp);
                } else {
                    self.printStats();
                }
            });
        }
    });
};

Door.prototype.unauthKey = function(key, keyMap) {
    var self = this;
    var hash = keyMap.keys[key];
    delete keyMap.keys[key];
    delete keyMap.hashs[hash];
    this.redisClient.srem('auth', [key], function(error, redisResp) {
        if (error) {
            console.log(error + ' ' + redisResp);
        } else {
            self.printStats();
        }
    });
};

Door.prototype.initKeys = function(initAuthedKeys) {
    var self = this;
    Async.map(initAuthedKeys, this.bc.getAccountInfo, function(error, completedKeys) {
        for (var i = 0; i < completedKeys.length; ++i) {
            self.authedKeys.keys[completedKeys[i].name] = completedKeys[i].publicData;
            self.authedKeys.hashs[completedKeys[i].publicData] = completedKeys[i].name;
            self.authedKeys.remb[completedKeys[i].publicData] = completedKeys[i].name;
        }
        self.authOk = true;
        self.printStats();
    });
};
