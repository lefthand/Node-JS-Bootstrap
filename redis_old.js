if (0) {
  name = "";
  client.incr("global:nextUserId", function (err, reply) {
    console.log("Adding User: " + name + " ID:" + reply);
    client.set("uid:"+reply+":name", name);
    client.set("uid:"+reply+":email", name + "@zeroviz.com");
    client.set("name:"+name+":uid");
    client.sadd("users", reply);
  });
}

var users = [];
var user2 = {};

client.smembers("users", function (err, replies) {
  replies.forEach(function (reply, i) {
    var userId = reply;
    var user = { id: userId };
    user2[userId] = {};

    client.get("uid:" + userId + ":name", function (err, reply) {
      user.name = reply;
      user2[userId].name = reply;
    });
    client.get("uid:" + userId + ":email", function (err, reply) {
      user.email = reply;
      user2[userId].email = reply;
    });
    users.push ( user ) ;
  });
});


function loadUser(req, res, next) {
  req.user = { id: req.params.id };
  client.get("uid:" + req.params.id + ":name", function (err, userName) {
    if (!userName) return next(new Error( "User not found"));
    req.user.name = userName;
  });
  client.get("uid:" + req.params.id + ":email", function (err, userEmail) {
    if (!userEmail) return next(new Error( "User not found"));
    req.user.email = userEmail;
  });
  next();
}

