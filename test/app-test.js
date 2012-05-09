var vows = require('vows');
var assert = require('assert');
var request = require('request');
require('../app.js');

vows.describe('General Pages').addBatch({
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
    'Loading page': {
      'About': {
  topic: function() {
           request('http://localhost:3000/about', this.callback);
         },
         'will come up just fine': function (error, res) {
           assert.equal(res.statusCode, 200);
         }
      },
      'Admin': {
  topic: function() {
           request('http://localhost:3000/admin', this.callback);
         },
         'will redirect to the index page': function (error, res, body) {
           assert.match(body, /Welcome/);
         }
      }
    },
    'ajax validate existing email address': {
      topic: function() {
         request({ method: 'POST',
             url: 'http://localhost:3000/post/validate/email/?email=admin@example.com'
             }, this.callback);
       },
       'will be rejected': function (error, res, body) {
         assert.match(body, /false/);
       }
    },
}).export(module);
