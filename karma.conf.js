module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'src/**/*.js',
      'tests/**/*.spec.js'
    ],
    browsers: ['PhantomJS']
  });
}
