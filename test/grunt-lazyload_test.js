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
  var callCounts = {registerTask: 0, run: 0, renameTask: 0, loadNpmTasks: 0};
  var tasks = [];
  return {
    task: {
      registerTask: function(taskName, description, func) { 
        callCounts.registerTask++;
        tasks.push({name:taskName, task: func});
      },
      run: function(taskName) {
        callCounts.run++;
        var toRun = tasks.filter(function(t) { return t.name === taskName; });
        toRun.forEach(function(t) { t.task(); });
      },
      renameTask: function(orinalName, newName) {
        callCounts.renameTask++;
        tasks.forEach(function(t) {
          if(t.name === orinalName) {
            t.name = newName;
          }
        });
      }
    },
    loadNpmTasks: function() {
      callCounts.loadNpmTasks++;
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
    loader('PackageName', 'singleTask');
    test.equal(grunt.getCurretCallCounts().registerTask, 1, 'registerTask should be called once');
    test.done();
  },
  'single task register and run': function(test) {
    test.expect(4);
    // tests here
    loader('PackageName', 'singleTask');
    grunt.task.run('singleTask');
    var callCounts = grunt.getCurretCallCounts();
    test.equal(callCounts.registerTask, 1, 'registerTask should be called once');
    test.equal(callCounts.run, 2, 'run should be called twice');
    test.equal(callCounts.renameTask, 1, 'renameTask should be called once');
    test.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
    test.done();
  },
  'array task register': function(test) {
    test.expect(1);
    // tests here
    loader('PackageName', ['task1', 'task2', 'task3']);
    test.equal(grunt.getCurretCallCounts().registerTask, 3, 'registerTask should be called three times');
    test.done();
  },
  'array task register and run': function(test) {
    test.expect(4);
    // tests here
    loader('PackageName', ['task1', 'task2', 'task3']);
    grunt.task.run('task2');
    var callCounts = grunt.getCurretCallCounts();
    test.equal(callCounts.registerTask, 3, 'registerTask should be called once');
    test.equal(callCounts.run, 2, 'run should be called twice');
    test.equal(callCounts.renameTask, 3, 'renameTask should be called once');
    test.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
    test.done();
  }
};
