var bcrypt = require('bcrypt'); 
var userProvider = new DataProvider('users');

exports.add_routes = function (app) {
  app.post('/login', loadStuff, function(req, res){
    if (req.param('username') && req.param('passwordLogin')) {
      userProvider.findOne({username: req.param('username')}, function (error, user) {
        if (error || !user) {
          console.log('Couldn\'t find user! ' + req.param('username'));
        }
        else {
          console.log('loggin in.');
          if (bcrypt.compare_sync(req.param('passwordLogin'), user.password)) {
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
}
