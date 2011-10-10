var express = require('express');

var DataProvider = require('./dataProvider.js').DataProvider;
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

var userProvider = new DataProvider('users');
var postProvider = new DataProvider('post');
var categoryProvider = new DataProvider('category');
var countProvider = new DataProvider('count');

countProvider.getUniqueId('saves', function(error, count) { 
  if (error) {
    console.log('Could not determine count');
  }
  console.log('The count is: ' + count);
});

client.incr("connections", function (err, reply) {
  console.log("This has been run " + reply + " times!");
});

function validatePostData(req, callback) {
  errors = [];
  data = {};
  if (!req.param('title')) {
    errors.push('Title required.');  
  }
  if (!req.param('content')) {
    errors.push('Content required.');  
  }
  if (errors.length > 0) {
    callback(errors);
  }
  else {
    data.title = req.param('title');
    data.content = req.param('content');
    data.category = req.param('category');
    if (!req.user._id && !req.param('_id')) {
      if (!req.param('email_address')) {
        callback('Email address required.');
      }
      else {
        userProvider.findOne({email: req.param('email_address')}, function( error, user) {
          if (user && user.username) {
            callback('Please log in to post with this email address.');
          }
          else if (user && !user.username) {
            data.user_id = user._id;
            callback( null, data);
          }
          else {
            newUserInfo = {email: req.param('email_address')};
            countProvider.getUniqueId('users', function(error, id) {
              newUserInfo._id = id;
              data.user_id = id;
              userProvider.save( newUserInfo );
              callback( null, data);
            });
          }
        });
      }
    }
    else {
      callback( null, data);
    }
  }
}

function validateUserData(req, callback) {
  errors = [];
  data = {};
  if (req.param('password')) {
    if (req.param('password').length < 5) {
      errors.push('Password too short.');  
    }
    else if (req.param('password') !== req.param('password_confirm')) {
      errors.push('Passwords did not match.' + req.param('password' + ' ' + req.param('password_confirm')));  
    }
    else {
      var salt = bcrypt.gen_salt_sync(10);  
      var hash = bcrypt.encrypt_sync(req.param('password'), salt);
      data.password = hash;
    }
  }
  else if (!req.param('id')) {
    errors.push('Password required.');  
  }
  if (!req.param('username')) {
    errors.push('Username required.');  
  }
  if (!req.param('name')) {
    errors.push('Name required.');  
  }
  if (!/.*@.*\..*/.test(req.param('email'))){
    errors.push('Valid email required.');  
  }
  if (errors.length == 0) {
    data.name = req.param('name');
    data.username = req.param('username');
    data.email = req.param('email');
    if (req.user.is_root) {
      data.is_root = req.param('is_root');
      data.is_admin = req.param('is_admin');
    }
    userProvider.find({_id: {$ne: parseInt(req.params.id)},
                          $or: [{username: req.param('username')},
                                {email: req.param('email')}]
                      }, function (error, users) {
      if (users.length > 0) {
        for (var i in users) {
          if (typeof users[i] !== 'function') {
            if (users[i].username == req.param('username')) {
              errors.push('Username already taken.');  
            }
            if (users[i].email == req.param('email')) {
              errors.push('Email Address already taken.');  
            }
          }
        }
        callback(errors);
      }
      else {
        callback( null, data);
      }
    });
  }
  else {
    callback(errors);
  }
}

function loadUser(req, res, next) {
  if (req.session.user && req.cookies.rememberme) {
    req.user = req.session.user;
  }
  else {
    req.user = {};
  }
  if (req.user.is_root) {
    req.is_admin = true;
  }
  next();
}

// Routes
app.get('/', loadUser, function(req, res){
  res.render('index', {
    title: 'Fun', loggedInUser:req.user 
  });
});

app.get('/about', loadUser, function(req, res){
  res.render('about', {
    title: 'About', loggedInUser:req.user 
  });
});

app.get('/admin', loadUser, function(req, res){
  if (req.is_admin) {
    localScripts = '$(document).ready(function(){$(\'#categoryForm\').validate();})';
    categoryProvider.findAll(function(error, categories) {
      res.render('admin', {
        title: 'Admin', loggedInUser:req.user, categories:categories
      });
    },{name:1});
  }
  else {
    res.redirect('/');
  }
});

app.post('/admin/category/submit', loadUser, function(req, res){
  if (req.is_admin) {
    data = {};
    data.name = req.param('name');
    categoryProvider.save(data, function(error, category) {
      res.redirect('/admin/');
    });
  }
  else {
    res.redirect('/');
  }
});

app.get('/admin/category/:id/remove', loadUser, function(req, res, next){
  if (req.params.id === 'null') {
    res.redirect('/admin');
  }
  if (req.is_admin) {
    categoryProvider.removeBy_id(req.params.id, function(error, id){
      if (error) {
        console.log('Could not delete category ' + id);
      }
    });
    res.redirect('/admin/');
  }
  else {
    res.redirect('/post/' + req.params.id);
  }
});

