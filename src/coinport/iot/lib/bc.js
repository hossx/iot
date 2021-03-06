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
    //Logger                        = require('./logger');

/**
 * Send the bts tx with auth info(memo)
 * @param {String} from The sender's readable name
 * @param {String} to The receiver's readable name
 * @param {String} memo Contains auth info
 * @return {boolean} Success or Fail
 */

var BC = module.exports.BC = function(deviceId) {
    Events.EventEmitter.call(this);

    this.did = deviceId;
    this.redis || (this.redis = Redis.createClient('6379', '127.0.0.1'));
    this.redis.on('connect'     , this.logFunction('connect'));
    this.redis.on('ready'       , this.logFunction('ready'));
    this.redis.on('reconnecting', this.logFunction('reconnecting'));
    this.redis.on('error'       , this.logFunction('error'));
    this.redis.on('end'         , this.logFunction('end'));
    this.checkInterval || (this.checkInterval = 5000);
    this.lastIndex = 'bc_last_index';
    this.walletName = "hoss";
    this.walletPassPhrase = "qwerqwer";
    //this.log = Logger.logger("1000");
};
Util.inherits(BC, Events.EventEmitter);

BC.rpcUser = "test";
BC.rpcPass = "test";
BC.httpOptions = {
    host: "127.0.0.1",
    path: '/rpc',
    method: 'POST',
    timeout:10000,
    port: 9989,
    agent: this.disableAgent ? false : undefined,
};

BC.prototype.logFunction = function log(type) {
    var self = this;
    return function() {
        //self.log.info("bc redis " + type);
    };
};
BC.EventType = {
    NEW_INFO : 'new_info'  // emitted data like this: {from: xxx, memo: xxx}
};

BC.TX_AMOUNT = 1;
BC.VALUE_UNIT = "BTS";

