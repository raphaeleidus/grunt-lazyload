'use strict';

var grunt_lazyloader = require('../lib/grunt-lazyload.js').lazyloader;

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

var grunt, gruntInjecter = function() {
  //testing non-functional implementation of grunt
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

exports['lazyloader'] = {
  setUp: function(done) {
    // setup here
    grunt = gruntInjecter();
    grunt_lazyloader.init(grunt);
    done();
  },
  'single task': {
    'register': function(test) {
      test.expect(1);
      // tests here
      grunt_lazyloader.load('PackageName', 'singleTask');
      test.equal(grunt.getCurretCallCounts().registerTask, 1, 'registerTask should be called once');
      test.done();
    },
    'register and run': function(test) {
      test.expect(4);
      // tests here
      grunt_lazyloader.load('PackageName', 'singleTask');
      grunt.task.run('singleTask');
      var callCounts = grunt.getCurretCallCounts();
      test.equal(callCounts.registerTask, 1, 'registerTask should be called once');
      test.equal(callCounts.run, 2, 'run should be called twice');
      test.equal(callCounts.renameTask, 1, 'renameTask should be called once');
      test.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
      test.done();
    }
  },
  'array': {
    'register': function(test) {
      test.expect(1);
      // tests here
      grunt_lazyloader.load('PackageName', ['task1', 'task2', 'task3']);
      test.equal(grunt.getCurretCallCounts().registerTask, 3, 'registerTask should be called three times');
      test.done();
    },
    'register and run': function(test) {
      test.expect(4);
      // tests here
      grunt_lazyloader.load('PackageName', ['task1', 'task2', 'task3']);
      grunt.task.run('task2');
      grunt.task.run('task1');
      var callCounts = grunt.getCurretCallCounts();
      test.equal(callCounts.registerTask, 3, 'registerTask should be called once');
      test.equal(callCounts.run, 3, 'run should be called three times');
      test.equal(callCounts.renameTask, 3, 'renameTask should be called once');
      test.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
      test.done();
    }
  }
};
