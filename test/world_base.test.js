require('coffeescript/register');
const { expect } = require('chai');
const WorldBase = require('../src/objects/world_base.coffee');
const { TILE_SIZE_WORLD } = require('../src/constants.coffee');
const sounds = require('../src/sounds.coffee');

function mockCell(opts) {
  const o = opts || {};
  return {
    x: 20, y: 20,
    type: { ascii: '=' },
    base: null,
    pill: null,
    setType() {},
    retile() {},
    getWorldCoordinates() { return [(this.x + 0.5) * TILE_SIZE_WORLD, (this.y + 0.5) * TILE_SIZE_WORLD]; }
  };
}

function mockMap() {
  const cell = mockCell();
  return {
    pills: [],
    bases: [],
    cellAtTile() { return cell; },
    cellAtWorld() { return cell; },
    _cell: cell
  };
}

function mockWorld(opts) {
  const o = opts || {};
  const map = o.map || mockMap();
  return {
    map,
    tanks: o.tanks || [],
    objects: [],
    authority: true,
    soundEffect() {},
    spawn() { return {}; },
    destroy() {}
  };
}

function mockTank(opts) {
  const o = opts || {};
  return {
    x: (20 + 0.5) * TILE_SIZE_WORLD,
    y: (20 + 0.5) * TILE_SIZE_WORLD,
    armour: o.armour != null ? o.armour : 40,
    shells: o.shells != null ? o.shells : 20,
    mines: o.mines != null ? o.mines : 5,
    team: o.team != null ? o.team : 0,
    tank_idx: o.tank_idx != null ? o.tank_idx : 0,
    cell: null,
    on() {},
    removeListener() {},
    isAlly(other) { return other === this || (this.team !== 255 && other.team === this.team); }
  };
}

function createBase(world, opts) {
  const o = opts || {};
  world = world || mockWorld();
  const base = new WorldBase(world);
  base.idx = 0;
  base.x = (20 + 0.5) * TILE_SIZE_WORLD;
  base.y = (20 + 0.5) * TILE_SIZE_WORLD;
  base.armour = o.armour != null ? o.armour : 90;
  base.shells = o.shells != null ? o.shells : 90;
  base.mines = o.mines != null ? o.mines : 90;
  base.owner = null;
  base.owner_idx = 255;
  base.team = 255;
  base.refueling = null;
  base.cell = world.map._cell || world.map.cellAtWorld();
  base.cell.base = base;
  return base;
}

