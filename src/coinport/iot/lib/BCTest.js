'use strict'

var BC = require('./bc').BC;
var bc = new BC();
//bc.getAccountInfo("yangli", function(error, result) {
//    console.log("%j", error);
//    console.log("%j", result);
//});
bc.storeData("autumn84", "cpdoor", "first test", function(error, result) {
    console.log("%j", error);
    console.log("%j", result);
});
