/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: c@coinport.com (Chao Ma)
 */

var Key = require('./key/key').Key,
    Door = require('./door/door').Door;

if (process.argv.length != 4) {
    console.log('unknown cmd');
    process.exit(1);
}

var op = process.argv[2];
var did = process.argv[3];

if (op == 'init') {
} else if (op == 'door') {
    var door = new Door(did);
    door.init();
} else if (op == 'key') {
    var key = new Key(did);
    key.repl();
} else {
    console.log('unknown cmd');
}
