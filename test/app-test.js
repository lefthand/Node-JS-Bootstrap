var vows = require('vows');
var assert = require('assert');
var request = require('request');

vows.describe('General Pages').addBatch({
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
  }
}).export(module);
