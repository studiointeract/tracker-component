Package.describe({
  name: 'studiointeract:tracker-component',
  version: '1.3.9-rc.1',
  summary: 'Easy reactive React Components with Meteor and Tracker',
  git: 'https://github.com/studiointeract/tracker-component',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');
  api.use('ecmascript');
  api.use('tracker');

  api.mainModule('main.js');
});
