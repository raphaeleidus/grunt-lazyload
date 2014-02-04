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
  var callCounts = {registerTask: 0, run: 0, renameTask: 0, loadNpmTasks: 0}
    , tasks = []
    , mocks = {}
    , module;
  module = {
    task: {
      registerTask: function(taskName, description, fn) {
        callCounts.registerTask++;
        tasks.push({name:taskName, description: description, task: fn});
      },
      run: function(taskName) {
        var taskParams = taskName.split(':');
        taskName = taskParams.shift();
        callCounts.run++;
        var toRun = tasks.filter(function(t) { return t.name === taskName; });
        toRun.forEach(function(t) { t.task.apply(t, taskParams); });
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
    loadNpmTasks: function(packageName) {
      if(mocks[packageName]) {
        module.task.registerTask(mocks[packageName].name, 'mocked '+mocks[packageName].name, mocks[packageName].fn);
      }
      callCounts.loadNpmTasks++;
    },
    getCurretCallCounts: function() { return callCounts; },
    mockNpmTask: function(packageName, taskName, fn) {
      mocks[packageName] = { name: taskName, fn: fn };
    }
  }
  return module;
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
  'single task with params': {
    'register and run': function(test) {
      test.expect(3);
      //tests here
      grunt_lazyloader.load('MultiTask', 'multiTask');
      grunt_lazyloader.load('MultiTask-np', 'multiTask-np');
      grunt.mockNpmTask('MultiTask', 'multiTask', function(param1, param2) {
        test.equal(param1, 'foo', 'first paramater should be foo');
        test.equal(param2, 'bar', 'second paramater should be bar');
      });
      grunt.mockNpmTask('MultiTask-np', 'multiTask-np', function() {
        test.equal(arguments.length, 0, 'no paramaters passed');
      });
      grunt.task.run('multiTask:foo:bar');
      grunt.task.run('multiTask-np');
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
