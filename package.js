Package.describe({
  name: 'std:tracker-component',
  version: '1.3.17',
  summary: 'Easy reactive React Components with Meteor and Tracker',
  git: 'https://github.com/studiointeract/tracker-component',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');
  api.imply('tracker');

  api.mainModule('dist/index.js');
});
