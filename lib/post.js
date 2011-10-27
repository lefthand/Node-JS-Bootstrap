var postProvider = new DataProvider('post');
var countProvider = new DataProvider('count');

exports.validatePostData = function (req, callback) {
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
