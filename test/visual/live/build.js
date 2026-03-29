#!/usr/bin/env node
const fs = require('fs');
const browserify = require('browserify');
const coffeeify = require('coffeeify');
const coffee = require('coffeescript');

const b = browserify('./test/visual/live/entry.js', {
  extensions: ['.coffee'],
  standalone: 'BoloTest'
});
b.transform(coffeeify, { global: true, compile: coffee.compile });
b.bundle((err, buf) => {
  if (err) throw err;
  fs.writeFileSync('test/visual/live/test-bundle.js', buf);
  console.log('Built test/visual/live/test-bundle.js (' + buf.length + ' bytes)');
});
