var express = require('express');

var DataProvider = require('./dataProvider.js').DataProvider;
var PostHelper = require('./lib/post.js');
var UserHelper = require('./lib/user.js');
var AdminHelper = require('./lib/admin.js');
var LoginHelper = require('./lib/login.js');
var connect = require('express/node_modules/connect');
var RedisStore = require('connect-redis')(express);
var sessionStore = new RedisStore();
var redis = require("redis");
var client = redis.createClient();
var bcrypt = require('bcrypt'); 

var Session = connect.middleware.session.Session,
    parseCookie = connect.utils.parseCookie

client.on("error", function (err) {
    console.log("Error " + err);
});
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app); 
io.set('log level', 0);


// = Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    store: sessionStore,
    secret: 'shhhhhh',
    key: 'my.sid',
    cookie: {maxAge: 31557600000 }
  }));
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});
   
io.set('authorization', function (data, accept) {
  if (data.headers.cookie) {
    data.cookie = parseCookie(data.headers.cookie);
    data.sessionID = data.cookie['my.sid'];
    data.sessionStore = sessionStore;
    sessionStore.get(data.sessionID, function (err, session) {
      if (err) {
        accept(err.message, false);
      } else {
        data.session = new Session(data, session);
        accept(null, true);
      }
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});

Array.prototype.unique = function() {
  var o = {}, i, l = this.length, r = [];
  for(i=0; i<l;i+=1) o[this[i]] = this[i];
  for(i in o) {
    if (o[i]) {
      r.push(o[i]);
    }
  }
  return r;
};

var userProvider = new DataProvider('user');
var postProvider = new DataProvider('post');
var categoryProvider = new DataProvider('category');
var countProvider = new DataProvider('count');
var chatProvider = new DataProvider('chat');

countProvider.getUniqueId('saves', function(error, count) { 
  if (error) {
    console.log('Could not determine count');
  }
  console.log('Run ' + count + ' times.');
});

loadLastFivePosts = function (req, res, next) {
  postProvider.find({}, function(error, posts) { 
    app.helpers({
      lastFivePosts: posts
    });
    next();
  }, {created_at:-1}, 5);
}

loadSessionUser = function (req, res, next) {
  if (req.session.user && req.cookies.rememberme) {
    req.user = req.session.user;
  }
  else {
    req.user = {};
  }
  if (req.user.is_root) {
    req.is_admin = true;
  }
  app.helpers({
    loggedInUser: req.user
  });
  next();
}

loadGlobals = [loadSessionUser, loadLastFivePosts];

loadCategories = function (req, res, next) {
  categoryProvider.findAll(function(error, categories) {
    app.helpers({
      categories: categories 
    });
    next();
  },{name:1});
}

loadPost = function (req, res, next) {
  postProvider.findBy_Id(req.params.id, function(error, post) {
    req.post = post;
    app.helpers({
      post: post 
    });
    next();
  });
}

// Routes
app.get('/', loadGlobals, function(req, res){
  res.render('index', {
    title: 'Fun', loggedInUser:req.user
  });
});

app.get('/about', loadGlobals, function(req, res){
  res.render('about', {
    title: 'About', loggedInUser:req.user
  });
});

PostHelper.add_routes(app);
UserHelper.add_routes(app);
AdminHelper.add_routes(app, express);
LoginHelper.add_routes(app);

app.get('/listen', loadGlobals, function(req, res){
  res.render('listen', {layout:false});
});

io.sockets.on('connection', function (socket) {
  var hs = socket.handshake; 
  hs.session.info = {IConnected:'And all I got was this lousy status message.'}
  if (hs.session.newPost) {
    newPost = hs.session.newPost;
    delete hs.session.newPost;
    socket.broadcast.emit('newPost', { title: newPost.title, _id: newPost._id });
  }
  hs.session.touch().save();
  socket.on('new post', function (data) {
    socket.broadcast.emit('newPost', { title: data });
  });

//  chatProvider.findAll(function(error, lines) {
//    for (var i in lines) {
//      message = lines[i].line;
//      var messageId = '';
//      if (hs.session.user && hs.session.user.is_admin) {
//        messageId = lines[i]._id;
//      }
//      socket.emit('repeat', { youSaid: message, messageId: messageId });
//    }
//  }); 
//  socket.on('user message', function (data) {
//    socket.broadcast.emit('repeat', { youSaid: data });
//    chatProvider.save({line: data}); 
//  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
