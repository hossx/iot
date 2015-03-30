/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: xiaolu@coinport.com (Xiaolu Wu)
 */

var Events = require('events'),
    Util   = require("util");

var TH = module.exports.TH = function() {
    Events.EventEmitter.call(this);
};
Util.inherits(TH, Events.EventEmitter);

TH.EventType = {
    NEW_MESSAGE : 'new_message'  // emitted data like this: {from: xxx, message: xxx}
};

/**
 * Send the message to another node in telehash p2p network
 * @param {String} from The sender's hashname
 * @param {String} to The receiver's hashname
 * @param {String} message The message
 * @return {boolean} Success or Fail
 */
TH.prototype.sendMessage = function(to, message) {
};

TH.prototype.listen = function() {
};

TH.generateEndpoint = function() {
};
