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

TH.generateEndpoint = function(callback) {
    var endpoint = {
        keys: {
            '1a': 'akhvxp7jixc5njelrm3df6el3vlgg6kpr4',
            '2a': 'gcbacirqbudaskugjcdpodibaeaqkaadqiaq6abqqiaquaucaeaqbivb6wbbatlztxqn2il6da5nft3fyt3lxrfz5d3nsuzdeaqc4v5nlhq32xt7bf4et2xxmtkw3hq6cpyotwbw4jpfwbt6u37hlgjxctshiruf3pr47fcxwfsr4425o4jugq3kh5m3sl3fjn6wdqog55yuvitf5qqmen3kqn4gz5324lldrlrbpsr5y7lsafpmedwq57e2j4qaa4cvzt2dkykntxqruqncm4p2n7zpasfjeb2vgtrrkhz26jgy6y2s2absmwnbz5o2zdnspotkz4xu7sc65bxgsiuoquuoeufo7pyjrpmk2um3vyq3uss3xrk22luiw6dxjneoms3t4o7pxy2vv4rvo23gb6ri6pemwqjxym7j2mmam4izgvde3oaqdpakhyjwrwalvirfpqbvxxycamaqaai',
            '3a': '67e6ci4ufkmxdguvebfbe6jv6vsfrxlnkvzs6qhtud7ilhhlebrq'
        },
        secrets: {
             '1a': 'uuiu4knnhd7vneev7pmbemuju5yqkuyd',
             '2a': 'gcbajjacaeaafaqbaeakfipvqiie26m54dosc7qyhljm6zoe6254jopi63mvgizaeaxfplkz4g6v47yjpbe6v53e2vwz4hqt6du5qnxclznqm7vg7z2zsnyu4r2enbo34phziv5rmuphgxlxcnbug2r7lg4s6zklpvq4drxpoffkezpmedbdo2udpbwpo6xc2y4k4il4upoh24qbl3ba5uhpzgspeaahavom6q2wctm54enedithd6tp6lyerkjaovju4mkr6oxsjwhwguwqamtftioplwwi3mt3u2wpf5h4qxxinzusfduffdrfblx36cml3cwvdg5oeg5euw54kwws5cfxq52ljdtew47dx356gvnpenlwwzqpukhtzdfucn6dh2otdadhcgjvizg3qea3ycr6cnunqc5kejl4ann56aqdaeaacaucaeah3godo7oywwa7tqugxu3mo4izizzoqs3wgkmjjafxg35pihvuq73s5eve2lvdnoupvndryv5vcib5tjjz6tst5e3to7w5bwwfrvpxm2yh4pvheh5zbp3bdogtnx52gtad74tqk2spi65qt53l4jy3rfgxbotsocre4fqoz4kkrvgzc5cngbv5wh3xsutqzbz6v2lge47sepxn6gmh5kv24z3hfuddkewbs6mlicgbixzfsfblp4ojk7scbu2czashetwwv62kla5t42isufdc6x2p27rf37xdw44nyqi26khgzusfqgy3sovwco6qaglma25wrkk23teahmgu3m5quswbii5w5rwpaddhaho6bpnoz3lopfbtqb57qenkd23igvryue4kdzzprga6fa25zwnucaubqeannzi4jbkh5rjwn6bvobpyardb24dajyt4ccx5fclb4sh5rslbvunafghn44djpyhpwh3v6zjj7ggmybuwmoa4m5sm3r6nqrpmhmhbyfrg2cqxuipatlhf3m4d5zp3g6wzkyajgk3qy7lt25mzlzpr5cy3vwbzxwoi4xyf2nangk2mhzmpkn4ncrck3wjsh4wcsumyaktcwaqrakaycagbxwyfvnbciiqp7cksgulm56zykl2wmbfljrml2yuipm4jnxbadnfbmp2ovdpl4s5t5qh3iglusmfvp2kzgk3wypoi3i4gwaw6pykooqwasayxzxrmyalwak3incpojbpwhbnho7af7hfrpsia2b6vw5vig2zqtrac65ap2lhaao3s453qw4thajbs5rkt3bai7g43qlchr3xqfambadfvchn7hfrg7se7duhnv4g3njjtihmkcsdmvfgxf6qrxqpyt6kgipj22slzjf622ls3tudl5osga53ittid7stp6cu5thus3txb3du2345pot4a5uli4zjtki3aa5p5fhmkq4sln5ypxsh4heqf7xgpejepxbzv4td3oe6v3iaxc56drv5qjqqqferkvwvfozwos277ewsi6yicqgaqbb3hgzml4ktpim3ljv4crekvdgduzjjwtep2ylhgddpxnb7g6c7vm2nrhvn2ziu76kezeqciaapmh3zewahpequh6ko76gwebdqvliykfa4iqm63zxkty5biym7fmkpv4tgn47kdqfwjcs5ohxjq3fn5egyqk6rmzhrsax3kxjkisn7ognjato42myx4v45fmda32rb3nfvqpmbidacx4s3wxj2h6czfa6bujfgyp4gfsbcarot7yopgp3rebe2jyepj7gs47eg3zto5b47brumljha32ld4ggiyjqusiiwnjvz3mpfjifyo24xi5odl5ussbaqook2qkpxhrelnoma5zljci5ycft5bto22fzuexljykg7tyxjnenbiw7hc5wnwuh65j3mqzhaquxedap4e5rzrqmxq',
             '3a': 'fyxcr4d7a6qrfbklesclcxy7twio3lfxw7bw3eo2qwbnkvargkxa'
        },
        hashname: 'hkljlqir7dzkck2lkt5rb3lqijjbgehmf3tfacrmdgchxum2efsa'
    }
    callback(endpoint);
};
