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
    this.authedKeys = {keys:{}, hashs:{}};
    this.admin = null;
    this.bc = new BC(this.did);
    this.isDoorOpened = false;
};

Door.prototype.init = function() {
    var self = this;
    BC.getPrivateKey(self.did, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log('pubkey: ' + self.did);
            console.log('prvKey: ' + response.privateKey);
        }
    });
    this.redisClient.smembers('auth', function(error, keys) {
        if (error) {
            console.log("can't load the auth info.");
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
            console.log('The door is ' + (self.isDoorOpened ? 'opened' : 'closed'));
        }
    });

    this.redisClient.get('admin', function(error, s) {
        if (error) {
            console.log('Mush has an admin!');
            process.exit(1);
        } else {
            self.admin = s;
            console.log('The admin is: ' + self.admin);
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
                if (message.from in self.authedKeys.hashs) {
                    if (message.message == 'open') {
                        if (self.isDoorOpened) {
                            console.log('The door has been opened.');
                        } else {
                            self.isDoorOpened = true;
                            self.redisClient.set('doorStatus', self.isDoorOpened, function(error, redisResp) {
                                if (error) {
                                    console.log(error + ' ' + redisResp);
                                } else {
                                    console.log('The door is opened.');
                                }
                            });
                        }
                    } else if (message.message == 'close') {
                        if (!self.isDoorOpened) {
                            console.log('The door has been closed.');
                        } else {
                            self.isDoorOpened = false;
                            self.redisClient.set('doorStatus', self.isDoorOpened, function(error, redisResp) {
                                if (error) {
                                    console.log(error + ' ' + redisResp);
                                } else {
                                    console.log('The door is closed.');
                                }
                            });
                        }
                    }
                } else {
                    console.log('The device isn`t authenticated with hashname: ' + message.from);
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
                    console.log('unknown cmd: ' + JSON.stringify(info));
                }
            } else {
                console.log('unknown cmd: ' + JSON.stringify(info));
            }
        } else {
            console.log('Isn\'t admin, Can\'t exec cmd: ' + JSON.stringify(info));
        }
    });
};

Door.prototype.transferKey = function(key) {
    var self = this;
    if (self.admin == key) {
        console.log('Ignore transfering right to self');
    } else {
        self.redisClient.set('admin', key, function(error, redisResp) {
            if (error) {
                console.log(error);
            } else {
                self.admin = key;
                console.log('Now, the admin becomes: ' + self.admin);
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
            self.redisClient.sadd('auth', [key], function(err, redisResp) {
                if (err) {
                    console.log(err + ' ' + redisResp);
                } else {
                    console.log(key + ' is authenticated');
                    console.log('The authed keys for now: ' + Object.keys(keyMap.keys))
                }
            });
        }
    });
};

Door.prototype.unauthKey = function(key, keyMap) {
    var hash = keyMap.keys[key];
    delete keyMap.keys[key];
    delete keyMap.hashs[hash];
    this.redisClient.srem('auth', [key], function(error, redisResp) {
        if (error) {
            console.log(error + ' ' + redisResp);
        } else {
            console.log(key + ' is unauthenticated');
        }
    });
};

Door.prototype.initKeys = function(initAuthedKeys) {
    var self = this;
    Async.map(initAuthedKeys, this.bc.getAccountInfo, function(error, completedKeys) {
        for (var i = 0; i < completedKeys.length; ++i) {
            self.authedKeys.keys[completedKeys[i].name] = completedKeys[i].publicData;
            self.authedKeys.hashs[completedKeys[i].publicData] = completedKeys[i].name;
        }
        console.log('The authed keys: ' + Object.keys(self.authedKeys.keys));
    });
};
