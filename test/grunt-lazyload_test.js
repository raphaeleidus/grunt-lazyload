'use strict';

const grunt_lazyload = require('../lib/grunt-lazyload.js');
const assert = require('assert');

const gruntInjector = function() {
  const callCounts = {
    registerTask: 0,
    run: 0,
    renameTask: 0,
    loadNpmTasks: 0
  };
  const tasks = {};
  const mocks = {};
  const module = {
    options: {},
    option(name) {
      return module.options[name];
    },
    task: {
      registerTask: function(taskName, description, fn) {
        callCounts.registerTask++;
        tasks[taskName] = { name:taskName, description: description, task: fn };
      },
      run: function(taskName) {
        let taskParams = taskName.split(':');
        taskName = taskParams.shift();
        callCounts.run++;
        tasks[taskName].task.apply(tasks[taskName], taskParams);
      },
      renameTask: function(oldName, newName) {
        callCounts.renameTask++;
        tasks[newName] = tasks[oldName];
        delete tasks[oldName];
      }
    },
    loadNpmTasks: function(packageName) {
      if (mocks[packageName]) {
        mocks[packageName].forEach(task => {
          module.task.registerTask(task.name, 'mocked '+task.name, task.fn);
        });
      }
      callCounts.loadNpmTasks++;
    },
    getCurrentCallCounts: function() { return callCounts; },
    mockNpmTask: function(packageName, taskName, fn) {
      (mocks[packageName] = mocks[packageName] || []).push({ name: taskName, fn: fn });
    }
  };
  return module;
};

suite('lazyloader', function() {
  let grunt;

  setup(function(){
    grunt = gruntInjector();
    grunt_lazyload(grunt);
  });

  suite('single', function(){
    test('should register task', function(){
      grunt.lazyLoadNpmTasks('PackageName', 'singleTask');
      assert.equal(grunt.getCurrentCallCounts().registerTask, 1, 'registerTask should be called once');
    });

    test('should register and run', function(){
      let called = 0;

      grunt.lazyLoadNpmTasks('PackageName', 'singleTask');
      grunt.mockNpmTask('PackageName', 'singleTask', () => called++);
      grunt.task.run('singleTask');

      let callCounts = grunt.getCurrentCallCounts();
      assert.equal(callCounts.registerTask, 2, 'registerTask should be called twice');
      assert.equal(callCounts.run, 2, 'run should be called twice');
      assert.equal(callCounts.renameTask, 1, 'renameTask should be called once');
      assert.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
      assert.equal(called, 1, 'actual implementation should be called once');
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
      assert.equal(grunt.getCurrentCallCounts().registerTask, 3, 'registerTask should be called three times');
    });

    test('should register and run', function(){
      grunt.lazyLoadNpmTasks('PackageName', ['task1', 'task2', 'task3']);
      grunt.mockNpmTask('PackageName', 'task1', () => {});
      grunt.mockNpmTask('PackageName', 'task2', () => {});
      grunt.mockNpmTask('PackageName', 'task3', () => {});

      grunt.task.run('task2');
      grunt.task.run('task1');

      let callCounts = grunt.getCurrentCallCounts();
      assert.equal(callCounts.registerTask, 6, 'registerTask should be called six times');
      assert.equal(callCounts.run, 3, 'run should be called three times');
      assert.equal(callCounts.renameTask, 3, 'renameTask should be called once');
      assert.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
    });
  });

  suite('--help', function(){
    test('should eager load task', function(){
      let called = 0;

      grunt.options.help = true;
      grunt.mockNpmTask('PackageName', 'singleTask', () => called++);
      grunt.lazyLoadNpmTasks('PackageName', 'singleTask');
      grunt.task.run('singleTask');

      let callCounts = grunt.getCurrentCallCounts();
      assert.equal(callCounts.registerTask, 1, 'registerTask should have been called once');
      assert.equal(callCounts.run, 1, 'run should have only been called once');
      assert.equal(callCounts.renameTask, 0, 'renameTask should not have been called');
      assert.equal(called, 1, 'task called once');
    });
  });
});
