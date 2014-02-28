'use strict';

var grunt_lazyload = require('../lib/grunt-lazyload.js');
var assert = require("assert");

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
  };
  return module;
};

suite('lazyloader', function(){
  setup(function(){
    grunt = gruntInjecter();
    grunt_lazyload(grunt);
  });

  suite('single', function(){
    test('should register task', function(){
      grunt.lazyLoadNpmTasks('PackageName', 'singleTask');
      assert.equal(grunt.getCurretCallCounts().registerTask, 1, 'registerTask should be called once');
    });

    test('should register and run', function(){
      grunt.lazyLoadNpmTasks('PackageName', 'singleTask');
      grunt.task.run('singleTask');
      var callCounts = grunt.getCurretCallCounts();
      assert.equal(callCounts.registerTask, 1, 'registerTask should be called once');
      assert.equal(callCounts.run, 2, 'run should be called twice');
      assert.equal(callCounts.renameTask, 1, 'renameTask should be called once');
      assert.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
    });
  });

  suite('single task with params', function(){
    test('should register and run with params', function(){
      grunt.lazyLoadNpmTasks('MultiTask', 'multiTask');
      grunt.lazyLoadNpmTasks('MultiTask-np', 'multiTask-np');
      grunt.mockNpmTask('MultiTask', 'multiTask', function(param1, param2){
        assert.equal(param1, 'foo', 'first paramater should be foo');
        assert.equal(param2, 'bar', 'second paramater should be bar');
      });
      grunt.mockNpmTask('MultiTask-np', 'multiTask-np', function(){
        assert.equal(arguments.length, 0, 'no paramaters passed');
      });
      grunt.task.run('multiTask:foo:bar');
      grunt.task.run('multiTask-np');
    });
  });

  suite('array of tasks', function(){
    test('should register all tasks', function(){
      grunt.lazyLoadNpmTasks('PackageName', ['task1', 'task2', 'task3']);
      assert.equal(grunt.getCurretCallCounts().registerTask, 3, 'registerTask should be called three times');
    });

    test('should register and run', function(){
      grunt.lazyLoadNpmTasks('PackageName', ['task1', 'task2', 'task3']);
      grunt.task.run('task2');
      grunt.task.run('task1');
      var callCounts = grunt.getCurretCallCounts();
      assert.equal(callCounts.registerTask, 3, 'registerTask should be called once');
      assert.equal(callCounts.run, 3, 'run should be called three times');
      assert.equal(callCounts.renameTask, 3, 'renameTask should be called once');
      assert.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
    });
  });

  suite('--help', function(){
    test('should eager load task', function(){
      var callCounts, taskCalled = false;
      process.argv.push('--help');
      grunt.mockNpmTask('PackageName', 'singleTask', function() {
        taskCalled = true;
      });
      grunt.lazyLoadNpmTasks('PackageName', 'singleTask');
      grunt.task.run('singleTask');
      callCounts = grunt.getCurretCallCounts();
      assert.equal(callCounts.registerTask, 1, 'registerTask should have been called once');
      assert.equal(callCounts.run, 1, 'run should have only been called once');
      assert.equal(callCounts.renameTask, 0, 'renameTask should not have been called');
      assert.ok(taskCalled, 'task called');
    });
  });
});
