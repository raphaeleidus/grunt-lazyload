'use strict';

var grunt_lazyload = require('../lib/grunt-lazyload.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

var gruntInjecter = function(test) { 
  return {
    task: {
      registerTask: function() { test.ok('registerTaskCalled'); }
    }
  };
};

exports['lazyload'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'single task register': function(test) {
    test.expect(1);
    // tests here
    var grunt = gruntInjecter(test),
        loader = grunt_lazyload.lazyload(grunt);
    loader('PackageName', 'task');
    test.done();
  },
  'array': function(test) {
    test.expect(3);
    // tests here
    var grunt = gruntInjecter(test),
        loader = grunt_lazyload.lazyload(grunt);
    loader('PackageName', ['task1', 'task2', 'task3']);
    test.done();
  }
};
