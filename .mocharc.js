'use strict';

// This is a JavaScript-based config file containing every Mocha option plus others.
// If you need conditional logic, you might want to use this type of config,
// e.g. set options via environment variables 'process.env'.
// Otherwise, JSON or YAML is recommended.

module.exports = {
  spec: ['nodes/**/*.spec.js'], // the positional arguments!

  watch: false,
  // 'watch-files': ['test/**/*.js'],
  'watch-ignore': ['node_modules', 'node-red-files'],
};
