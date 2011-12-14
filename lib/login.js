var bcrypt = require('bcrypt'); 

exports.add_routes = function (app) {
  app.post('/login', loadGlobals, function(req, res){
    if (req.param('username') && req.param('passwordLogin')) {
      userDb.findOne({username: req.param('username')}, function (error, user) {
        if (error || !user) {
          log.trace('Couldn\'t find user! ' + req.param('username') + ' Error:' + user);
        }
        else {
          log.info('loggin in.');
          if (bcrypt.compare_sync(req.param('passwordLogin'), user.password)) {
            if (req.session) {
              log.info('Someone logged in! ' + req.param('username') + ' ' + user._id);
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
            log.trace('Wrong password for ' + user.username + '!');
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
        log.info('Logging Out: ' + req.session.user.username);
        delete req.session.user;
        res.clearCookie('rememberme', {path:'/'});
      }
      res.redirect('/');
  });
}
