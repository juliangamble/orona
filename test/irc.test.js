require('coffeescript/register');
const { expect } = require('chai');
const { execSync } = require('child_process');
const path = require('path');

describe('irc', function () {
  it('should compile without errors', function () {
    const file = path.join(__dirname, '../src/server/irc.coffee');
    // Verify the CoffeeScript compiles cleanly (irc-js itself is broken on modern Node.js)
    const result = execSync(`npx coffee -c -p "${file}"`, { encoding: 'utf-8' });
    expect(result).to.include('createBoloIrcClient');
    expect(result).to.include('module.exports');
  });

  it('should define createBoloIrcClient as the export', function () {
    const file = path.join(__dirname, '../src/server/irc.coffee');
    const result = execSync(`npx coffee -c -p "${file}"`, { encoding: 'utf-8' });
    expect(result).to.include('module.exports = createBoloIrcClient');
  });

  it('should define BoloIrc class with shutdown method', function () {
    const file = path.join(__dirname, '../src/server/irc.coffee');
    const result = execSync(`npx coffee -c -p "${file}"`, { encoding: 'utf-8' });
    expect(result).to.include('BoloIrc');
    expect(result).to.include('shutdown');
  });

  it('should define watch_for and watch_for_admin methods', function () {
    const file = path.join(__dirname, '../src/server/irc.coffee');
    const result = execSync(`npx coffee -c -p "${file}"`, { encoding: 'utf-8' });
    expect(result).to.include('watch_for');
    expect(result).to.include('watch_for_admin');
  });
});
