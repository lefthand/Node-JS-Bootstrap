var vows = require('vows');
var assert = require('assert');
var request = require('request');
var request = require('../app.js');

vows.describe('General Pages').addBatch({
  'Looking at some': {
    'Numbers': {
      topic: function() {
        return {aNumber:2}  
      },
      'will be fun': function (error, res) {
        assert.equal(res.aNumber, 2);
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
