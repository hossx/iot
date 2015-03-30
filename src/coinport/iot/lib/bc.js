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
};

Util.inherits(BC, Events.EventEmitter);

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
            self.log.info("error: ", error);
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
            self.log.info("error: ", error);
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
            self.log.info("error: ", error);
            response.flag = "FAILED";
            callback("FAILED", response);
        }
    });
};
