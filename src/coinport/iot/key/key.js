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
            console.log('pubkey: ' + self.did);
            console.log('prvKey: ' + response.privateKey);
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
        if (op == 'open' || op == 'close') {
            self.bc.getAccountInfo(id, function(error, keyHash) {
                if (error || !keyHash) {
                    console.log('can\'t find the hash for key: ' + id);
                } else {
                    var hash = keyHash.publicData;
                    if (hash) {
                        self.th.sendMessage(hash, op);
                        console.log(op + ' the door: ' + id + '(' + hash + ')')
                    } else {
                        console.log('can\'t find the hash for key: ' + id);
                    }
                }
            });
        } else if (op == 'auth' || op == 'unauth') {
            self.bc.storeData(self.did, tid, op + ' ' + id, function() {});
            console.log(op + ' ' + id + ' for ' + tid);
        } else if (op == 'transfer') {
            self.bc.storeData(self.did, tid, op + ' ' + id, function() {});
            console.log(op + ' right to ' + id);
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
