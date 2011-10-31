var categoryProvider = new DataProvider('category');

exports.add_routes = function (app) {
  app.get('/admin', loadUser, loadCategories, function(req, res){
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

  app.post('/admin/category/submit', loadUser, function(req, res){
    if (req.is_admin) {
      data = {};
      data.name = req.param('name');
      categoryProvider.save(data, function(error, category) {
        res.redirect('/admin/');
      });
    }
    else {
      res.redirect('/');
    }
  });

  app.get('/admin/category/:id/remove', loadUser, function(req, res, next){
    if (req.is_admin && req.params.id !== 'null') {
      categoryProvider.removeBy_id(req.params.id, function(error, id){
        if (error) {
          console.log('Could not delete category ' + id);
        }
      });
    }
    res.redirect('/admin/');
  });
}
