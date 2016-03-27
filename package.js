Package.describe({
  name: 'studiointeract:tracker-component',
  version: '1.3.0',
  summary: 'Easy reactive React Components with Meteor and Tracker',
  git: 'https://github.com/studiointeract/tracker-component',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3-rc.1');
  api.use('ecmascript');
  api.use('tracker');
  api.use('jsx@0.2.4');

  api.mainModule('main.js');
});
