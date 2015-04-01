'use strict'

var BC = require('./bc').BC;
var bc = new BC('yh323');
bc.start();
//bc.getAccountInfo("bts5nba4eojxcrxgwxkdj71u3sefhudqtyqgn61syz1jyggcgshki", function(error, result) {
//    console.log("%j", error);
//    console.log("%j", result);
//});

//bc.storeData("yh323", "autumn84", "first test", function(error, result) {
//  console.log("%j", error);
//  console.log("%j", result);
//});


//bc.updatePublicData("bts5nba4eojxcrxgwxkdj71u3sefhudqtyqgn61syz1jyggcgshki",  "autumn84", "update public data test second", function(error, result) {
//    console.log("%j", error);
//    console.log("%j", result);
//});

//bc.getWalletTransactionByIndex_(2172931, function(error, result) {
//    console.log("%j", error);
//    console.log("%j", result);
//});
//bc.printTx_(2172931, "");
