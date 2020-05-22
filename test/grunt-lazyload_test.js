'use strict';

const grunt_lazyload = require('../lib/grunt-lazyload.js');
const assert = require('assert');
const path = require('path');

const gruntInjector = function() {
  const callCounts = {
    registerTask: 0,
    run: 0,
    renameTask: 0,
    loadNpmTasks: 0,
    _loadTasks: 0
  };
  const tasks = {};
  const mocks = {};
  const module = {
    errors: [],
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
    file: {
      exists: function(tasksdir) {
        return Object.keys(mocks).some(path => path.indexOf(tasksdir) >= 0);
      }
    },
    log: {
      error: function(message) {
        module.errors.push(message);
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
    _loadTasks: function (packageName) {
      if (mocks[packageName]) {
        mocks[packageName].forEach(task => {
          module.task.registerTask(task.name, 'mocked '+task.name, task.fn);
        });
      }
      callCounts._loadTasks++;
    },
    getCurrentCallCounts: function() { return callCounts; },
    mockNpmTask: function(packageName, taskName, fn) {
      (mocks[packageName] = mocks[packageName] || []).push({ name: taskName, fn: fn });
    }
  };
  return module;
};

suite('lazyloader', function() {
  let grunt, instance, $pathresolve;

  setup(function(){
    grunt = gruntInjector();
    instance = grunt_lazyload(grunt);
    instance._require = function (packageName) {
      return function(grunt) {
        grunt._loadTasks(packageName);
      };
    };
    $pathresolve = path.resolve;
    path.resolve = filepath => `resolved/${filepath}`;
  });

  teardown(function(){
    path.resolve = $pathresolve;
  });

  suite('lazyload init', function(){
    test('should only initialize once', function(){
      let second = grunt_lazyload(grunt);
      let third = grunt_lazyload(grunt);
      assert.strictEqual(instance, second);
      assert.strictEqual(second, third);
    });
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

    test('repeated calls to the task should use already loaded implementation', function(){
      let called = 0;

      grunt.lazyLoadNpmTasks('PackageName', 'singleTask');
      grunt.mockNpmTask('PackageName', 'singleTask', () => called++);
      grunt.task.run('singleTask');
      grunt.task.run('singleTask');
      grunt.task.run('singleTask');
      grunt.task.run('singleTask');

      let callCounts = grunt.getCurrentCallCounts();
      assert.equal(callCounts.registerTask, 2, 'registerTask should be called twice');
      assert.equal(callCounts.run, 5, 'run should be called five times');
      assert.equal(callCounts.renameTask, 1, 'renameTask should be called once');
      assert.equal(callCounts.loadNpmTasks, 1, 'loadNpmTasks should be called once');
      assert.equal(called, 4, 'actual implementation should be called four times');
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

  suite('local task directories', function(){
    test('lazyLoadTasks sets up list of pending tasks', function (){
      grunt.mockNpmTask('resolved/somedir/grunt-cat.js', 'cat1', () => {});
      grunt.lazyLoadTasks('somedir', {
        'grunt-cat.js': ['cat1', 'cat2'],
      });

      assert.deepEqual(instance.pending, {
        cat1: { directory: 'resolved/somedir', filename: 'grunt-cat.js' },
        cat2: { directory: 'resolved/somedir', filename: 'grunt-cat.js' }
      });
    });

    test('lazyLoadTasks can be called multiple times', function(){
      grunt.mockNpmTask('resolved/somedir/grunt-cat.js', 'cat1', () => {});
      grunt.lazyLoadTasks('somedir', {
        'grunt-cat.js': ['cat1', 'cat2'],
      });
      grunt.lazyLoadTasks('somedir', {
        'grunt-dog.js': ['dog1'],
        'grunt-hamster.js': ['hamster1']
      });

      assert.deepEqual(instance.pending, {
        cat1: { directory: 'resolved/somedir', filename: 'grunt-cat.js' },
        cat2: { directory: 'resolved/somedir', filename: 'grunt-cat.js' },
        dog1: { directory: 'resolved/somedir', filename: 'grunt-dog.js' },
        hamster1: { directory: 'resolved/somedir', filename: 'grunt-hamster.js' }
      });
    });

    test('lazyLoadTasks logs a grunt error if the directory does not exist', function (){
      grunt.lazyLoadTasks('somedir', {
        'grunt-cat.js': ['cat1', 'cat2'],
      });

      assert.deepEqual(grunt.errors, [
        'Tasks directory "resolved/somedir" not found.'
      ]);
    });

    test('should register and run task', function(){
      let called = 0;
      grunt.mockNpmTask('resolved/somedir/grunt-cat.js', 'cat1', () => called++);
      grunt.lazyLoadTasks('somedir', {
        'grunt-cat.js': ['cat1'],
      });

      grunt.task.run('cat1');

      let callCounts = grunt.getCurrentCallCounts();
      assert.equal(callCounts.registerTask, 2, 'registerTask should be called twice');
      assert.equal(callCounts.run, 2, 'run should be called twice');
      assert.equal(callCounts.renameTask, 1, 'renameTask should be called once');
      assert.equal(callCounts.loadNpmTasks, 0);
      assert.equal(callCounts.loadNpmTasks, 0);
      assert.equal(callCounts._loadTasks, 1);
      assert.equal(called, 1);
    });

    test('a file defining multiple tasks should only be loaded once', function(){
      let called = 0;
      grunt.mockNpmTask('resolved/somedir/grunt-cat.js', 'cat1', () => called++);
      grunt.mockNpmTask('resolved/somedir/grunt-cat.js', 'cat2', () => called++);
      grunt.lazyLoadTasks('somedir', {
        'grunt-cat.js': ['cat1', 'cat2'],
      });

      grunt.task.run('cat1');
      grunt.task.run('cat2');
      grunt.task.run('cat1');
      grunt.task.run('cat2');

      assert.deepEqual(grunt.getCurrentCallCounts(), {
        registerTask: 4,
        run: 5,
        renameTask: 2,
        loadNpmTasks: 0,
        _loadTasks: 1
      });
      assert.equal(called, 4);
    });

    test('lazyLoadTasks can be called multiple times', function(){
      grunt.mockNpmTask('resolved/somedir/grunt-cat.js', 'cat1', () => {});
      grunt.lazyLoadTasks('somedir', {
        'grunt-cat.js': ['cat1', 'cat2'],
      });
      grunt.lazyLoadTasks('somedir', {
        'grunt-dog.js': ['dog1'],
        'grunt-hamster.js': ['hamster1']
      });

      assert.deepEqual(instance.pending, {
        cat1: { directory: 'resolved/somedir', filename: 'grunt-cat.js' },
        cat2: { directory: 'resolved/somedir', filename: 'grunt-cat.js' },
        dog1: { directory: 'resolved/somedir', filename: 'grunt-dog.js' },
        hamster1: { directory: 'resolved/somedir', filename: 'grunt-hamster.js' }
      });
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
