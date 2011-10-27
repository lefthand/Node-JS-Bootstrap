var bcrypt = require('bcrypt'); 
var userProvider = new DataProvider('users');

exports.validateUserData = function (req, callback) {
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