describe('WorldBase', function () {
  describe('constructor (map form)', function () {
    it('should set position from tile coordinates', function () {
      const map = mockMap();
      const base = new WorldBase(map, 20, 30, 255, 90, 90, 90);
      expect(base.x).to.equal((20 + 0.5) * TILE_SIZE_WORLD);
      expect(base.y).to.equal((30 + 0.5) * TILE_SIZE_WORLD);
    });

    it('should store owner_idx, armour, shells, mines', function () {
      const map = mockMap();
      const base = new WorldBase(map, 10, 10, 2, 80, 70, 60);
      expect(base.owner_idx).to.equal(2);
      expect(base.armour).to.equal(80);
      expect(base.shells).to.equal(70);
      expect(base.mines).to.equal(60);
    });

    it('should set cell type to road', function () {
      const map = mockMap();
      let typeSet = null;
      map.cellAtTile = function () {
        return { setType(t) { typeSet = t; } };
      };
      new WorldBase(map, 10, 10, 255, 90, 90, 90);
      expect(typeSet).to.equal('=');
    });
  });

  describe('updateOwner', function () {
    it('should set team from owner', function () {
      const world = mockWorld();
      const base = createBase(world);
      const tank = mockTank({ team: 1, tank_idx: 3 });
      base.owner = { $: tank, clear() {}, on() { return this; } };
      base.updateOwner();
      expect(base.team).to.equal(1);
      expect(base.owner_idx).to.equal(3);
    });

    it('should set team to 255 when no owner', function () {
      const world = mockWorld();
      const base = createBase(world);
      base.owner = null;
      base.updateOwner();
      expect(base.team).to.equal(255);
      expect(base.owner_idx).to.equal(255);
    });
  });

  describe('anySpawn', function () {
    it('should set cell reference and mark cell.base', function () {
      const world = mockWorld();
      const base = createBase(world);
      base.cell = null;
      base.anySpawn();
      expect(base.cell).to.not.be.null;
      expect(base.cell.base).to.equal(base);
    });
  });

  describe('takeShellHit', function () {
    it('should reduce armour by 5', function () {
      const base = createBase(null, { armour: 90 });
      base.takeShellHit({});
      expect(base.armour).to.equal(85);
    });

    it('should not reduce armour below 0', function () {
      const base = createBase(null, { armour: 3 });
      base.takeShellHit({});
      expect(base.armour).to.equal(0);
    });

    it('should return SHOT_BUILDING sound', function () {
      const base = createBase();
      const sfx = base.takeShellHit({});
      expect(sfx).to.equal(sounds.SHOT_BUILDING);
    });

    it('should aggravate nearby allied pillboxes', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 90 });
      const tank = mockTank({ team: 0 });
      base.owner = { $: tank, clear() {}, on() { return this; } };
      base.team = 0;

      let aggravated = false;
      const pill = {
        inTank: false, carried: false, armour: 10,
        x: base.x + 100, y: base.y + 100,
        owner: { $: tank },
        aggravate() { aggravated = true; }
      };
      world.map.pills.push(pill);

      base.takeShellHit({});
      expect(aggravated).to.be.true;
    });

    it('should not aggravate pillboxes with no armour', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 90 });
      const tank = mockTank({ team: 0 });
      base.owner = { $: tank, clear() {}, on() { return this; } };

      let aggravated = false;
      const pill = {
        inTank: false, carried: false, armour: 0,
        x: base.x, y: base.y,
        owner: { $: tank },
        aggravate() { aggravated = true; }
      };
      world.map.pills.push(pill);

      base.takeShellHit({});
      expect(aggravated).to.be.false;
    });

    it('should not aggravate pillboxes that are inTank', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 90 });
      const tank = mockTank({ team: 0 });
      base.owner = { $: tank, clear() {}, on() { return this; } };

      let aggravated = false;
      const pill = {
        inTank: true, carried: false, armour: 10,
        x: base.x, y: base.y,
        owner: { $: tank },
        aggravate() { aggravated = true; }
      };
      world.map.pills.push(pill);

      base.takeShellHit({});
      expect(aggravated).to.be.false;
    });
  });

  describe('update - refueling', function () {
    it('should stop refueling if tank leaves cell', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 90, shells: 90, mines: 90 });
      const tank = mockTank();
      tank.cell = mockCell(); // different cell object
      const ref = { $: tank, clear() { base.refueling = null; }, on() { return this; } };
      base.refueling = ref;
      base.refuelCounter = 1;
      base.update();
      expect(base.refueling).to.be.null;
    });

    it('should stop refueling if tank is dead', function () {
      const world = mockWorld();
      const base = createBase(world);
      const tank = mockTank({ armour: 255 });
      tank.cell = base.cell;
      const ref = { $: tank, clear() { base.refueling = null; }, on() { return this; } };
      base.refueling = ref;
      base.refuelCounter = 1;
      base.update();
      expect(base.refueling).to.be.null;
    });

    it('should transfer armour first', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 20, shells: 90, mines: 90 });
      const tank = mockTank({ armour: 30 });
      tank.cell = base.cell;
      base.refueling = { $: tank, clear() {}, on() { return this; } };
      base.refuelCounter = 1;
      base.update();
      expect(tank.armour).to.equal(35);
      expect(base.armour).to.equal(15);
      expect(base.refuelCounter).to.equal(46);
    });

    it('should cap armour transfer at 5', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 90 });
      const tank = mockTank({ armour: 10 });
      tank.cell = base.cell;
      base.refueling = { $: tank, clear() {}, on() { return this; } };
      base.refuelCounter = 1;
      base.update();
      expect(tank.armour).to.equal(15);
      expect(base.armour).to.equal(85);
    });

    it('should cap armour transfer to not exceed 40', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 90 });
      const tank = mockTank({ armour: 38 });
      tank.cell = base.cell;
      base.refueling = { $: tank, clear() {}, on() { return this; } };
      base.refuelCounter = 1;
      base.update();
      expect(tank.armour).to.equal(40);
      expect(base.armour).to.equal(88);
    });

    it('should transfer shells when armour is full', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 0, shells: 10, mines: 90 });
      const tank = mockTank({ armour: 40, shells: 5 });
      tank.cell = base.cell;
      base.refueling = { $: tank, clear() {}, on() { return this; } };
      base.refuelCounter = 1;
      base.update();
      expect(tank.shells).to.equal(6);
      expect(base.shells).to.equal(9);
      expect(base.refuelCounter).to.equal(7);
    });

    it('should transfer mines when armour and shells are full', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 0, shells: 0, mines: 10 });
      const tank = mockTank({ armour: 40, shells: 40, mines: 2 });
      tank.cell = base.cell;
      base.refueling = { $: tank, clear() {}, on() { return this; } };
      base.refuelCounter = 1;
      base.update();
      expect(tank.mines).to.equal(3);
      expect(base.mines).to.equal(9);
      expect(base.refuelCounter).to.equal(7);
    });

    it('should set refuelCounter to 1 when nothing to transfer', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 0, shells: 0, mines: 0 });
      const tank = mockTank({ armour: 40, shells: 40, mines: 40 });
      tank.cell = base.cell;
      base.refueling = { $: tank, clear() {}, on() { return this; } };
      base.refuelCounter = 1;
      base.update();
      expect(base.refuelCounter).to.equal(1);
    });

    it('should not transfer until refuelCounter reaches 0', function () {
      const world = mockWorld();
      const base = createBase(world, { armour: 90 });
      const tank = mockTank({ armour: 10 });
      tank.cell = base.cell;
      base.refueling = { $: tank, clear() {}, on() { return this; } };
      base.refuelCounter = 5;
      base.update();
      expect(tank.armour).to.equal(10); // no transfer yet
      expect(base.refuelCounter).to.equal(4);
    });
  });

  describe('findSubject', function () {
    it('should refuel allied tank on cell', function () {
      const world = mockWorld();
      const base = createBase(world);
      const tank = mockTank({ team: 0 });
      tank.cell = base.cell;
      base.owner = { $: tank, clear() {}, on() { return this; } };
      base.team = 0;
      world.tanks = [tank];

      base.findSubject();
      expect(base.refueling).to.not.be.null;
      expect(base.refueling.$).to.equal(tank);
      expect(base.refuelCounter).to.equal(46);
    });

    it('should ignore dead tanks', function () {
      const world = mockWorld();
      const base = createBase(world);
      const tank = mockTank({ armour: 255 });
      tank.cell = base.cell;
      world.tanks = [tank];

      base.findSubject();
      expect(base.refueling).to.be.null;
    });

    it('should ignore tanks on different cells', function () {
      const world = mockWorld();
      const base = createBase(world);
      const tank = mockTank();
      tank.cell = mockCell(); // different cell
      world.tanks = [tank];

      base.findSubject();
      expect(base.refueling).to.be.null;
    });

    it('should claim unowned base for lone tank', function () {
      const world = mockWorld();
      const base = createBase(world);
      const tank = mockTank({ team: 1, tank_idx: 2 });
      tank.cell = base.cell;
      world.tanks = [tank];

      base.findSubject();
      expect(base.owner_idx).to.equal(2);
      expect(base.team).to.equal(1);
    });
  });
});
