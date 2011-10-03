var BSON = require("mongodb").BSON;
var ObjectID = require("mongodb").ObjectID;
var MongoProvider = require('./mongoProvider.js').MongoProvider;

var mongoProvider = new MongoProvider('localhost', 27017);

DataProvider = function(collection) {
  this.collection = collection;
};

DataProvider.prototype.getCollection = function(callback) {
  mongoProvider.db.collection(this.collection, function(error, user_collection) {
    if( error ) callback(error);
    else callback(null, user_collection);
  });
}

DataProvider.prototype.findAll = function(callback,sort) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      user_collection.find().sort(sort).toArray(function(error, results) {
        if( error ) callback(error)
        else callback( null, results)
      });
    }
  });
};

DataProvider.prototype.find = function(query, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      user_collection.find(query).toArray(function(error, results) {
        if( error ) callback(error)
        else callback( null, results)
      });
    }
  });
};


DataProvider.prototype.findById = function(id, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      user_collection.findOne({_id: parseInt(id)}, function(error, result) {
        if( error ) callback(error)
        else callback( null, result)
      });
    }
  });
}

DataProvider.prototype.findBy_Id = function(id, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      _id = user_collection.db.bson_serializer.ObjectID.createFromHexString(id);
      user_collection.findOne({_id: _id}, function(error, result) {
        if( error ) callback(error)
        else callback( null, result)
      });
    }
  });
}

DataProvider.prototype.findOne = function(find, callback) {
  this.getCollection(function(error, game_collection) {
    if( error ) callback(error)
    else {
      game_collection.findOne(find, function(error, result) {
        if( error ) callback(error)
        else callback( null, result)
      });
    }
  });
}

DataProvider.prototype.getUniqueId = function(id, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      user_collection.findAndModify({_id: id}, [['_id','asc']], {$inc: {count:1}}, {upsert:true,new:true}, function(error, result) {
        if( error ) callback(error)
        else {
          callback( null, result.count)
        }
      });
    }
  });
}

DataProvider.prototype.save = function(users, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      if (typeof(users.length) == "undefined") {
        users = [users];
      }
      for (var i = 0; i < users.length; i++ ) {
        user = users[i];
        user.created_at = new Date();
        user.modified_at = new Date();
        if (user._id === 'undefined' && user.id) {
          user._id = user.id;
        }
        user_collection.save(user, function() {
          callback(null, user);
        });
      }

    }
  });
};

DataProvider.prototype.update = function(update, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      update.data.modified_at = new Date();
      if (typeof update._id == 'string')  {
        id = user_collection.db.bson_serializer.ObjectID.createFromHexString(update._id);
      }
      else {
        id = parseInt(user.id);
      }
      user_collection.update({_id: id}, {$set: update.data}, {multi:true,safe:true}, function(err) {
          if (err) console.warn(err.message);
          else console.log('successfully updated: ' + update.id);
          callback(null, update);
      });
    }
  });
};

DataProvider.prototype.remove = function(id, callback) {
  this.getCollection(function(error, user_collection) {
    console.log(typeof id);
    if( error ) callback(error)
    else {
      _id = parseInt(id);
      user_collection.remove({_id: _id} , function(err) {
          if (err) console.warn(err.message);
          else console.log('successfully removed: ' + id);
          callback(null, id);
      });
    }
  });
};

DataProvider.prototype.removeBy_id = function(_id, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      _id = user_collection.db.bson_serializer.ObjectID.createFromHexString(_id);
      user_collection.remove({_id: _id} , function(err) {
          if (err) console.warn(err.message);
          else console.log('successfully removed: ' + _id);
          callback(null, _id);
      });
    }
  });
};

exports.DataProvider = DataProvider;
