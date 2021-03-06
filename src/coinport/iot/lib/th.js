/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: xiaolu@coinport.com (Xiaolu Wu)
 */

var Events     = require('events'),
    Util       = require("util"),
    Telehash   = require("../../../../node_modules/telehash"),
    EventStream = require('../../../../node_modules/event-stream'),
    StringDecoder = require('string_decoder').StringDecoder;

// enable debug log for telehash
// Telehash.log({debug:console.log});

var TH = module.exports.TH = function(endpoint, cb) {
    Events.EventEmitter.call(this);
    this.endpoint = endpoint;
    // this.router = {hashname: '5vhbj65qmxz55n5lftg7ibmjrsvlertzhx6qwmmn3k36w3ntexbq',paths: [{ type: 'udp4', ip: '54.65.222.209', port: 42424}, {type: 'http', url: 'http://54.65.222.209:49390'}, {type: 'tcp4', ip: '54.65.222.209', port: 42424} ], keys: {'1a': 'atxej4igwobgev2qf3f6ec45csxmfibezsbleh32tirmarnoqub6poo6fbucpt34gi', '2a': 'gcbacirqbudaskugjcdpodibaeaqkaadqiaq6abqqiaquaucaeaqbqosz2izyyl55hcuimir4qknqd57ghteytaqhkuzvxudlpqitlb5adg4y5vug5jlxgkj7ojqxmrkhhjz5j7ohyijhvobm4avgvgx5osycz4hkm2pokbf2e5luiz3pegjebdv46i3pgzl5g3enzgi27r4b3yxrstojolqwiubd63leywdj4id7awuuyrqcvpgihymyisebisdfi2wt3s6vaov4g3rtqdbf2t3c753ze5z2x2zybyuxvma2hlhrkg67enrddeh6fpmztcsoenogx5nnziktom35ybmv364zixzohmz7kjbbj6npcaowvsfktowcgfwgwspuwayogavqqwj4gulffnua47pnvjrzutciv22s27s3bncx2a2uylnukzuac5kfpk7w7bho5c2lt5ouricamaqaai', '3a': '4qd36pfpni7ytlfmmbp6ytwcbwekhqbfycwphkg2xzac6bmalmra'}, router: true};
    this.router = { hashname: 'toniwerfld7glee4xgfahbzygkqjv623dmjpq5kbjyca6cadcnvq', paths: [ { type: 'udp4', ip: '192.168.0.6', port: 42424 }, { type: 'udp4', ip: '192.168.36.1', port: 42424 }, { type: 'udp4', ip: '172.16.192.1', port: 42424 }, { type: 'http', url: 'http://192.168.0.6:43330' }, { type: 'tcp4', ip: '192.168.0.6', port: 42424 } ], keys: { '1a': 'amwunbizmlgvn66dzcqlgq73ezsz73w7ee', '2a': 'gcbacirqbudaskugjcdpodibaeaqkaadqiaq6abqqiaquaucaeaqbuub2gvd4zs2ucjly2nsmi7k4i3s3zcs4dnlm2izllzy6uxk6h7fva5eu6xhib2c4bgfqsezw4oxkumty23rcrunp4ni3admwti7jeu5sghgouwrozlf7fczmw7uvzpjnrrcuft4drcwp2lllqixmtqomg73ggqumojc2uzvmt6zreqb7w3bodte3zr5sf3q34ilj22trkjcs6uktghkykmxtqc7lvco3jo2gyp2gldsfoptuutbhb2t5ko6dfcosheftnpvuwcuxbbxdzt4fjgjku3mirhf4mawxun3i2m5g5ady2cefcrqzpodlo5egkp46n7ur4bbskdepa3g267naizudr544fbhj7gsfuomrykdeejwhppmkqh2hfz5so52adid4grpn34sxuyiyvem2oicamaqaai', '3a': 'rka5rqje7haesp4tjilxcmhglwwaduczuw5drfoxyhycmzt2mj6a' }, router: true };

    var self = this;
    Telehash.mesh({id:this.endpoint}, function(err, mesh){
      self.mesh = mesh;
      var linkR = self.mesh.link(self.router, function(e, l){
        EventStream.readArray([0]).pipe(l.stream());
      });
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
  try {
    if (this.mesh != null) {
      this.mesh.link(to, function(e, l){
        var messageArray = [message]
        EventStream.readArray(messageArray).pipe(l.stream());
        // l.stream().pipe(message);
      });
    } else {
      // console.log("mesh is not init");
    }
  } catch(err) {
    console.log("[ERROR] can't connect to another point !!!")
  }
};

TH.prototype.listen = function() {
  try {
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
  } catch(err) {
    console.log("[ERROR] can't connect to another point !!!")
  }
};

TH.generateEndpoint = function(cb) {
  try {
    Telehash.generate(function(err, endpoint) {
      if (err) {
        // console.log("generate hashname error : " , err);
      }
      else cb(endpoint);
    });
  } catch(err) {
    console.log("[ERROR] can't connect to another point !!!")
  }
};
