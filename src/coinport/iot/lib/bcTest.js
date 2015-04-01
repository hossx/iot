'use strict'

var BC = require('./bc').BC;
var bc = new BC('bts5nba4eojxcrxgwxkdj71u3sefhudqtyqgn61syz1jyggcgshki');
//bc.start();
bc.getAccountInfo("bts5nba4eojxcrxgwxkdj71u3sefhudqtyqgn61syz1jyggcgshki", function(error, result) {
    console.log("%j", error);
    console.log("%j", result);
});

// bc.storeData("autumn84", "bts5nba4eojxcrxgwxkdj71u3sefhudqtyqgn61syz1jyggcgshki", "first test", function(error, result) {
    // console.log("%j", error);
    // console.log("%j", result);
// });


//bc.updatePublicData("bts5nba4eojxcrxgwxkdj71u3sefhudqtyqgn61syz1jyggcgshki",  "autumn84", "update public data test second", function(error, result) {
//    console.log("%j", error);
//    console.log("%j", result);
//});

//bc.getWalletTransactionByIndex_(2156909, function(error, result) {
//    console.log("%j", error);
//    console.log("%j", result);
//});
