/**
 * Copyright 2014 Coinport Inc. All Rights Reserved.
 * Author: xiaolu@coinport.com (Xiaolu Wu)
 */

var Events     = require('events'),
    Util       = require("util"),
    Telehash   = require("/home/jaice/work/locker/node_modules/telehash"),
    EventStream = require('/usr/local/lib/node_modules/event-stream');
    Stream = require('/usr/local/lib/node_modules/stream');

var TH = module.exports.TH = function(endpoint, cb) {
    Events.EventEmitter.call(this);
    this.endpoint = endpoint;
    this.router = {"hashname": "toniwerfld7glee4xgfahbzygkqjv623dmjpq5kbjyca6cadcnvq","paths": [{"type":"udp4","ip":"192.168.0.6","port": 42424 },{"type":"udp4","ip":"192.168.36.1","port": 42424},{"type": "udp4", "ip": "172.16.192.1", "port": 42424},{"type": "http","url": "http://192.168.0.6:50299"},{"type": "tcp4","ip": "192.168.0.6","port": 42424} ],"keys": { "1a": "amwunbizmlgvn66dzcqlgq73ezsz73w7ee","2a": "gcbacirqbudaskugjcdpodibaeaqkaadqiaq6abqqiaquaucaeaqbuub2gvd4zs2ucjly2nsmi7k4i3s3zcs4dnlm2izllzy6uxk6h7fva5eu6xhib2c4bgfqsezw4oxkumty23rcrunp4ni3admwti7jeu5sghgouwrozlf7fczmw7uvzpjnrrcuft4drcwp2lllqixmtqomg73ggqumojc2uzvmt6zreqb7w3bodte3zr5sf3q34ilj22trkjcs6uktghkykmxtqc7lvco3jo2gyp2gldsfoptuutbhb2t5ko6dfcosheftnpvuwcuxbbxdzt4fjgjku3mirhf4mawxun3i2m5g5ady2cefcrqzpodlo5egkp46n7ur4bbskdepa3g267naizudr544fbhj7gsfuomrykdeejwhppmkqh2hfz5so52adid4grpn34sxuyiyvem2oicamaqaai","3a": "rka5rqje7haesp4tjilxcmhglwwaduczuw5drfoxyhycmzt2mj6a"},"router": true};
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
    RECEIVED_MESSAGE : 'received_message',
    NEW_HASHNAME : 'new_hashname',
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
      EventStream.readArray(message).pipe(l.stream());
      // l.stream().pipe(message);
    });
  } else {
    console.log("mesh is not init");
  }
};

TH.prototype.listen = function() {
  var self = this;
  this.mesh.accept = this.mesh.link;
  this.mesh.stream(function(link, req, accept){
    console.log("start receive message from p2p network")
    accept().pipe(EventStream.writeArray(function(err, message){
      console.log("message : ", message);
      self.emit(TH.EventType.RECEIVED_MESSAGE, req, message);
    }));
  });
};

TH.generateEndpoint = function(cb) {
  Telehash.generate(function(err, endpoint) {
    if (err) console.log("generate hashname error : " , err);
    else cb(endpoint);
  });
};
