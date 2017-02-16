var istanbul = require('browserify-istanbul');

const alias = {
  aliases: {
    'src': './src',
  },
  verbose: false,
};

module.exports = function (config) {
  config.set({
    frameworks: ['browserify', 'jasmine'],
    files: [
      'src/**/*.js',
      'tests/**/*.spec.js'
    ],
    preprocessors: {
      'tests/**/*.js': ['jshint', 'browserify'],
      'src/**/*.js': ['jshint', 'browserify']
    },
    browsers: ['PhantomJS'],
    browserify: {
      debug: true,
      transform: [['babelify', {
        ignore: /node_modules/
      }], istanbul({
        ignore: ['tests/**', '**/node_modules/**'],
        instrumenterConfig: {
          embedSource: true
        }
      }), ['aliasify', alias]],
      extensions: ['.js']
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      instrumenters: {isparta: require('isparta')},
      instrumenter: {
        'src/**/*.js': 'isparta'
      },
      reporters: [
        { type: 'text' },
        { type: 'html', dir: 'coverage', subdir: 'html' },
        { type: 'lcovonly', dir: 'coverage', subdir: 'lcov' }
      ],
      check: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100
        }
      },
    }
  });
};
