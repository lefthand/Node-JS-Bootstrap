var vows = require('vows');
var assert = require('assert');
var request = require('request');
var PostHelper = require('../lib/post.js');

vows.describe('Creating a Post').addBatch({
  'Checking': {
    'ajax validate existing email address': {
      topic: function() {
        request({ method: 'POST',
                  url: 'http://localhost:3000/post/validate/email/?email=justin@example.com'
                }, this.callback);
      },
      'will be rejected': function (error, res, body) {
        assert.match(body, /false/);
      }
    },
    'Loading create post page': {
      topic: function() {
        request('http://localhost:3000/post/create/', this.callback);
      },
      'will be allowed': function (error, res, body) {
        assert.match(body, /Create/);
      }
    }
  }
}).export(module);
