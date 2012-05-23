var exec = require('tooljs').exec;

task('default', ['deploy']);

task('clean', [], function () {
  exec([], {verbose: false}, function () { complete(); })
    .rm('deploy/*', {recursive: true})
  ;
}, true);

task('deploy', ['clean'], function () {
  exec([], {verbose: true}, function () { complete(); })
    .cp('public', 'deploy', {recursive: true})
  ;
});
