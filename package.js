Package.describe({
  name: 'studiointeract:tracker-component',
  version: '1.2.1',
  // Brief, one-line summary of the package.
  summary: 'Zero-config reactive React Components with Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/studiointeract/tracker-component',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.use('tracker');
  api.use('react@0.14.3');
  api.addFiles('tracker-component.jsx');
  api.export('Tracker');
});
