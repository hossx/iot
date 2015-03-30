/**
 * Copyright 2015 Coinport Inc. All Rights Reserved.
 * Author: yangli@coinport.com (Li Yang)
 */
'use strict'
var Async                         = require('async'),
    Events                        = require('events'),
    Util                          = require("util"),
    http                          = require('http'),
    Redis                         = require('redis');

/**
 * Send the bts tx with auth info(memo)
 * @param {String} from The sender's readable name
 * @param {String} to The receiver's readable name
 * @param {String} memo Contains auth info
 * @return {boolean} Success or Fail
 */

var BC = module.exports.BC = function() {
    Events.EventEmitter.call(this);

    this.rpcUser = "test";
    this.rpcPass = "test";
    this.httpOptions = {
      host: "192.168.0.5",
      path: '/rpc',
      method: 'POST',
      timeout:10000,
      port: 9989,
      agent: this.disableAgent ? false : undefined,                   
    };
    this.redis || (this.redis = Redis.createClient('6379', '127.0.0.1'));
    this.redis.on('connect'     , this.logFunction('connect'));
    this.redis.on('ready'       , this.logFunction('ready'));
    this.redis.on('reconnecting', this.logFunction('reconnecting'));
    this.redis.on('error'       , this.logFunction('error'));
    this.redis.on('end'         , this.logFunction('end'));
    this.checkInterval || (this.checkInterval = 5000);
    this.lastIndex = 'bc_last_index';
    this.walletName = "";
    this.walletPassPhrase = "";
};

Util.inherits(BC, Events.EventEmitter);

BC.prototype.logFunction = function log(type) {
    var self = this;
    return function() {
        console.log(type, 'btsx crypto_proxy');
    };
};
BC.EventType = {
    NEW_INFO : 'new_info'  // emitted data like this: {from: xxx, memo: xxx}
};

BC.TX_AMOUNT = 1;
BC.VALUE_UNIT = "BTS";

BC.prototype.httpRequest_ = function(request, callback) {
    var self = this;
    var err = null;
    var auth = Buffer(self.rpcUser + ':' + self.rpcPass).toString('base64');
    var req = http.request(self.httpOptions, function(res) {
        var buf = '';

        res.on('data', function(data) {
            buf += data; 
        });

        res.on('end', function() {
            if(res.statusCode == 401) {
                console.log(new Error('bc JSON-RPC connection rejected: 401 unauthorized'));
                return;
            }

            if(res.statusCode == 403) {
                console.log(new Error('bc JSON-RPC connection rejected: 403 forbidden'));
                return;
            }

            if(err) {
                console.log('httpRequest error: ', err);
                return;
            }

            try {
                var pos = buf.indexOf('{');
                var body = buf.substring(pos, buf.length);
                var parsedBuf = JSON.parse(body.data || body);
                callback(null, parsedBuf);
            } catch(e) {
                console.log("e.stack", e.stack);
                console.log('HTTP Status code:' + res.statusCode);
                return;
            }
        });
    });

    req.on('error', function(e) {
        var err = new Error('Could not connect to bc via RPC: '+e.message);
        console.log(err);
    });

    req.setHeader('Accept', 'application/json, text/plain, */*');
    req.setHeader('Connection', 'keep-alive');
    req.setHeader('Content-Length', request.length);
    req.setHeader('Content-Type', 'application/json;charaset=UTF-8');
    req.setHeader('Authorization', 'Basic ' + auth);
    req.setHeader('Accept-Encoding', 'gzip,deflate,sdch');
    req.write(request);
    req.end();
}

BC.prototype.storeData = function(from, to, memo, callback) {
    var self = this;
    var params = [];
    params.push(BC.TX_AMOUNT);
    params.push(BC.VALUE_UNIT);
    params.push(from);
    params.push(to);
    params.push(memo);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_transfer", params: params};
    var request = JSON.stringify(requestBody);
    console.log("walletTransfer_ request: ", request);
    var response = new Object();
    self.httpRequest_(request, function(error, result) {
        console.log("walletTransfer_ result: ", result);
        if (!error && result.result) {
            response.flag = "SUCCESSED";
            response.txid = result.result.record_id;
            callback(null, response);
        } else {
            console.log("error: ", error);
            response.flag = "FAILED";
            callback("FAILED", response);
        }
    });
};

/**
 * Get the bts account info
 * @param {String} name The readable name of account
 * @return {String} publicData in bts
 */
BC.prototype.getAccountInfo = function(name, callback) {
    var self = this;
    var params = [];
    params.push(name);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "blockchain_get_account", params: params};
    var request = JSON.stringify(requestBody);
    console.log("getAccountInfo_ request: ", request);
    var response = new Object();
    self.httpRequest_(request, function(error, result) {
        console.log("getAccountInfo result: ", result);
        if (!error && result.result) {
            response.flag = "SUCCESSED";
            response.name = result.result.name;
            response.publicData = result.result.public_data;
            callback(null, response);
        } else {
            console.log("error: ", error);
            response.flag = "FAILED";
            callback("FAILED", response);
        }
    });
};

BC.updateAccount = function(name, publicData, callback) {
    var self = this;
    var params = [];
    params.push(name);
    params.push(name);
    params.push(publicData);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_account_update_registration", params: params};
    var request = JSON.stringify(requestBody);
    console.log("updatePublicData request: ", request);
    var response = new Object();
    self.httpRequest_(request, function(error, result) {
        console.log("updatePublicData result: ", result);
        if (!error && result.result) {
            response.flag = "SUCCESSED";
            response.publicData = result.result.record_id;
            callback(null, response);
        } else {
            console.log("error: ", error);
            response.flag = "FAILED";
            callback("FAILED", response);
        }
    });
};

