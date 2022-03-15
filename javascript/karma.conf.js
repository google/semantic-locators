/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (config) => {
  config.set({
    frameworks: ['jasmine', 'karma-typescript'],

    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-typescript',
      'karma-spec-reporter',
    ],

    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json',
      bundlerOptions: {
        transforms: [
          require('karma-typescript-es6-transform')({
            plugins: ["@babel/transform-runtime"]
          }),
        ],
      },
    },

    files: [
      {pattern: 'src/**/*.ts'},
      {pattern: 'test/**/*.ts'},
    ],

    preprocessors: {'**/*.ts': 'karma-typescript'},

    reporters: ['progress', 'spec', 'karma-typescript'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome', 'Firefox'],
    singleRun: false,
    concurrency: Infinity
  })
}