BC.httpRequest_ = function(request, callback) {
    var self = this;
    var err = null;
    var auth = Buffer(BC.rpcUser + ':' + BC.rpcPass).toString('base64');
    var req = http.request(BC.httpOptions, function(res) {
        var buf = '';

        res.on('data', function(data) {
            buf += data;
        });

        res.on('end', function() {
            if(res.statusCode == 401) {
                return;
            }

            if(res.statusCode == 403) {
                return;
            }

            if(err) {
                return;
            }

            try {
                var pos = buf.indexOf('{');
                var body = buf.substring(pos, buf.length);
                var parsedBuf = JSON.parse(body.data || body);
                callback(null, parsedBuf);
            } catch(e) {
                console.log(e);
                return;
            }
        });
    });

    req.on('error', function(e) {
        var err = new Error('Could not connect to bc via RPC: '+e.message);
        console.log("RPC ERROR!");
        callback("error", null);
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
    var response = new Object();
    BC.httpRequest_(request, function(error, result) {
        //self.log.info("storeData request: " + request);
        //self.log.info("strorData result: ", JSON.stringify(result));
        if (!error && result.result) {
            response.flag = "SUCCESSED";
            response.txid = result.result.record_id;
            BC.printTransaction (from, to, memo, response.txid);
            callback(null, response);
        } else {
            //self.log.error("strorData error: ", error);
            //self.log.error("strorData error: ", result);
            response.flag = "FAILED";
            callback("FAILED", response);
        }
    });
};

BC.printTransaction = function(from, to, memo, txid) {
    console.log('\x1B[90m');
    console.log('在块链存储信息');
    console.log('交易编号:      \x1B[31m%s\x1B[90m', txid);
    console.log('交易发送方:    \x1B[37m%s\x1B[90m', from);
    console.log('较易接收方:    \x1B[37m%s\x1B[90m', to);
    console.log('交易信息:      \x1B[31m%s\x1B[37m', memo);
    console.log('');
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
    var response = new Object();
    BC.httpRequest_(request, function(error, result) {
        if (!error && result.result) {
            response.flag = "SUCCESSED";
            response.name = result.result.name;
            response.publicData = result.result.public_data;
            callback(null, response);
        } else {
            //self.log.error("getAccountInfo error: ", error);
            response.flag = "FAILED";
            callback("FAILED", response);
        }
    });
};

BC.updateAccount = function(name, publicData, callback) {
    var params = [];
    params.push(name);
    params.push(name);
    params.push(publicData);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_account_update_registration", params: params};
    var request = JSON.stringify(requestBody);
    var response = new Object();
    BC.httpRequest_(request, function(error, result) {
        if (!error && result.result) {
            response.flag = "SUCCESSED";
            response.publicData = result.result.record_id;
            callback(null, response);
        } else {
            //self.log.error("updateAccount error: ", error);
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
    BC.httpRequest_(request, function(error, result) {
        if (!error) {
            callback(null, result.result);
        } else {
            //self.log.error("walletOpen_ error: ", error);
            callback(error, null);
        }
    });
};

BC.prototype.walletUnlock_ = function(callback) {
    var self = this;
    var params = [];
    params.push(3600);
    params.push(self.walletPassPhrase);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_unlock", params: params};
    var request = JSON.stringify(requestBody);
    BC.httpRequest_(request, function(error, result) {
        if (!error) {
            callback(null, result.result);
        } else {
            //self.log.error("walletUnlock_ error: ", error);
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
                callback(error, null);
                //console.log("initWallet error!");
            } else {
                //console.log("initWallet ok!");
                callback(null, result);
            }
        });
    } else {
        callback("wallet info lose!", null);
    }
};

BC.prototype.start = function() {
    var self = this;
    self.initWallet_(function(error, result) {
        if (!error) {
            self.checkBlockAfterDelay_();
            self.unlockWalletAfterDelay_();
        } else {
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
    var params = [];
    params.push(this.did);
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
                //console.log('no new block found');
                callback('no new block found');
            } else {
                params.push(height);
                var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_account_transaction_history", params: params};
                var request = JSON.stringify(requestBody);
                BC.httpRequest_(request, function(error, result) {
                    if(!error) {
                        var response = [];
                        for (var i = 0; i < result.result.length; i++) {
                            for (var j = 0; j < result.result[i].ledger_entries.length; j++) {
                                var tx = new Object();
                                tx.id = result.result[i].trx_id;
                                tx.isConfirmed = result.result[i].is_confirmed;
                                tx.from = result.result[i].ledger_entries[j].from_account;
                                tx.to = result.result[i].ledger_entries[j].to_account;
                                tx.memo = result.result[i].ledger_entries[j].memo;
                                self.printTx_(height, tx);
                                response.push(tx);
                            }
                        }
                        callback(null, height+1);
                    } else {
                        callback(error, null);
                    }
                });
            }
        }
    });
};


BC.prototype.printTx_ = function(hight, tx) {
    var self = this;
    var params = [];
    params.push(hight);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "blockchain_get_block", params: params};
    var request = JSON.stringify(requestBody);
    var response = new Object();
    BC.httpRequest_(request, function(error, result) {
        if (!error && result.result) {
            console.log('');
            console.log('检测到交易');
            console.log('区块高度:      \x1B[37m%s\x1B[37m', hight);
            console.log('区块哈希:      \x1B[32m%s\x1B[37m', result.result.id);
            console.log('交易编号:      \x1B[31m%s\x1B[37m', tx.id);
            console.log('是否确认:      \x1B[37m%s\x1B[37m', tx.isConfirmed);
            console.log('交易发送方:    \x1B[37m%s\x1B[37m', tx.from);
            console.log('交易接收方:    \x1B[37m%s\x1B[37m', tx.to);
            console.log('交易备注:      \x1B[37m%s\x1B[37m', tx.memo);
            console.log('');
            self.emit(BC.EventType.NEW_INFO, tx);
        } else {
            //console.log("blockchain_get_block error %j", error);
        }
    });
};

BC.prototype.getBlockCount_ = function(callback) {
    var self = this;
    var requestBody = {jsonrpc: '2.0', id: 2, method: "blockchain_get_blockcount", params: []};
    var request = JSON.stringify(requestBody);
    BC.httpRequest_(request, function(error, result) {
        if (!error) {
            callback(error, result.result);
        } else {
            callback(error, null);
        }
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
             setTimeout(self.unlockWalletAfterDelay_.bind(self), 1000);
         }
    });
};

BC.getPrivateKey = function(name, callback) {
    var params = [];
    params.push(name);
    params.push("owner_key");
    var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_dump_account_private_key", params: params};
    var request = JSON.stringify(requestBody);
    var response = new Object();
    BC.httpRequest_(request, function(error, result) {
        if (!error && result.result) {
            response.flag = "SUCCESSED";
            response.privateKey = result.result;
            callback(null, response);
        } else {
            response.flag = "FAILED";
            callback("FAILED", response);
        }
    });
};
