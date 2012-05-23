var exec = require('tooljs').exec
  , path = require('path')
;

task('default', ['deploy']);

task('clean', [], function () {
  exec([], {verbose: false}, function () { complete(); })
    .rm('deploy/*', {recursive: true})
  ;
}, true);

task('deploy', ['clean'], function () {
  var dest = 'deploy';
  exec([], {verbose: true}, function () { complete(); })
    .cp('lib', dest, {recursive: true})
    .cp('views', dest, {recursive: true})
    .cp('public', dest, {recursive: true})
    .cp('app.js', dest)
    .cp('configDefault.js', path.join(dest, 'configLocal.js'))
  ;
});
