/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: xiaolu@coinport.com (Xiaolu Wu)
 */

var Events     = require('events'),
    Util       = require("util"),
    Telehash   = require("../../../../node_modules/telehash"),
    EventStream = require('../../../../node_modules/event-stream'),
    StringDecoder = require('string_decoder').StringDecoder;

var TH = module.exports.TH = function(endpoint, cb) {
    Events.EventEmitter.call(this);
    this.endpoint = endpoint;
    this.router = {hashname: '5vhbj65qmxz55n5lftg7ibmjrsvlertzhx6qwmmn3k36w3ntexbq',paths: [{ type: 'udp4', ip: '54.65.222.209', port: 42424}, {type: 'http', url: 'http://54.65.222.209:49390'}, {type: 'tcp4', ip: '54.65.222.209', port: 42424} ], keys: {'1a': 'atxej4igwobgev2qf3f6ec45csxmfibezsbleh32tirmarnoqub6poo6fbucpt34gi', '2a': 'gcbacirqbudaskugjcdpodibaeaqkaadqiaq6abqqiaquaucaeaqbqosz2izyyl55hcuimir4qknqd57ghteytaqhkuzvxudlpqitlb5adg4y5vug5jlxgkj7ojqxmrkhhjz5j7ohyijhvobm4avgvgx5osycz4hkm2pokbf2e5luiz3pegjebdv46i3pgzl5g3enzgi27r4b3yxrstojolqwiubd63leywdj4id7awuuyrqcvpgihymyisebisdfi2wt3s6vaov4g3rtqdbf2t3c753ze5z2x2zybyuxvma2hlhrkg67enrddeh6fpmztcsoenogx5nnziktom35ybmv364zixzohmz7kjbbj6npcaowvsfktowcgfwgwspuwayogavqqwj4gulffnua47pnvjrzutciv22s27s3bncx2a2uylnukzuac5kfpk7w7bho5c2lt5ouricamaqaai', '3a': '4qd36pfpni7ytlfmmbp6ytwcbwekhqbfycwphkg2xzac6bmalmra'}, router: true};
    var self = this;
    Telehash.mesh({id:this.endpoint}, function(err, mesh){
      self.mesh = mesh;
      var linkR = self.mesh.link(self.router);
      EventStream.readArray([0]).pipe(linkR.stream());
      // linkR.stream().pipe("ping router");
      self.emit('mesh_ready');
    });
};
Util.inherits(TH, Events.EventEmitter);

TH.EventType = {
    NEW_MESSAGE : 'new_message',  // emitted data like this: {from: xxx, message: xxx}
    MESH_READY : 'mesh_ready'
};

/**
 * Send the message to another node in telehash p2p network
 * @param {String} from The sender's hashname
 * @param {String} to The receiver's hashname
 * @param {String} message The message
 * @return {boolean} Success or Fail
 */
TH.prototype.sendMessage = function(to, message) {
  if (this.mesh != null) {
    this.mesh.link(to, function(e, l){
      var messageArray = [message]
      EventStream.readArray(messageArray).pipe(l.stream());
      // l.stream().pipe(message);
    });
  } else {
    // console.log("mesh is not init");
  }
};

TH.prototype.listen = function() {
  var self = this;
  var decoder = new StringDecoder('utf8');
  this.mesh.accept = this.mesh.link;
  this.mesh.stream(function(link, req, accept){
    // console.log("start receive message from p2p network")
    accept().pipe(EventStream.writeArray(function(err, message){
      // console.log("message : ", message);
      self.emit(TH.EventType.NEW_MESSAGE, {from:link.hashname, message:decoder.write(message[0])});
    }));
  });
};

TH.generateEndpoint = function(cb) {
  Telehash.generate(function(err, endpoint) {
    if (err) {
      // console.log("generate hashname error : " , err);
    }
    else cb(endpoint);
  });
};
