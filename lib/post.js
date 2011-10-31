var postProvider = new DataProvider('post');
var userProvider = new DataProvider('users');
var categoryProvider = new DataProvider('category');
var countProvider = new DataProvider('count');

validatePostData = function (req, callback) {
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

exports.add_routes = function (app) {

  app.get('/post/create', loadStuff, function(req, res){
    categoryProvider.findAll(function(error, categories) {
      res.render('posts/create', {
        title: 'New Post',
        post: {_id:'',title:'',category:'',content:''},
        categories: categories, 
        headContent:'post_create' 
      });
    }, {name:1});
  });
  app.post('/post/submit/0?', loadStuff, function(req, res){
    data = {};
    validatePostData(req, function (error, data){
      if (error) {
        console.log('Errors: ' + error);
        res.redirect('/post/create/?' + error);
      }
      else {
        if (!data.user_id) {
          data.user_id = req.user._id;
        }
        postProvider.save( data, function( error, post) {
          id = post._id;
          // Set session value so we can push out new post
          req.session.newPost = {title: post.title, _id: id};
          res.redirect('/post/' + id);
        });
      }
    });
  });

  app.get('/post/:id/edit', loadStuff, function(req, res, next){
    postProvider.findBy_Id(req.params.id, function(error, post) {
      if (req.is_admin || req.user._id === post.user_id) {
        categoryProvider.findAll(function(error, categories) {
          res.render('posts/edit', {
            title: 'Post ' + post.title,
            post: post,
            categories: categories,
            headContent:'post_edit'
          });
        }, {name:1});
      }
      else {
        res.redirect('/post/' + req.params.id);
      }
    });
  });

  app.get('/post/:id/remove', loadStuff, function(req, res, next){
    if (req.params.id === 'null') {
      res.redirect('/users');
    }
    postProvider.findBy_Id(req.params.id, function(error, post) {
      if (req.is_admin || req.user._id === post.user_id) {
        postProvider.removeBy_id(req.params.id, function(error, id){
          console.log('Deleted post ' + id);
        });
        res.redirect('/posts/');
      }
      else {
        res.redirect('/post/' + req.params.id);
      }
    });
  });

  app.get('/post/:id', loadStuff, function(req, res, next){
    postProvider.findBy_Id(req.params.id, function(error, post) {
      userProvider.findById(post.user_id, function(error, user) {
        post.user = user;
        res.render('posts/post', { post: post, title: 'Post > ' + post.title, globals:req.globals });
      });
    });
  });

  app.post('/post/validate/email/', loadStuff, function(req, res){
    result = '';
    email = req.param('email_address');
    if (email) {
      userProvider.findOne({username: {$ne: null},email: email}, function (error, user) {
        if (user) {
          result = 'false';
          console.log('false:' + JSON.stringify(user));
        }
        else {
          result = 'true';
          console.log('true:' + JSON.stringify(user));
        }
        res.render('validate.jade', {layout:false, result: result});
      });
    }
    else {
      result = 'false';
      res.render('validate.jade', {layout:false, result: result});
    }
  });

  app.post('/post/submit/:id?', loadStuff, function(req, res){
    data = {};
    postProvider.findBy_Id(req.params.id, function(error, post) {
      if (req.is_admin || post.user_id == req.user._id) {
        validatePostData(req, function (error, data){
          if (error) {
            console.log('Errors: ' + error);
            res.redirect('/post/' + req.params.id + '/edit/?' + error);
          }
          else {
            postProvider.update({
                _id: req.params.id,
                data : data
              }, function( error, post) {
              res.redirect('/post/' + req.params.id);
            });
          }
        });
      }
      else {
        res.redirect('/');
      }
    });
  });

  app.get('/posts', loadStuff, function(req, res){
    find = {};
    if (req.param('category')) {
      find = {category: req.param('category')};
    }
    postProvider.find(find, function(error, posts) { 
      postUsers = {};
      postUserIds = [];
      for (var i in posts) {
        postUserIds.push(posts[i].user_id);
      }
      postUserIds = postUserIds.unique();
      userProvider.find({_id: {$in: postUserIds}}, function(error, users) {
        postUsers = [];
        for (var i in users) {
          if (users[i]._id) {
            postUsers[users[i]._id] = users[i].name;
          }
        }
        categoryProvider.findAll(function(error, categories) {
          res.render('posts', { title: 'Posts', posts: posts, categories: categories, postUsers: postUsers, globals:req.globals  });
        });
      });
    }, {created_at:-1});
  });
}

exports.add_route = function (app) {
};
