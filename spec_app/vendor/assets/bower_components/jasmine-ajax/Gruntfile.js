module.exports = function( grunt ) {
  'use strict';
  //
  // Grunt configuration:
  //
  // https://github.com/cowboy/grunt/blob/master/docs/getting_started.md
  //
  grunt.initConfig({
    // specifying JSHint options and globals
    // https://github.com/cowboy/grunt/blob/master/docs/task_lint.md#specifying-jshint-options-and-globals
    jshint: {
      options: {
        boss: true,
        browser: true,
        curly: true,
        eqeqeq: true,
        eqnull: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        globals: {
          jasmine: false,
          module: false,
          exports: true,
          describe: false,
          it: false,
          expect: false,
          beforeEach: false,
          afterEach: false,
          spyOn: false,
          getJasmineRequireObj: false
        }
      },
      all: ['Gruntfile.js', 'src/**/*.js', 'lib/**/*.js', 'spec/**/*.js']
    },
    shell: {
      ctags: {
        command: 'ctags -R lib'
      }
    },
    concat: {
      mockAjax: {
        src: [
          'src/requireAjax.js',
          'src/**/*.js',
          '!src/boot.js',
          'src/boot.js'
        ],
        dest: 'lib/mock-ajax.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('ctags', 'Generate ctags', ['shell:ctags']);
};
