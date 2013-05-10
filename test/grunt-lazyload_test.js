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

var grunt, loader, gruntInjecter = function() {
  var callCounts = {registerTask: 0};
  return {
    task: {
      registerTask: function() { callCounts.registerTask++; }
    },
    getCurretCallCounts: function() { return callCounts; }
  };
};

exports['lazyload'] = {
  setUp: function(done) {
    // setup here
    grunt = gruntInjecter();
    loader = grunt_lazyload.lazyload(grunt);
    done();
  },
  'single task register': function(test) {
    test.expect(1);
    // tests here
    loader('PackageName', 'task');
    test.equal(grunt.getCurretCallCounts().registerTask, 1, 'registerTask should be called once');
    test.done();
  },
  'array': function(test) {
    test.expect(1);
    // tests here
    loader('PackageName', ['task1', 'task2', 'task3']);
    test.equal(grunt.getCurretCallCounts().registerTask, 3, 'registerTask should be called three times');
    test.done();
  }
};
