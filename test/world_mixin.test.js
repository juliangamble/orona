require('coffeescript/register');
const { expect } = require('chai');
const BoloWorldMixin = require('../src/world_mixin.coffee');
const { extend } = require('../src/helpers.coffee');

function createWorld(opts) {
  const o = opts || {};
  const world = {
    authority: o.authority != null ? o.authority : true,
    map: {
      pills: o.pills || [],
      bases: o.bases || []
    },
    insert() {},
    tanks: null
  };
  extend(world, BoloWorldMixin);
  world.boloInit();
  return world;
}

function mockTank(idx) {
  return { tank_idx: null, id: idx || 0 };
}

function mockMapObject(owner_idx) {
  return {
    owner_idx: owner_idx != null ? owner_idx : 255,
    world: null,
    cell: { retile() {} },
    owner: null,
    spawn() { this._spawned = true; },
    anySpawn() { this._anySpawned = true; },
    ref(attr, val) { this[attr] = val ? { $: val } : null; }
  };
}

describe('BoloWorldMixin', function () {
  describe('boloInit', function () {
    it('should initialize empty tanks array', function () {
      const world = createWorld();
      expect(world.tanks).to.be.an('array').that.is.empty;
    });
  });

  describe('addTank', function () {
    it('should add tank to tanks array', function () {
      const world = createWorld();
      const tank = mockTank();
      world.addTank(tank);
      expect(world.tanks).to.have.lengthOf(1);
      expect(world.tanks[0]).to.equal(tank);
    });

    it('should assign tank_idx', function () {
      const world = createWorld();
      const t0 = mockTank(0);
      const t1 = mockTank(1);
      world.addTank(t0);
      world.addTank(t1);
      expect(t0.tank_idx).to.equal(0);
      expect(t1.tank_idx).to.equal(1);
    });

    it('should call resolveMapObjectOwners when authority', function () {
      let resolved = false;
      const world = createWorld({ authority: true });
      world.resolveMapObjectOwners = function () { resolved = true; };
      world.addTank(mockTank());
      expect(resolved).to.be.true;
    });

    it('should not call resolveMapObjectOwners when not authority', function () {
      let resolved = false;
      const world = createWorld({ authority: false });
      world.resolveMapObjectOwners = function () { resolved = true; };
      world.addTank(mockTank());
      expect(resolved).to.be.false;
    });
  });

  describe('removeTank', function () {
    it('should remove tank from array', function () {
      const world = createWorld();
      const t0 = mockTank(0);
      const t1 = mockTank(1);
      world.addTank(t0);
      world.addTank(t1);
      world.removeTank(t0);
      expect(world.tanks).to.have.lengthOf(1);
      expect(world.tanks[0]).to.equal(t1);
    });

    it('should reindex remaining tanks', function () {
      const world = createWorld();
      const t0 = mockTank(0);
      const t1 = mockTank(1);
      const t2 = mockTank(2);
      world.addTank(t0);
      world.addTank(t1);
      world.addTank(t2);
      world.removeTank(t0);
      expect(t1.tank_idx).to.equal(0);
      expect(t2.tank_idx).to.equal(1);
    });

    it('should handle removing last tank', function () {
      const world = createWorld();
      const tank = mockTank();
      world.addTank(tank);
      world.removeTank(tank);
      expect(world.tanks).to.have.lengthOf(0);
    });

    it('should handle removing middle tank', function () {
      const world = createWorld();
      const t0 = mockTank(0);
      const t1 = mockTank(1);
      const t2 = mockTank(2);
      world.addTank(t0);
      world.addTank(t1);
      world.addTank(t2);
      world.removeTank(t1);
      expect(world.tanks).to.deep.equal([t0, t2]);
      expect(t0.tank_idx).to.equal(0);
      expect(t2.tank_idx).to.equal(1);
    });
  });

  describe('getAllMapObjects', function () {
    it('should return combined pills and bases', function () {
      const pill = { type: 'pill' };
      const base = { type: 'base' };
      const world = createWorld({ pills: [pill], bases: [base] });
      const all = world.getAllMapObjects();
      expect(all).to.have.lengthOf(2);
      expect(all).to.include(pill);
      expect(all).to.include(base);
    });

    it('should return empty array when no map objects', function () {
      const world = createWorld();
      expect(world.getAllMapObjects()).to.have.lengthOf(0);
    });
  });

  describe('spawnMapObjects', function () {
    it('should set world reference on each object', function () {
      const obj = mockMapObject();
      const world = createWorld({ pills: [obj] });
      world.spawnMapObjects();
      expect(obj.world).to.equal(world);
    });

    it('should call insert on each object', function () {
      let inserted = [];
      const obj = mockMapObject();
      const world = createWorld({ pills: [obj] });
      world.insert = function (o) { inserted.push(o); };
      world.spawnMapObjects();
      expect(inserted).to.include(obj);
    });

    it('should call spawn and anySpawn on each object', function () {
      const obj = mockMapObject();
      const world = createWorld({ pills: [obj] });
      world.spawnMapObjects();
      expect(obj._spawned).to.be.true;
      expect(obj._anySpawned).to.be.true;
    });

    it('should process both pills and bases', function () {
      const pill = mockMapObject();
      const base = mockMapObject();
      const world = createWorld({ pills: [pill], bases: [base] });
      world.spawnMapObjects();
      expect(pill._spawned).to.be.true;
      expect(base._spawned).to.be.true;
    });
  });

  describe('resolveMapObjectOwners', function () {
    it('should resolve owner from tank index', function () {
      const tank = mockTank();
      const obj = mockMapObject(0);
      const world = createWorld({ pills: [obj] });
      world.addTank(tank);
      // addTank already calls resolveMapObjectOwners
      expect(obj.owner).to.not.be.null;
      expect(obj.owner.$).to.equal(tank);
    });

    it('should set owner to undefined for invalid index', function () {
      const obj = mockMapObject(255);
      const world = createWorld({ pills: [obj] });
      world.resolveMapObjectOwners();
      expect(obj.owner).to.be.null;
    });

    it('should retile cells', function () {
      let retiled = false;
      const obj = mockMapObject(255);
      obj.cell = { retile() { retiled = true; } };
      const world = createWorld({ pills: [obj] });
      world.resolveMapObjectOwners();
      expect(retiled).to.be.true;
    });

    it('should handle objects with no cell', function () {
      const obj = mockMapObject(255);
      obj.cell = null;
      const world = createWorld({ pills: [obj] });
      // Should not throw
      world.resolveMapObjectOwners();
    });
  });
});
