var bcrypt = require('bcrypt'); 

exports.login = function (req, res, user) {
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

exports.logout = function (req, res) {
  if (req.session.user) {
    log.info('Logging Out: ' + req.session.user.username);
    delete req.session.user;
    res.clearCookie('rememberme', {path:'/'});
  }
}
