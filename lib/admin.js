
exports.add_routes = function (app) {
  app.get('/admin', loadGlobals, loadCategories, function(req, res){
    if (req.is_admin) {
      res.render('admin', {
        title: 'Admin',
        headContent:'admin'
      });
    }
    else {
      res.redirect('/');
    }
  });

  app.post('/admin/category/submit', loadGlobals, function(req, res){
    if (req.is_admin) {
      data = {};
      data.name = req.param('name');
      categoryDb.save(data, function(error, category) {
        res.redirect('/admin/');
      });
    }
    else {
      res.redirect('/');
    }
  });

  app.get('/admin/category/:id/remove', loadGlobals, function(req, res, next){
    if (req.is_admin && req.params.id !== 'null') {
      categoryDb.removeById(req.params.id, function(error, id){
        if (error) {
          log.error('Could not delete category ' + id);
        }
      });
    }
    res.redirect('/admin/');
  });
}
