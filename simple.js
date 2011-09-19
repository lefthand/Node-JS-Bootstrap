
var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

client.set("string key", "I smell", redis.print);
client.hset("hash key", "hashtest one", "some value", redis.print);
client.hset(["hash key", "hashtest two", "some other value"], redis.print);
client.hset(["hash key", "hashtest three", "a third value"], redis.print);
client.get("string key", redis.print);
client.hget("hash key", "hashtest 1", redis.print);

client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
      console.log("    " + i + ": " + reply);
      client.hget("hash key", reply, redis.print);
    });
    client.quit();
});
