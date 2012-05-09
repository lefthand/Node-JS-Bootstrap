var vows = require('vows');
var assert = require('assert');
var request = require('request');
var request = require('../app.js');
var mongo = require('mongoskin');

vows.describe('General Pages').addBatch({
  'From site config settings': {
    'the site url': {
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
    }
  }
}).export(module);
