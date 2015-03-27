/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: yangli@coinport.com (Li Yang)
 */

var Events = require('events'),
    Util   = require("util");

var BC = module.exports.BC = function() {
    Events.EventEmitter.call(this);
};
Util.inherits(BC, Events.EventEmitter);

BC.EventType = {
    NEW_INFO : 'new_info'  // emitted data like this: {from: xxx, memo: xxx}
};

/**
 * Send the bts tx with auth info(memo)
 * @param {String} from The sender's readable name
 * @param {String} to The receiver's readable name
 * @param {String} memo Contains auth info
 * @return {boolean} Success or Fail
 */
BC.prototype.storeData = function(from, to, memo) {
};

/**
 * Get the bts account info
 * @param {String} name The readable name of account
 * @return {String} publicData in bts
 */
BC.prototype.getAccountInfo = function(name) {
};
