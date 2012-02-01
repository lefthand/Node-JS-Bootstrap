This project serves to give a basic node.js setup using mongodb. This aims to be a bootstrap for other projects to be built upon providing a robust yet basic framework to build on. This is far from a 'feature complete' web site, but everything included should be a solid as possible. If you start a project based on this please let me know!

Setup
=====
Run 'npm install express -g' if you haven't done so, then 'npm install -d' to bring in all requires. Make sure that mongodb is running locally. Copy mailConfigDefault.js to mailConfigLocal.js and edit values to get email functionality. Insert into the mongodb collection 'bootstrap.user' a record like:

{
  "_id" : 1,
  "created_at" : ISODate("2011-10-08T21:43:43.934Z"),
  "email" : "YOUR EMAIL ADDRESS",
  "is_admin" : on,
  "is_root" : on,
  "modified_at" : ISODate("2012-01-15T18:26:40.183Z"),
  "name" : "YOUR NAME",
  "password" : "",
  "username" : "YOUR ARBITRARY USER NAME"
}

Then use the password reset link to get your password.

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
 


  
