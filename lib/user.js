var bcrypt = require('bcrypt'); 

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
    data.modified_at = new Date();
    if (!req.params.id) {
      data.created_at = new Date();
    }
    if (req.user.is_root) {
      data.is_root = req.param('is_root');
      data.is_admin = req.param('is_admin');
    }
    userDb.find({_id: {$ne: parseInt(req.params.id)},
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

  app.get('/users', loadGlobals, function(req, res){
    userDb.find({username: {$ne:null}}).sort({name: 1}).toArray(function(error, users) { 
      if (error) {
        handleError(error);
      }
      else {
        res.render('users', { users: users, title: 'Users'});
      }
    });
  });

  app.get('/user/:id/edit', loadGlobals, function(req, res, next){
    if (req.is_admin || req.params.id == req.user._id) {
      userDb.findOne({_id: parseInt(req.params.id)}, function(error, user) {
        if (error) {
          handleError(error);
        }
        else {
          res.render('users/edit', {
            user: user,
            title: 'User ' + req.params.id, 
            headContent: 'user_edit'
          });
        }
      });
    }
    else {
      res.redirect('/users');
    }
  });

  app.get('/user/:id/remove', loadGlobals, function(req, res, next){
    if (req.params.id === 'null') {
      res.redirect('/users');
    }
    if (req.is_admin || req.params.id == req.user._id) {
      userDb.remove({_id: parseInt(req.params.id)}, function(error, id){
        if (error) {
          handleError(error);
        }
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

  app.get('/user/create', loadGlobals, function(req, res, next){
    res.render('users/create', {
      title: 'New User',
      user: {_id:'',username:'',name:'',email:''},
      headContent: 'user_create'
    });
  });

  app.post('/users/validate/username/', loadGlobals, function(req, res){
    result = '';
    username = req.param('username');
    user_id = req.param('user_id');
    if (username) {
      userDb.findOne({_id: {$ne: parseInt(user_id)},username: username}, function (error, user) {
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

  app.post('/users/validate/email/', loadGlobals, function(req, res){
    result = '';
    email = req.param('email');
    user_id = req.param('user_id');
    if (email) {
      userDb.findOne({_id: {$ne: parseInt(user_id)}, username: {$ne: null},email: email}, function (error, user) {
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

  app.post('/user/submit/0?', loadGlobals, function(req, res, next){
    data = {};
    validateUserData(req, function (error, data){
      if (error) {
        handleError(error);
        res.redirect('/user/create/?' + error);
      }
      else {
        if (!data._id) {
          getNextInt('users', function(error, id) {
            data._id = id;
            userDb.save( data, function( error, docs) {
              res.redirect('/user/' + id);
            });
          });
        }
        else {
          userDb.save( data, function( error, docs) {
            res.redirect('/user/' + data._id);
          });
        }
      }
    });
  });

  app.post('/user/submit/:id', loadGlobals, function(req, res){
    if (req.is_admin || req.params.id == req.user._id) {
      data = {};
      validateUserData(req, function (error, data){
        if (error) {
          handleError(error);
          res.redirect('/user/' + req.params.id + '/edit/?' + error);
        }
        else {
          userDb.update(
            {_id: parseInt(req.params.id)}
          , {$set: data}
          , {multi:false,safe:true}
          , function( error, docs) {
              if (error) {
                handleError(error);
              }
              res.redirect('/user/' + req.params.id);
          });
        }
      });
    }
    else {
      res.redirect('/');
    }
  });

  app.get('/user/:id', loadGlobals, function(req, res, next){
    userDb.findOne({_id: parseInt(req.params.id)}, function(error, user) {
      postDb.find({user_id:user._id}).sort({created_at:-1}).toArray(function(error, posts) {
        res.render('users/user', { user: user, posts:posts, title: 'User ' + req.params.id });
      });
    });
  });
}
