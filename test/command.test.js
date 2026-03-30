require('coffeescript/register');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const os = require('os');

const command = require('../src/server/command.coffee');

describe('command', function () {
  // command.coffee captures `puts = console.log` at require time,
  // so we test behaviour via side effects (files created, errors thrown)
  // rather than trying to intercept output.

  it('should export a run function', function () {
    expect(command.run).to.be.a('function');
  });

  it('should print usage and return when no config file argument given', function () {
    const origArgv = process.argv;
    try {
      process.argv = ['node', 'bolo-server'];
      // Should not throw — just prints usage and returns
      command.run();
    } finally {
      process.argv = origArgv;
    }
  });

  it('should create sample config when file does not exist', function () {
    const origArgv = process.argv;
    const tmpFile = path.join(os.tmpdir(), `bolo-test-${Date.now()}.json`);
    try {
      process.argv = ['node', 'bolo-server', tmpFile];
      command.run();
      expect(fs.existsSync(tmpFile)).to.be.true;
      const content = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
      expect(content).to.have.property('general');
      expect(content).to.have.property('web');
    } finally {
      process.argv = origArgv;
      try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }
    }
  });

  it('should throw on invalid JSON config', function () {
    const origArgv = process.argv;
    const tmpFile = path.join(os.tmpdir(), `bolo-test-${Date.now()}.json`);
    try {
      fs.writeFileSync(tmpFile, 'not valid json');
      process.argv = ['node', 'bolo-server', tmpFile];
      expect(() => command.run()).to.throw();
    } finally {
      process.argv = origArgv;
      try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }
    }
  });
});