app.get('/post/create', loadUser, function(req, res){
  localScripts = '$(document).ready(function(){$(\'#postForm\').validate({rules:{email_address:{remote: {url:\'/post/validate/email/\',type:\'post\'}}}});})';
  categoryProvider.findAll(function(error, categories) {
    res.render('posts/create', { title: 'New Post', post: {_id:'',title:'',category:'',content:''}, categories: categories, loggedInUser: req.user });
  }, {name:1});
});

app.get('/post/:id/edit', loadUser, function(req, res, next){
  localScripts = '$(document).ready(function(){$(\'#postForm\').validate();})';
  postProvider.findBy_Id(req.params.id, function(error, post) {
    if (req.is_admin || req.user._id === post.user_id) {
      categoryProvider.findAll(function(error, categories) {
        res.render('posts/edit', { title: 'Post ' + post.title, post: post, categories: categories, loggedInUser:req.user });
      }, {name:1});
    }
    else {
      res.redirect('/post/' + req.params.id);
    }
  });
});


app.post('/post/submit/0?', loadUser, function(req, res){
  data = {};
  validatePostData(req, function (error, data){
    if (error) {
      console.log('Errors: ' + error);
      res.redirect('/post/create/?' + error);
    }
    else {
      if (!data.user_id) {
        data.user_id = req.user._id;
      }
      postProvider.save( data, function( error, post) {
        id = post._id;
        res.redirect('/post/' + id);
      });
    }
  });
});

app.post('/post/submit/:id?', loadUser, function(req, res){
  data = {};
  postProvider.findBy_Id(req.params.id, function(error, post) {
    if (req.is_admin || post.user_id == req.user._id) {
      validatePostData(req, function (error, data){
        if (error) {
          console.log('Errors: ' + error);
          res.redirect('/post/' + req.params.id + '/edit/?' + error);
        }
        else {
          postProvider.update({
              _id: req.params.id,
              data : data
            }, function( error, post) {
            res.redirect('/post/' + req.params.id);
          });
        }
      });
    }
    else {
      res.redirect('/');
    }
  });
});

app.get('/post/:id/remove', loadUser, function(req, res, next){
  if (req.params.id === 'null') {
    res.redirect('/users');
  }
  postProvider.findBy_Id(req.params.id, function(error, post) {
    if (req.is_admin || req.user._id === post.user_id) {
      postProvider.removeBy_id(req.params.id, function(error, id){
        console.log('Deleted post ' + id);
      });
      res.redirect('/posts/');
    }
    else {
      res.redirect('/post/' + req.params.id);
    }
  });
});

app.get('/post/:id', loadUser, function(req, res, next){
  postProvider.findBy_Id(req.params.id, function(error, post) {
    userProvider.findById(post.user_id, function(error, user) {
      post.user = user;
      res.render('posts/post', { post: post, title: 'Post > ' + post.title, loggedInUser:req.user });
    });
  });
});

app.get('/posts', loadUser, function(req, res){
  find = {};
  if (req.param('category')) {
    find = {category: req.param('category')};
  }
  postProvider.find(find, function(error, posts) { 
    postUsers = {};
    postUserIds = [];
    for (var i in posts) {
      postUserIds.push(posts[i].user_id);
    }
    postUserIds = postUserIds.unique();
    userProvider.find({_id: {$in: postUserIds}}, function(error, users) {
      postUsers = [];
      for (var i in users) {
        if (users[i]._id) {
          postUsers[users[i]._id] = users[i].name;
        }
      }
      categoryProvider.findAll(function(error, categories) {
        res.render('posts', { title: 'Posts', posts: posts, categories: categories, postUsers: postUsers, loggedInUser:req.user  });
      });
    });
  }, {created_at:-1});
});

app.post('/post/validate/email/', loadUser, function(req, res){
  result = '';
  email = req.param('email_address');
  if (email) {
    userProvider.findOne({username: {$ne: null},email: email}, function (error, user) {
      if (user) {
        result = 'false';
      }
      else {
        result = 'true';
      }
      res.render('validate.jade', {layout:false, result: result});
    });
  }
  else {
    result = 'false';
    console.log('Nothing');
    res.render('validate.jade', {layout:false, result: result});
  }
});


app.get('/users', loadUser, function(req, res){
  userProvider.findAll(function(error, users) { 
    res.render('users', { users: users, title: 'Users', loggedInUser:req.user });
  }, {name:1});
});

app.get('/user/:id/edit', loadUser, function(req, res, next){
  if (req.is_admin || req.params.id == req.user._id) {
    localScripts = '$(document).ready(function(){$(\'#userForm\').validate({rules:{username:{remote: {url:\'/users/validate/username/\',type:\'post\',data:{user_id:' + req.params.id + '}}},email:{remote: {url:\'/users/validate/email/\',type:\'post\',data:{user_id:' + req.params.id + '}}}},messages:{username:{remote: jQuery.format(\'{0} is already in use\')},email:{remote: jQuery.format(\'{0} is already in use\')}, password_confirm:\'Passwords must match.\'}});});';
    userProvider.findById(req.params.id, function(error, user) {
      res.render('users/edit', { user: user, title: 'User ' + req.params.id, loggedInUser:req.user });
    });
  }
  else {
    res.redirect('/users');
  }
});

