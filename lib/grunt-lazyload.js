/*
 * grunt-lazyload
 * https://github.com/raphaeleidus/grunt-lazyload
 *
 * Copyright (c) 2013 Raphael Eidus
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util');

exports.lazyloader = (function() {
  var _grunt;
  return {
    init: function(grunt) {
      _grunt = grunt;
    },
    load: function(NpmPackage, tasks) {
      if(util.isArray(tasks)) {
        tasks.forEach(function(task) {
          //register the task aliases
          _grunt.task.registerTask(task, task, function(){
            //rename all the aliases (grunt doesn't have a task.delete ... yet)
            tasks.forEach(function(t) {
              _grunt.task.renameTask(t, '_'+t+'_');
            });
            //register the true tasks
            _grunt.loadNpmTasks(NpmPackage);
            //run the desired task
            _grunt.task.run(task);
          });
        });
      } else {
        //register the task aliases
        _grunt.task.registerTask(tasks, tasks, function(){
          //rename the alias (grunt doesn't have a task.delete ... yet)
          _grunt.task.renameTask(tasks, '_'+tasks+'_');
          //register the true tasks
          _grunt.loadNpmTasks(NpmPackage);
          //run the desired task
          _grunt.task.run(tasks);
        });
      }
    }
  }
}());
