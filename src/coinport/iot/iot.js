/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: c@coinport.com (Chao Ma)
 */

var BC    = require('./lib/bc').BC,
    Door  = require('./door/door').Door,
    Key   = require('./key/key').Key,
    Redis = require('redis'),
    TH    = require('./lib/th').TH;

if (process.argv.length != 4) {
    console.log('unknown cmd');
    process.exit(1);
}

var op = process.argv[2];
var did = process.argv[3];
var redisClient = Redis.createClient(6379, 'localhost');

var init = function(did) {
    TH.generateEndpoint(function(endpoint) {
        var hashname = endpoint.hashname;
        var endpointStr = JSON.stringify(endpoint);
        redisClient.set(did, endpointStr, function(error, redisResp) {
            if (error) {
                console.log(error);
            } else {
                BC.updateAccount(did, hashname, function(error, res) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('device is initalized');
                        process.exit(0);
                    }
                });
            }
        });
    });
};

if (op == 'init') {
    init(did);
} else if (op == 'door') {
    var door = new Door(did);
    door.init();
} else if (op == 'key') {
    var key = new Key(did);
    key.repl();
} else {
    console.log('unknown cmd');
}
