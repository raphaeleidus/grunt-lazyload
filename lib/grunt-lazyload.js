/*
 * grunt-lazyload
 * https://github.com/raphaeleidus/grunt-lazyload
 *
 * Copyright (c) 2013 Raphael Eidus
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util');
var argv = process.argv;

module.exports = function(grunt) {
  grunt.lazyLoadNpmTasks = function lazyload(NpmPackage, tasks) {
    //when displaying the grunt help eager load everything
    if(argv.indexOf('--help') !== -1 || argv.indexOf('-h') !== -1) {
      grunt.loadNpmTasks(NpmPackage);
      return;
    }
    if(!util.isArray(tasks)) {
      tasks = [tasks];
    }
    tasks.forEach(function(task) {
      //register the task aliases
      grunt.task.registerTask(task, task, function(){
        //pass along any arguments passed in
        var runName = Array.prototype.concat.apply([task], arguments).join(':');
        tasks.forEach(function(t) {
          //rename all the aliases (grunt doesn't have a task.delete ... yet)
          grunt.task.renameTask(t, '_'+t+'_');
        });
        //register the true tasks
        grunt.loadNpmTasks(NpmPackage);
        //run the task
        grunt.task.run(runName);
      });
    });
  };
};
