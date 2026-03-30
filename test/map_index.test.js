require('coffeescript/register');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MapIndex = require('../src/server/map_index.coffee');

describe('MapIndex', function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mapindex-'));
  });

  afterEach(function () {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should index .map files', function (done) {
    fs.writeFileSync(path.join(tmpDir, 'TestMap.map'), '');
    const idx = new MapIndex(tmpDir, function () {
      const result = idx.get('TestMap');
      expect(result).to.not.be.undefined;
      expect(result.name).to.equal('TestMap');
      expect(result.path).to.equal(path.join(tmpDir, 'TestMap.map'));
      done();
    });
  });

  it('should ignore non-.map files', function (done) {
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), '');
    fs.writeFileSync(path.join(tmpDir, 'Actual.map'), '');
    const idx = new MapIndex(tmpDir, function () {
      expect(idx.get('readme')).to.be.undefined;
      expect(idx.get('Actual')).to.not.be.undefined;
      done();
    });
  });

  it('should index maps in subdirectories', function (done) {
    const sub = path.join(tmpDir, 'subdir');
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, 'Deep.map'), '');
    const idx = new MapIndex(tmpDir, function () {
      expect(idx.get('Deep')).to.not.be.undefined;
      done();
    });
  });

  it('should return undefined for unknown map name', function (done) {
    // Need at least one file so the callback fires
    fs.writeFileSync(path.join(tmpDir, 'Exists.map'), '');
    const idx = new MapIndex(tmpDir, function () {
      expect(idx.get('NonExistent')).to.be.undefined;
      done();
    });
  });

  describe('fuzzy search', function () {
    it('should return exact match as single-element array', function (done) {
      fs.writeFileSync(path.join(tmpDir, 'Everard Island.map'), '');
      const idx = new MapIndex(tmpDir, function () {
        const results = idx.fuzzy('Everard Island');
        expect(results).to.have.lengthOf(1);
        expect(results[0].name).to.equal('Everard Island');
        done();
      });
    });

    it('should match ignoring non-word characters', function (done) {
      fs.writeFileSync(path.join(tmpDir, 'Everard Island.map'), '');
      const idx = new MapIndex(tmpDir, function () {
        const results = idx.fuzzy('EverardIsland');
        expect(results).to.have.lengthOf(1);
        expect(results[0].name).to.equal('Everard Island');
        done();
      });
    });

    it('should match case-insensitively', function (done) {
      fs.writeFileSync(path.join(tmpDir, 'Everard Island.map'), '');
      const idx = new MapIndex(tmpDir, function () {
        const results = idx.fuzzy('everard');
        expect(results.length).to.be.greaterThanOrEqual(1);
        expect(results[0].name).to.equal('Everard Island');
        done();
      });
    });

    it('should return empty array for no matches', function (done) {
      fs.writeFileSync(path.join(tmpDir, 'Everard Island.map'), '');
      const idx = new MapIndex(tmpDir, function () {
        const results = idx.fuzzy('zzzzz');
        expect(results).to.have.lengthOf(0);
        done();
      });
    });

    it('should return multiple partial matches', function (done) {
      fs.writeFileSync(path.join(tmpDir, 'Alpha Map.map'), '');
      fs.writeFileSync(path.join(tmpDir, 'Alpha Zone.map'), '');
      fs.writeFileSync(path.join(tmpDir, 'Beta Map.map'), '');
      const idx = new MapIndex(tmpDir, function () {
        const results = idx.fuzzy('Alpha');
        expect(results).to.have.lengthOf(2);
        const names = results.map(r => r.name);
        expect(names).to.include('Alpha Map');
        expect(names).to.include('Alpha Zone');
        done();
      });
    });
  });

  describe('reindex', function () {
    it('should refresh the index when called again', function (done) {
      fs.writeFileSync(path.join(tmpDir, 'First.map'), '');
      const idx = new MapIndex(tmpDir, function () {
        expect(idx.get('First')).to.not.be.undefined;
        fs.writeFileSync(path.join(tmpDir, 'Second.map'), '');
        idx.reindex(function () {
          expect(idx.get('Second')).to.not.be.undefined;
          done();
        });
      });
    });
  });
});
