var bcrypt = require('bcrypt'); 
var LoginHelper = require('./login.js');

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

resetPassword = function (userId, callback) {
  //check to see if email exists
  var newPassword = '';
  newPassword = newPassword.randomString(10);
  var salt = bcrypt.gen_salt_sync(10);  
  var hash = bcrypt.encrypt_sync(newPassword, salt);
  var data = {}
  data.password = hash;
  userDb.update(
    {_id: parseInt(userId)}
  , {$set: data}
  , {multi:false,safe:true}
  , function( error, docs) {
      if (error) {
        callback(error);
      }
      else {
        callback(null, newPassword);
      }
  });
}

exports.add_routes = function (app) {

  app.get('/users', loadGlobals, function(req, res){
    userDb.find({username: {$ne:null}}).sort({name: 1}).toArray(function(error, users) { 
      if (error) {
        log.error(error);
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
          log.error(error);
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
    if (req.is_admin) {
      userDb.remove({_id: parseInt(req.params.id)}, function(error, id){
        if (error) {
          log.error(error);
        }
      });
      res.redirect('/users');
    }
    //If a user is deleting their own account, send a confirmation email
    else if (req.params.id == req.user._id) {
      // If they are following the link from their email
      if (req.query.verify) {
        var verify = decodeURIComponent(req.query.verify);
        //find the user info
        userDb.findOne({_id: parseInt(req.params.id)}, function (error, user) {
          if (bcrypt.compare_sync(req.user._id + req.user.created_at, verify)) {
            userDb.remove({_id: parseInt(req.params.id)}, function(error, id){
              if (error) {
                log.error(error);
              }
            });
            LoginHelper.logout(req, res);
            res.render('default', {
              title: 'Your account has been deleted',
              text: 'Goodbye old friend.'
            });
          }
          else {
            res.render('default', {
              title: 'Couldn\'t Delete Account',
              text: 'The verification string did not match, we couldn\'t delete your account. Try again maybe?'
            });
          }
        });
      }
      else {
        var verifySalt = bcrypt.gen_salt_sync(10);  
        var verifyHash = bcrypt.encrypt_sync(req.user._id+req.user.created_at, verifySalt);
        var deleteLink = siteInfo.site_url + "/user/" + req.params.id + "/remove?verify="+verifyHash; 
        var verificationMessage = "Hi!<br /> Click to verify that you want to delete your account: <a href=\"" + deleteLink + "\">" + deleteLink + "</a>";
        mail.message({
          'MIME-Version': '1.0',
          'Content-type': 'text/html;charset=UTF-8',
          from: 'Management <' + siteInfo.site_email  + '>',
          to: [req.user.email],
          subject: 'Confirm Account Removal'
        })
        .body(verificationMessage)
        .send(function(err) {
          if (err) log.error(err);
        });
        res.render('default', {
          title: 'Account Removel Request Sent',
          text: 'We\'ve sent you an email with an account removal link. Go check your mail!'
        });
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

  app.get('/forgot-password', loadGlobals, function(req, res, next){
    res.render('users/forgot-password', {
      title: 'Forgot Password',
      passwordSent: req.query.passwordSent,
      password: '',
      error: req.query.error
    });
  });

  app.post('/forgot-password', loadGlobals, function(req, res, next){
    email = req.param('email');
    if (email) {
      userDb.findOne({email: email}, function (error, user) {
        if (user && user.password) {
          var name = user.name;
          var oldPasswordHash =  encodeURIComponent(user.password);
          var userId = user._id;
          var resetLink = siteInfo.site_url + "/reset-password/?userId="+userId+"&verify="+oldPasswordHash; 
          var resetMessage = "Hi " + name + "!<br /> Click to reset your password: <a href=\"" + resetLink + "\">" + resetLink + "</a>!";
          mail.message({
            'MIME-Version': '1.0',
            'Content-type': 'text/html;charset=UTF-8',
            from: 'Management <' + siteInfo.site_email  + '>',
            to: [email],
            subject: 'Password Reset'
          })
          .body(resetMessage)
          .send(function(err) {
            if (err) log.error(err);
          });
          res.redirect('/forgot-password/?passwordSent=true');
        }
        else {
          res.redirect('/forgot-password/?error=AccountNotFound');
        }
      });
    }
    else {
      res.redirect('/forgot-password/?error=NoEmailGiven');
    }
  });

  app.get('/reset-password', loadGlobals, function(req, res, next){
    var userId = req.query.userId;
    var verify = decodeURIComponent(req.query.verify);
    if (userId && verify) {
      userDb.findOne({_id: parseInt(userId)}, function (error, user) {
        if (user && user.password == verify) {
          resetPassword(userId, function (error, result) {
            if (error) {
              log.error(error);
              res.redirect('/forgot-password/?error=CouldNotReset');
            }
            else {
              res.render('users/forgot-password', {
                title: 'Password Reset',
                passwordSent: '',
                password: result,
                error:'' 
              });
            }
          });
        }
        else {
          res.redirect('/forgot-password/?error=CouldNotFindUser');
        }
      });
    }
    else {
      res.redirect('/forgot-password/?error=noUserIdOrVerify');
    }
  });

  app.post('/users/validate/username/', loadGlobals, function(req, res){
    result = '';
    username = req.param('username');
    user_id = req.param('user_id');
    if (username) {
      userDb.findOne({_id: {$ne: parseInt(user_id)},username: username}, function (error, user) {
        if (error) {
          log.error(error);
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
        log.error(error);
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
          log.error(error);
          res.redirect('/user/' + req.params.id + '/edit/?' + error);
        }
        else {
          userDb.update(
            {_id: parseInt(req.params.id)}
          , {$set: data}
          , {multi:false,safe:true}
          , function( error, docs) {
              if (error) {
                log.error(error);
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
      if (user) {
        postDb.find({user_id:user._id}).sort({created_at:-1}).toArray(function(error, posts) {
          res.render('users/user', { user: user, posts:posts, title: 'User ' + req.params.id });
        });
      }
      else {
        res.render('default', {
          title: 'Uh-oh',
          text: 'We couldn\'t find this user.'
        });
      }
    });
  });

  app.post('/login', loadGlobals, function(req, res){
    if (req.param('username') && req.param('passwordLogin')) {
      userDb.findOne({username: req.param('username')}, function (error, user) {
        if (error || !user) {
          log.trace('Couldn\'t find user! ' + req.param('username') + ' Error:' + user);
        }
        else {
          log.info('loggin in.');
          LoginHelper.login(req, res, user);
        }
        res.redirect('back');
      });
    }
    else {
      res.redirect('back');
    }
  });

  app.get('/logout', function(req, res){
    LoginHelper.logout(req, res);
    res.redirect('/');
  });
}
