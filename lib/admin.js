var categoryProvider = new DataProvider('category');

exports.add_routes = function (app) {
  app.get('/admin', loadStuff, function(req, res){
    if (req.is_admin) {
      categoryProvider.findAll(function(error, categories) {
        res.render('admin', {
          title: 'Admin',
          categories:categories, 
          headContent:'admin'
        });
      },{name:1});
    }
    else {
      res.redirect('/');
    }
  });

  app.post('/admin/category/submit', loadStuff, function(req, res){
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

  app.get('/admin/category/:id/remove', loadStuff, function(req, res, next){
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