app.get('/user/:id/remove', loadUser, function(req, res, next){
  if (req.params.id === 'null') {
    res.redirect('/users');
  }
  if (req.is_admin || req.params.id == req.user._id) {
    userProvider.remove(req.params.id, function(error, id){
      console.log('Deleted user ' + id);
    });
    if (req.user._id == req.params.id) { 
      res.redirect('/logout');
    }
    else {
      res.redirect('/users');
    }
  }
  else {
    console.log(typeof req.user._id + ' can\'t delete this user! ' + typeof req.params.id);
    res.redirect('/users')
  }
});

app.get('/user/create', loadUser, function(req, res, next){
  localScripts = '$(document).ready(function(){$(\'#userForm\').validate({rules:{password:{required:true},username:{remote: {url:\'/users/validate/username/\',type:\'post\'}},email:{remote: {url:\'/users/validate/email/\',type:\'post\'}}},messages:{username:{remote: jQuery.format(\'{0} is already in use\')},email:{remote: jQuery.format(\'{0} is already in use\')}, password_confirm:\'Passwords must match.\'}});});';
  res.render('users/create', { title: 'New User', user: {_id:'',username:'',name:'',email:''}, loggedInUser:req.user });
});

app.post('/users/validate/username/', loadUser, function(req, res){
  result = '';
  username = req.param('username');
  user_id = req.param('user_id');
  if (username) {
    console.log('Username! ' + username);
    userProvider.findOne({_id: {$ne: parseInt(user_id)},username: username}, function (error, user) {
      if (error) {
        console.log('Error! ' + error);
      }
      if (user) {
        result = 'false';
      }
      else {
        result = 'true';
      }
      res.render('validate.jade', {layout:false, result: result});
    });
  }
  else {
    result = 'false';
    console.log('Nothing');
    res.render('validate.jade', {layout:false, result: result});
  }
});

app.post('/users/validate/email/', loadUser, function(req, res){
  result = '';
  email = req.param('email');
  user_id = req.param('user_id');
  if (email) {
    console.log('Email! ' + email);
    userProvider.findOne({_id: {$ne: parseInt(user_id)},email: email}, function (error, user) {
      if (user) {
        result = 'false';
      }
      else {
        result = 'true';
      }
      res.render('validate.jade', {layout:false, result: result});
    });
  }
  else {
    result = 'false';
    console.log('Nothing');
    res.render('validate.jade', {layout:false, result: result});
  }
});

app.post('/user/submit/0?', loadUser, function(req, res, next){
  data = {};
  validateUserData(req, function (error, data){
    if (error) {
      console.log('Errors: ' + error);
      res.redirect('/user/create/?' + error);
    }
    else {
      countProvider.getUniqueId('users', function(error, id) {
        data._id = id;
        userProvider.save( data, function( error, docs) {
          res.redirect('/user/' + id);
        });
      });
    }
  });
});

app.post('/user/submit/:id', loadUser, function(req, res){
  if (req.is_admin || req.params.id == req.user._id) {
    data = {};
    validateUserData(req, function (error, data){
      if (error) {
        console.log('Errors: ' + error);
        res.redirect('/user/' + req.params.id + '/edit/?' + error);
      }
      else {
        userProvider.update({
          id: req.params.id,
          data : data
        }, function( error, docs) {
          res.redirect('/user/' + req.params.id);
        });
      }
    });
  }
  else {
    res.redirect('/');
  }
});

app.get('/user/:id', loadUser, function(req, res, next){
  userProvider.findById(req.params.id, function(error, user) {
    postProvider.find({user_id:user._id}, function(error, posts) {
      res.render('users/user', { user: user, posts:posts, title: 'User ' + req.params.id, loggedInUser:req.user });
    },{created_at:-1});
  });
});

app.post('/login', loadUser, function(req, res){
  if (req.param('username') && req.param('password')) {
    userProvider.findOne({username: req.param('username')}, function (error, user) {
      if (error || !user) {
        console.log('Couldn\'t find user! ' + req.param('username'));
      }
      else {
        if (bcrypt.compare_sync(req.param('password'), user.password)) {
          if (req.session) {
            console.log('Someone logged in! ' + req.param('username') + ' ' + user._id);
            req.session.user = user;
            if (req.param('remember') == 'on') {
              res.cookie('rememberme', 'yes', { maxAge: 31557600000});
            }
            else {
              res.cookie('rememberme', 'yes');
            }
          }
        }
        else {
          console.log('Wrong password for ' + user.username + '!');
        }
      }
      res.redirect('back');
    });
  }
  else {
    res.redirect('back');
  }
});

app.get('/logout', function(req, res){
    if (req.session.user) {
      console.log('Logging Out: ' + req.session.user.username);
      delete req.session.user;
      res.clearCookie('rememberme', {path:'/'});
    }
    res.redirect('/');
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
