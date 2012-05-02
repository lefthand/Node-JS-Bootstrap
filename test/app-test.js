var vows = require('vows');
var assert = require('assert');
var request = require('request');

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
    'Text': {
      topic: function() {
        return {someText:"fun"}  
      },
      'will also be fun': function (error, res) {
        assert.match(res.someText, /fun/);
      }
    }
  }
}).export(module);
