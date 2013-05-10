/*
 * grunt-lazyload
 * https://github.com/raphaeleidus/grunt-lazyload
 *
 * Copyright (c) 2013 Raphael Eidus
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util');

exports.lazyload = function(grunt) {
  return function(NpmPackage, tasks) {
    if(util.isArray(tasks)) {
      tasks.forEach(function(task) {
        //register the task aliases
        grunt.task.registerTask(task, task, function(){
          //rename all the aliases (grunt doesn't have a task.delete ... yet)
          tasks.forEach(function(t) {
            grunt.task.renameTask(t, '_'+t+'_');
          });
          //register the true tasks
          grunt.loadNpmTasks(NpmPackage);
          //run the desired task
          grunt.task.run(task);
        });
      });
    } else {
      //register the task aliases
      grunt.task.registerTask(tasks, tasks, function(){
        //rename the alias (grunt doesn't have a task.delete ... yet)
        grunt.task.renameTask(tasks, '_'+tasks+'_');
        //register the true tasks
        grunt.loadNpmTasks(NpmPackage);
        //run the desired task
        grunt.task.run(tasks);
      });
    }
  };
};
