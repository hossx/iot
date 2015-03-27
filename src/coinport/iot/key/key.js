/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: c@coinport.com (Chao Ma)
 */

var readline = require('readline'),
    BC = require('../lib/bc').BC,
    TH = require('../lib/th').TH;

var repl = function() {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("command > ", function(cmd) {

        rl.close();
        if (cmd != 'bye')
            repl();
    });
}

var bc = new BC();
var th = new TH();
repl();
