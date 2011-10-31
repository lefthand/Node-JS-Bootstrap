var bcrypt = require('bcrypt'); 
var userProvider = new DataProvider('users');
var postProvider = new DataProvider('post');
var countProvider = new DataProvider('count');

validateUserData = function (req, callback) {
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
            if (users[i].email == req.param('email') && users[i].username) {
              errors.push('Email Address already taken.');  
            }
            else if (users[i].email == req.param('email')  && !users[i].username) {
              data._id = users[i]._id;
            }
          }
        }
        if (errors.length == 0) {
          callback( null, data);
        }
        else {
          callback(errors);
        }
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

exports.add_routes = function (app) {

  app.get('/users', loadUser, function(req, res){
    userProvider.find({username: {$ne:null}}, function(error, users) { 
      res.render('users', { users: users, title: 'Users'});
    }, {name:1});
  });

  app.get('/user/:id/edit', loadUser, function(req, res, next){
    if (req.is_admin || req.params.id == req.user._id) {
      userProvider.findById(req.params.id, function(error, user) {
        res.render('users/edit', {
          user: user,
          title: 'User ' + req.params.id, 
          headContent: 'user_edit'
        });
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
      res.redirect('/users')
    }
  });

  app.get('/user/create', loadUser, function(req, res, next){
    res.render('users/create', {
      title: 'New User',
      user: {_id:'',username:'',name:'',email:''},
      headContent: 'user_create'
    });
  });

  app.post('/users/validate/username/', loadUser, function(req, res){
    result = '';
    username = req.param('username');
    user_id = req.param('user_id');
    if (username) {
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
      res.render('validate.jade', {layout:false, result: result});
    }
  });

  app.post('/users/validate/email/', loadUser, function(req, res){
    result = '';
    email = req.param('email');
    user_id = req.param('user_id');
    if (email) {
      userProvider.findOne({_id: {$ne: parseInt(user_id)}, username: {$ne: null},email: email}, function (error, user) {
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
        if (!data._id) {
          countProvider.getUniqueId('users', function(error, id) {
            data._id = id;
            userProvider.save( data, function( error, docs) {
              res.redirect('/user/' + id);
            });
          });
        }
        else {
          userProvider.save( data, function( error, docs) {
            res.redirect('/user/' + data._id);
          });
        }
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
        res.render('users/user', { user: user, posts:posts, title: 'User ' + req.params.id });
      },{created_at:-1});
    });
  });
}
