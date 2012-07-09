var vows = require('vows');
var assert = require('assert');
var request = require('request');
var app = require('../app.js')();

vows.describe('General Pages').addBatch({
  'Start the server': {
    topic: function () {
      var cb = this.callback;
      // Wait for the server to trigger the listening event before we start testing.
      app.on('listening',function () {
        console.log('Server ready for testing.');
        cb();
      });
    },
    'Loading page': {
      'About': {
        topic: function() {
           request(siteInfo.site_url + '/about', this.callback);
         },
         'will come up just fine': function (error, res) {
           assert.equal(res.statusCode, 200);
         }
      },
      'Admin': {
        topic: function() {
           request(siteInfo.site_url + '/admin', this.callback);
         },
         'will redirect to the index page': function (error, res, body) {
           assert.match(body, /Welcome/);
         }
      }
    },
    'ajax validate existing email address for posts': {
      topic: function() {
         request({ method: 'POST',
             url: siteInfo.site_url + '/post/validate/email/?email_address=admin@example.com'
             }, this.callback);
       },
       'will be rejected': function (error, res, body) {
         assert.match(body, /false/);
       }
    },
    'ajax validate new email address for posts': {
      topic: function() {
         request({ method: 'POST',
             url: siteInfo.site_url + '/post/validate/email/?email_address=this_is_a_new_email_address1234@example.com'
             }, this.callback);
       },
       'will be accepted': function (error, res, body) {
         assert.match(body, /true/);
       }
    },
    'ajax validate existing email address for a user': {
      topic: function() {
         request({ method: 'POST',
             url: siteInfo.site_url + '/users/validate/email/?email_address=admin@example.com'
             }, this.callback);
       },
       'will be rejected': function (error, res, body) {
         assert.match(body, /false/);
       }
    },
    'ajax validate new email address for a user': {
      topic: function() {
         request({ method: 'POST',
             url: siteInfo.site_url + '/post/validate/email/?email_address=this_is_a_new_email_address1234@example.com'
             }, this.callback);
       },
       'will be accepted': function (error, res, body) {
         assert.match(body, /true/);
       }
    },
    'ajax validate existing username': {
      topic: function() {
         request({ method: 'POST',
             url: siteInfo.site_url + '/users/validate/username/?username=admin'
             }, this.callback);
       },
       'will be rejected': function (error, res, body) {
         assert.match(body, /false/);
       }
    },
    'ajax validate new username': {
      topic: function() {
         request({ method: 'POST',
             url: siteInfo.site_url + '/users/validate/username/?username=this_is_a_new_username'
             }, this.callback);
       },
       'will be accepted': function (error, res, body) {
         assert.match(body, /true/);
       }
    },
  },
  'The site url in the config settings': {
    topic: function() {
      return siteInfo
    },
    'will be a string': function (error, res) {
      assert.isString(res.site_url);
    }
  },
  'Random Text': {
    topic: function() {
      var randomText = '';
      randomText = randomText.randomString(10);
      return {someText:randomText}  
    },
    'will be random': function (error, res) {
      assert.match(res.someText, /[a-zA-Z0-9]{10}/);
    }
  },
}).export(module);
