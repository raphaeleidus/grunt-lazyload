/*
 * grunt-lazyload
 * https://github.com/raphaeleidus/grunt-lazyload
 *
 * Copyright (c) 2013 Raphael Eidus
 * Licensed under the MIT license.
 */

'use strict';

class LazyLoader {
  constructor(grunt) {
    // Instance of grunt this lazy loader is installed under
    this.grunt = grunt;

    // Keep track of all tasks that can be lazy-loaded, and what directory/filename
    // to load them from. Once loaded, the task will be removed from this list.
    this.pending = {};

    // Keep track of all modules we know about, and the tasks we expect to register
    // in each (a module can register more than one task).
    this.taskList = {};

    // Keep a list of directory/file/task entries and the desired alias for each task.
    // Normally, the desired alias is simply the task name, but this pairing will be
    // updated if you rename a task before it is loaded.
    this.aliasList = {};

    // A state marker used to indicate we are actively loading a grunt task module. If
    // set, any tasks registered will be checked against the alias list above.
    this.loadingFile = undefined;

    // Lazy-load wrapper for renameTask
    const $renameTask = grunt.task.renameTask;
    grunt.task.renameTask = (oldName, newName) => {
      const entry = this.pending[oldName];
      if (entry) {
        delete this.pending[oldName];
        this.registerLazyLoadTask(entry.directory, entry.filename, oldName, newName);
      } else {
        $renameTask(oldName, newName);
      }
    };

    // Lazy-load wrapper for registerTask
    const $registerTask = grunt.task.registerTask;
    grunt.registerTask = (...args) => {
      // If lazy load is registering grunt tasks and it matches the directory, filename, and
      // task name of a known alias, replace the task name with the alias name.
      if (this.loadingFile) {
        const key = `${this.loadingFile.directory}:${this.loadingFile.filename}:${args[0]}`;
        if (this.aliasList[key]) {
          args[0] = this.aliasList[key];
        }
      }
      $registerTask(...args);
    };
    grunt.task.registerTask = grunt.registerTask;

    // Lazy-load wrapper for registerMultiTask
    const $registerMultiTask = grunt.task.registerMultiTask;
    grunt.registerMultiTask = (...args) => {
      // If lazy load is registering grunt tasks and it matches the directory, filename, and
      // task name of a known alias, replace the task name with the alias name.
      if (this.loadingFile) {
        const key = `${this.loadingFile.directory}:${this.loadingFile.filename}:${args[0]}`;
        if (this.aliasList[key]) {
          args[0] = this.aliasList[key];
        }
      }
      $registerMultiTask(...args);
    };
    grunt.task.registerMultiTask = grunt.registerMultiTask;

    grunt.lazyLoadTasks = this.registerTasks.bind(this);
    grunt.lazyLoadNpmTasks = this.registerNpmTasks.bind(this);
  }

  registerTasks(tasksdir, taskdefs) {
    // If listing tasks, eager-load everything
    if (this.grunt.option('help') || this.grunt.option('h')) {
      return this.grunt.loadTasks(tasksdir);
    }

    if (tasksdir) {
      tasksdir = require('path').resolve(tasksdir);
      if (!this.grunt.file.exists(tasksdir)) {
        this.grunt.log.error('Tasks directory "' + tasksdir + '" not found.');
        return;
      }
    }

    Object.keys(taskdefs).forEach(filename => {
      let list = Array.isArray(taskdefs[filename]) ? taskdefs[filename] : [taskdefs[filename]];
      list.forEach(taskname => {
        this.registerLazyLoadTask(tasksdir, filename, taskname, taskname);
      });
    });
  }

  registerNpmTasks(modulename, tasklist) {
    // If listing tasks, eager-load everything
    if (this.grunt.option('help') || this.grunt.option('h')) {
      return this.grunt.loadNpmTasks(modulename);
    }

    this.registerTasks(undefined, { [modulename]: tasklist });
  }

  registerLazyLoadTask(directory, filename, taskname, aliasname) {
    const filekey = `${directory}:${filename}`;
    this.aliasList[`${filekey}:${taskname}`] = aliasname;
    this.taskList[filekey] = this.taskList[filekey] || [];
    this.taskList[filekey].push(aliasname);

    const target = this.loadAndRun.bind(this, directory, filename, aliasname);
    target.alias = true; // hide double-header output in grunt log
    this.grunt.registerTask(aliasname, aliasname, target);
    this.pending[aliasname] = { directory, filename };
  }

  _require(filename) {
    return require(filename);
  }

  load(directory, filename) {
    this.taskList[`${directory}:${filename}`].forEach(taskname => {
      delete this.pending[taskname];
      this.grunt.task.renameTask(taskname, `##${taskname}##`);
    });

    try {
      this.loadingFile = { directory, filename };
      if (directory) {
        this._require(`${directory}/${filename}`)(this.grunt);
      } else {
        this.grunt.loadNpmTasks(filename);
      }
    } finally {
      this.loadingFile = undefined;
    }
  }

  loadAndRun(directory, filename, taskname, ...args) {
      this.load(directory, filename);
      this.grunt.task.run([taskname, ...args].join(":"));
  }
}

const lazyLoader = {
  _instances: new Map(),
  install(grunt) {
    let instance = lazyLoader._instances.get(grunt);
    if (!instance) {
      instance = new LazyLoader(grunt);
      lazyLoader._instances.set(grunt, instance);
    }
    return instance;
  }
};

module.exports = (grunt) => lazyLoader.install(grunt);
