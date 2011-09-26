var BSON = require("mongodb").BSON;
var ObjectID = require("mongodb").ObjectID;
var MongoProvider = require('./mongoProvider.js').MongoProvider;

var mongoProvider = new MongoProvider('localhost', 27017);

ArticleProvider = function(collection) {
  this.collection = collection;
};

ArticleProvider.prototype.getCollection = function(callback) {
  mongoProvider.db.collection(this.collection, function(error, user_collection) {
    if( error ) callback(error);
    else callback(null, user_collection);
  });
}

ArticleProvider.prototype.findAll = function(callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      user_collection.find().sort({name:1}).toArray(function(error, results) {
        if( error ) callback(error)
        else callback( null, results)
      });
    }
  });
};

ArticleProvider.prototype.find = function(query, callback) {
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


ArticleProvider.prototype.findById = function(id, callback) {
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

ArticleProvider.prototype.findBy_Id = function(id, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      user_collection.findOne({_id: user_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
        if( error ) callback(error)
        else callback( null, result)
      });
    }
  });
}

ArticleProvider.prototype.findOne = function(find, callback) {
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

ArticleProvider.prototype.getUniqueId = function(id, callback) {
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

ArticleProvider.prototype.save = function(users, callback) {
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

ArticleProvider.prototype.update = function(user, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
      user.data.modified_at = new Date();
//      user_collection.update({_id: user_collection.db.bson_serializer.ObjectID.createFromHexString(user._id)}, {$set: user.data}, {multi:true}, function(err) {
      user_collection.update({_id: parseInt(user._id)}, {$set: user.data}, {multi:true,safe:true}, function(err) {
          if (err) console.warn(err.message);
          else console.log('successfully updated: ' + user._id);
          callback(null, user);
      });
    }
  });
};

ArticleProvider.prototype.remove = function(id, callback) {
  this.getCollection(function(error, user_collection) {
    if( error ) callback(error)
    else {
//      user_collection.remove({_id: user_collection.db.bson_serializer.ObjectID.createFromHexString(id)} , function(err) {
      user_collection.remove({_id: parseInt(id)} , function(err) {
          if (err) console.warn(err.message);
          else console.log('successfully removed: ' + id);
          callback(null, id);
      });
    }
  });
};

exports.ArticleProvider = ArticleProvider;
