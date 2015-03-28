/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: yangli@coinport.com (Li Yang)
 */

var Async                         = require('async'),
    Events                        = require('events'),
    Util                          = require("util"),
    Crypto                        = require('crypto'),
    Redis                         = require('redis'),
    DataTypes                     = require('../../../../gen-nodejs/data_types'),
    MessageTypes                  = require('../../../../gen-nodejs/message_types'),
    BitwayMessage                 = MessageTypes.BitwayMessage,
    CryptoCurrencyBlockMessage    = MessageTypes.CryptoCurrencyBlockMessage,
    BitwayResponseType            = DataTypes.BitwayResponseType,
    ErrorCode                     = DataTypes.ErrorCode,
    TransferStatus                = DataTypes.TransferStatus,
    CryptoCurrencyAddressType     = DataTypes.CryptoCurrencyAddressType,
    Logger                        = require('../logger'),
    TransferType                  = DataTypes.TransferType,
    BlockIndex                    = DataTypes.BlockIndex,
    CryptoAddress                 = DataTypes.CryptoAddress,

var BC = module.exports.BC = function() {
    Events.EventEmitter.call(this);
};
Util.inherits(BC, Events.EventEmitter);

BC.EventType = {
    NEW_INFO : 'new_info'  // emitted data like this: {from: xxx, memo: xxx}
};

BC.TX_AMOUNT = 1;
BC.VALUE_UNIT = "BTS";
/**
 * Send the bts tx with auth info(memo)
 * @param {String} from The sender's readable name
 * @param {String} to The receiver's readable name
 * @param {String} memo Contains auth info
 * @return {boolean} Success or Fail
 */
BC.prototype.storeData = function(from, to, memo) {
    var self = this;
    var params = [];
    params.push(BC.TX_AMOUNT);
    params.push(BC.VALUE_UNIT);
    params.push(from);
    params.push(to);
    params.push(memo);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "wallet_transfer", params: params};
    var request = JSON.stringify(requestBody);
    self.log.info("walletTransfer_ request: ", request);
    self.httpRequest_(request, function(error, result) {
        self.log.info("walletTransfer_ result: ", result);
        if (!error && result.result) {
            var cctx = new CryptoCurrencyTransaction({ids: [], status: TransferStatus.CONFIRMING});
            cctx.ids.push(id);
            cctx.txType = type;
            cctx.txid = result.result.record_id;
            cctx.sigId = result.result.record_id;
            self.log.info("ids: " + id + " sigId: " + cctx.sigId);
            self.redis.set(cctx.sigId, cctx.ids, function(redisError, redisReply){
                if (redisError) {
                    self.log.error("redis sadd error! ids: ", cctx.ids);
                }
            });
            self.emit(CryptoProxy.EventType.TX_ARRIVED,
                self.makeNormalResponse_(BitwayResponseType.TRANSACTION, self.currency, cctx));
        } else {
            self.log.info("error: ", error);
            var response = new CryptoCurrencyTransaction({ids: id, txType: type, 
                status: TransferStatus.FAILED});
            self.emit(CryptoProxy.EventType.TX_ARRIVED,
                self.makeNormalResponse_(BitwayResponseType.TRANSACTION, self.currency, response));
        }
    });
};

/**
 * Get the bts account info
 * @param {String} name The readable name of account
 * @return {String} publicData in bts
 */
BC.prototype.getAccountInfo = function(name) {
    var self = this;
    var params = [];
    params.push(name);
    var requestBody = {jsonrpc: '2.0', id: 2, method: "blockchain_get_account", params: params};
    var request = JSON.stringify(requestBody);
    self.log.info("getAccountInfo_ request: ", request);
    self.httpRequest_(request, function(error, result) {
        self.log.info("getAccountInfo result: ", result);
        if (!error && result.result) {
            var response = new Object();
            response.flag = "SUCCESSED";
            response.name = result.result.Name;
            response.publicData = result.result.publicData;
            self.emit(CryptoProxy.EventType.TX_ARRIVED, response);
        } else {
            self.log.info("error: ", error);
            var response = new Object();
            response.flag = "FAILED";
            self.emit(CryptoProxy.EventType.TX_ARRIVED, response);
        }
    });
};
