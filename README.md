This project serves to give a basic node.js setup using mongodb. This aims to be a bootstrap for other projects to be built upon providing a robust yet basic framework to build on. This is far from a 'feature complete' web site, but everything included should be a solid as possible. If you start a project based on this please let me know!

Setup
=====
Run 'npm install express -g' if you have done so then 'npm install -d' to bring in all requires. I think there's some other step in here but I can't remember now! Make sure that mongodb is running locally. Copy mailConfigDefault.js to mailConfigLocal.js and edit values to get email functionality. Insert into the mongodb collection 'bootstrap' a record like:

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
  
-  Create members - DONE
-  Users can create their own accounts - DONE
-  Users can update or delete their own accouts - DONE
-  Admin can update or delete any user record - DONE
-  Root users can do all that admin can plus create admins - DONE
-  User list and detail available to all - DONE
-  Users can log in and log out - DONE
-  Users can choose to remain logged in indefinitely - DONE
-  A generic 'post' can be add - DONE
-  If the user is not logged in when posting, a basic account is created - DONE
-  The basic account cannot log in - DONE
-  If a user posts with an email address of an existing account, they must log in - DONE
-  Users can edit or delete their posts - DONE
-  Admin can edit or delete any post - DONE
-  Post list and detail page available to all - DONE
-  Both in line and post submit verification of data - DONE
-  Passwords are hashed and secure - DONE
-  Basic styles and two column design - DONE
-  New posts are automatically pushed to users - DONE
-  Vows used for unit testing - DONE
-  Email users at appropriate times
-  Verify user accounts via email
-  Forgot password / username links - DONE
-  Log in with either username or email


Contribute! 
=====
Any feedback is most welcome. If you want to contribute some code, all the better.
 


  
