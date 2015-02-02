module.exports = function (grunt) {
  'use strict'
// Enable time-grunt for nice reporting of time spent on grunt tasks
  require('time-grunt')(grunt);

  var
    pkg = grunt.file.readJSON('package.json');

  var cfg = {
    pkg: pkg,
    bump: {
      options: {
        pushTo: 'origin'
      }
    }
  };

  // load all grunt tasks without specifying them by name
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig(cfg);

  grunt.registerTask('default', ['bump'])

};