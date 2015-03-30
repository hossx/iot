'use strict'

var BC = require('./bc').BC;
var bc = new BC();
//bc.getAccountInfo("cpdoor", function(error, result) {
//    console.log("%j", error);
//    console.log("%j", result);
//});

//bc.storeData("autumn84", "cpdoor", "first test", function(error, result) {
//    console.log("%j", error);
//    console.log("%j", result);
//});


bc.updatePublicData("cpdoor",  "autumn84", "update public data test second", function(error, result) {
    console.log("%j", error);
    console.log("%j", result);
});
