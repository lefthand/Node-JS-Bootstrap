This project serves to give a basic node.js setup using mongodb. This aims to be a bootstrap for other projects providing a robust yet basic framework on which to build. This is far from a 'feature complete' web site, but everything included should be a solid as possible. If you start a project based on this please let me know!

[![Build Status](https://secure.travis-ci.org/lefthand/Node-JS-Bootstrap.png)](http://travis-ci.org/lefthand/Node-JS-Bootstrap)

Setup
=====
Run 'npm install express -g' if you haven't done so, then 'npm install -d' to bring in all requires. Make sure that mongodb is running locally. Copy configDefault.js to configLocal.js and edit values to set the mongo database name, site settings, and get email functionality. 

The first time you run app.js a root user will be created for you. The login credentials will be output to the the console. 


Stack
=====

-  node.js
-  express
-  jade
-  mail
-  mongodb
-  mongo-skin
-  connect-redis
-  bcrypt
-  socket.io
-  jquery

Goals
=====
  
-  Create members
-  Users can create their own accounts
-  Users can update or delete their own accouts
-  Admin can update or delete any user record
-  Root users can do all that admin can plus create admins
-  User list and detail available to all
-  Users can log in and log out
-  Users can choose to remain logged in indefinitely
-  A generic 'post' can be add
-  If the user is not logged in when posting, a basic account is created
-  The basic account cannot log in
-  If a user posts with an email address of an existing account, they must log in
-  Users can edit or delete their posts
-  Admin can edit or delete any post
-  Post list and detail page available to all
-  Both in line and post submit verification of data
-  Passwords are hashed and secure
-  Basic styles and two column design
-  New posts are automatically pushed to users
-  Vows used for unit testing
-  Verify user accounts via email
-  Forgot password / username links
-  Anonymous posts require verification
-  Anonymous posts can be deleted with verification
-  Log in with either username or email - TODO
-  User and posts lists use pagination - TODO
-  User and post lists can be filtered with ajax - TODO
-  RSS feeds are built automatically - TODO


Contribute! 
=====
Any feedback is most welcome. If you want to contribute some code, all the better.
