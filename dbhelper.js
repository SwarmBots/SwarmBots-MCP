
var get = function (collection, sid, uid, callback){
  var args = Array.prototype.slice.call(arguments, 1);
  callback = typeof args[args.length - 1] == 'function' ? args.pop() : null;
  uid = typeof args[args.length -1] != "string" ? args.pop() : null;
  sid = typeof args[args.length -1] == "string" ? args.pop() : null;
  if (!uid == null){
    collection.findOne({_id: uid}, callback);
  }else{
    collection.findOne({sid: sid}, callback);
  }
}

var update = function (collection, doc, callback){
  if (doc.id != null){
    collection.update({id: doc.id}, doc, {upsert: true}, callback);
  }else{
    collection.update({sid: doc.sid}, doc, {upsert: true}, callback);
  }
}

exports.updateTest = function (db, doc, callback){
  var collection = db.collection('test');
  update(collection, doc, callback);
}

exports.getTest = function (db, sid, uid, callback){
  var collection = db.collection('test');
  get(collection, sid, uid, callback);
}

exports.getUser = function (db, sid, uid, callback){
  var collection = db.collection('users');
  get(collection, sid, uid, callback);
}

exports.updateUser = function (db, userDoc, callback){
  var collection = db.collection('users');
  update(collection, userDoc, callback);
}

exports.getSwarmBot = function (db, sid, uid, callback){
  var collection = db.collection('bots');
  get(collection, sid, uid, callback);
}

exports.updateSwarmBot = function(db, swarmDoc, callback){
  var collection = db.collection('bots');
  update(collection, swarmDoc, callback);
}