BC.prototype.walletOpen_ = function(callback) {
    var self = this;
    var params = [];
    params.push(self.walletName);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_open", params: params};
    var request = JSON.stringify(requestBody);
    console.log("walletOpen_ request: ", request);
    self.httpRequest_(request, function(error, result) {
        if (!error) {
            callback(null, result.result);
        } else {
            console.log("wallet_open error: ", error);
            callback(error, null);
        }
    });
};

BC.prototype.walletUnlock_ = function(callback) {
    var self = this;
    console.log("Enter into walletUnlock_!");
    var params = [];
    params.push(3600);
    params.push(self.walletPassPhrase);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_unlock", params: params};
    var request = JSON.stringify(requestBody);
    self.httpRequest_(request, function(error, result) {
        if (!error) {
            console.log("walletUnlock_: ", result);
            callback(null, result.result);
        } else {
            console.log("wallet_unlock error: ", error);
            callback(error, null);
        }
    });
};

BC.prototype.initWallet_ = function(callback) {
    var self = this;
    if (self.walletName && self.walletPassPhrase) {
        Async.series([
            function(cb) {
                self.walletOpen_.bind(self)(cb)},
            function(cb) {
                self.walletUnlock_.bind(self)(cb)}
        ], function(error, result) {
            if (error) {
                console.log("initWallet", error);
                callback(error, null);
            } else {
                console.log("initWallet success!");
                callback(null, result);
            }
        });
    } else {
        console.log("no password!");
        callback("wallet info lose!", null);
    }
};

BC.prototype.start = function() {
    var self = this;
    self.initWallet_(function(error, reuslt) {
        if (!error) {
            self.checkBlockAfterDelay_();
            self.unlockWalletAfterDelay_();
        } else {
            console.log("init wallet failed");
        }
    });
};

BC.prototype.checkBlock_ = function() {
    var self = this;
    self.getNextCCBlock_(function(error, result){
        if (!error) {
            self.redis.set(self.lastIndex, result, function(errorRedis, retRedis) {
                if (!errorRedis) {
                    self.checkBlockAfterDelay_(0);
                } else {
                    console.log("checkBlock_errorRedis: ", errorRedis);
                    self.checkBlockAfterDelay_(1000);
                }
            });
        } else {
            self.checkBlockAfterDelay_();
        }
   });
};

BC.prototype.getNextCCBlock_ = function(callback) {
    var self = this;
    Async.compose(self.getWalletTransactionByIndex_.bind(self), 
        self.getLastIndex_.bind(self))(callback);
};

BC.prototype.getLastIndex_ = function(callback) {
    var self = this;
    self.redis.get(self.lastIndex, function(error, index) {
        var numIndex = Number(index);
        if (!error && numIndex) {
            callback(null, numIndex);
        } else {
            callback(null, -1);
        }
    });
};

BC.prototype.getWalletTransactionByIndex_ = function(height, callback) {
    var self = this;
    console.log("Enter into getWalletTransactionByIndex_");
    var params = [];
    params.push("cpdoor");
    params.push("BTS");
    params.push(0);
    if (height == -1) {
        params.push(0);
    } else {
        params.push(height);
    }
    self.getBlockCount_(function(error, count) {
        if (error) {
            callback(error);
        } else {
            if (height == count) {
                console.log('no new block found');
                callback('no new block found');
            } else {
                params.push(height);
                var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_account_transaction_history", params: params};
                var request = JSON.stringify(requestBody);
                console.log("request: ", request);
                self.httpRequest_(request, function(error, result) {
                    if(!error) {
                        console.log("getWalletTransactionByIndex_ result: ", result);
                        var response = [];
                        for (var i = 0; i < result.result.length; i++) {
                            for (var j = 0; j < result.result[i].ledger_entries.length; j++) {
                                var tx = new Object();
                                tx.from = result.result[i].ledger_entries[j].from_account;
                                tx.memo = result.result[i].ledger_entries[j].memo;
                                console.log("EMIT!!!!!!!!!!!!!!!%j", tx);
                                self.emit(BC.EventType.NEW_INFO, tx);
                                response.push(tx);
                            }
                        }
                        callback(null, count);
                    } else {
                        console.log("error: ", error);
                        callback(error, null);
                    }
                });
            }
        }
    });
}

BC.prototype.getBlockCount_ = function(callback) {
    var self = this;
    var requestBody = {jsonrpc: '2.0', id: 2, method: "blockchain_get_blockcount", params: []};
    var request = JSON.stringify(requestBody);
    console.log("getBlockCount_ request: ", request);
    self.httpRequest_(request, function(error, result) {
        console.log("getBlockCount_ result: ", result);
        callback(error, result.result);
    });
};

BC.prototype.checkBlockAfterDelay_ = function(opt_interval) {
    var self = this;
    var interval = self.checkInterval;
    opt_interval != undefined && (interval = opt_interval)
    setTimeout(self.checkBlock_.bind(self), interval);
};

BC.prototype.unlockWalletAfterDelay_ = function(opt_interval) {
    var self = this;
    var interval = 900000;
    self.walletUnlock_.bind(self)(function(error, result){                                                   
         if (!error) {
             setTimeout(self.unlockWalletAfterDelay_.bind(self), interval);
         } else {
             console.log("unlockWalletAfterDelay_ error: ", error);
             setTimeout(self.unlockWalletAfterDelay_.bind(self), 1000);
         }
    });
};

