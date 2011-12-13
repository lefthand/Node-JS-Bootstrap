var mongo = require('mongoskin');

exports.getArray = function () {
  return [1, 2, 3, 4];
}

validatePostData = function (req, callback) {
  errors = [];
  data = {};
  
  if (!req.param) {
    errors.push('No post to validate!');  
  }
  else {
    if (!req.param('title')) {
      errors.push('Title required.');  
    }
    if (!req.param('content')) {
      errors.push('Content required.');  
    }
  }
  if (errors.length > 0) {
    callback(errors);
  }
  else {
    data.title = req.param('title');
    data.content = req.param('content');
    data.category = req.param('category');
    data.modified_at = new Date();
    if (!req.user._id && !req.param('_id')) {
      data.created_at = new Date();
      if (!req.param('email')) {
        callback('Email address required.');
      }
      else {
        userDb.findOne({email: req.param('email')}, function( error, user) {
          if (user && user.username) {
            callback('Please log in to post with this email address.');
          }
          else if (user && !user.username) {
            data.user_id = user._id;
            callback( null, data);
          }
          else {
            newUserInfo = {email: req.param('email')};
            newUserInfo.created_at = new Date();
            newUserInfo.modified_at_at = new Date();
            getNextInt('users', function(error, id) {
              newUserInfo._id = id;
              data.user_id = id;
              userDb.save( newUserInfo );
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

  app.get('/post/create', loadGlobals, loadCategories, function(req, res){
    res.render('posts/create', {
      title: 'New Post',
      post: {_id:'',title:'',category:'',content:''},
      headContent:'post_create' 
    });
  });

  app.post('/post/submit/0?', loadGlobals, function(req, res){
    data = {};
    validatePostData(req, function (error, data){
      if (error) {
        handleError(error);
        res.redirect('/post/create/?' + error);
      }
      else {
        if (!data.user_id) {
          data.user_id = req.user._id;
        }
        postDb.save( data, function( error, post) {
          id = post._id;
          // Set session value so we can push out new post
          req.session.newPost = {title: post.title, _id: id};
          res.redirect('/post/' + id);
        });
      }
    });
  });

  app.get('/post/:id/edit', loadGlobals, loadCategories, loadPost, function(req, res, next){
    if (req.is_admin || req.user._id === req.post.user_id) {
      res.render('posts/edit', {
        title: 'Post ' + req.post.title,
        headContent:'post_edit'
      });
    }
    else {
      res.redirect('/post/' + req.params.id);
    }
  });

  app.get('/post/:id/remove', loadGlobals, loadPost, function(req, res, next){
    if (req.params.id === 'null') {
      res.redirect('/users');
    }
    if (req.is_admin || req.user._id === req.post.user_id) {
      postDb.removeById(req.params.id, function(error, id){
        if (error) {
          handleError(error);
        }
      });
      res.redirect('/posts/');
    }
    else {
      res.redirect('/post/' + req.params.id);
    }
  });

  app.get('/post/:id', loadGlobals, loadPost, function(req, res){
    userDb.findOne({_id: parseInt(req.post.user_id)}, function(error, user) {
      req.post.user = user;
      res.render('posts/post', { title: 'Post > ' + req.post.title });
    });
  });

  app.post('/post/validate/email/', loadGlobals, function(req, res){
    result = '';
    email = req.param('email');
    if (email) {
      userDb.findOne({username: {$ne: null},email: email}, function (error, user) {
        if (user) {
          result = 'false';
        }
        else {
          result = 'true';
        }
        res.render('validate.jade', {layout:false, result: result});
      });
    }
    else {
      result = 'false';
      res.render('validate.jade', {layout:false, result: result});
    }
  });

  app.post('/post/submit/:id?', loadGlobals, loadPost, function(req, res){
    data = {};
    if (req.is_admin || req.post.user_id == req.user._id) {
      validatePostData(req, function (error, data){
        if (error) {
          handleError('Errors: ' + error);
          res.redirect('/post/' + req.params.id + '/edit/?' + error);
        }
        else {
          postDb.updateById(
            req.params.id,
            {$set: data},
            {multi:false,safe:true},
            function(error, post) {
              if (error) {
                handleError(error);
              }
              res.redirect('/post/' + req.params.id);
            }
          );
        }
      });
    }
    else {
      res.redirect('/');
    }
  });

  app.get('/posts', loadGlobals, loadCategories, function(req, res){
    find = {};
    if (req.param('category')) {
      find = {category: req.param('category')};
    }
    postDb.find(find).sort({created_at:-1}).toArray(function(error, posts) { 
      postUsers = {};
      postUserIds = [];
      for (var i in posts) {
        postUserIds.push(posts[i].user_id);
      }
      postUserIds = postUserIds.unique();
      userDb.find({_id: {$in: postUserIds}}).toArray(function(error, users) {
        postUsers = [];
        if (error) {
          handleError(error);
        }
        else {
          for (var i in users) {
            if (users[i]._id) {
              postUsers[users[i]._id] = users[i].name;
            }
          }
        }
        res.render('posts', { 
          title: 'Posts',
          posts: posts,
          postUsers: postUsers
        });
      });
    });
  });
}
