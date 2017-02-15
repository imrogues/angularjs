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
      transform: ['babelify']
    }
  });
}
