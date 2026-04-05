require('coffeescript/register');
const { expect } = require('chai');
const WorldPillbox = require('../src/objects/world_pillbox.coffee');
const { TILE_SIZE_WORLD } = require('../src/constants.coffee');
const sounds = require('../src/sounds.coffee');

function mockCell(opts) {
  const o = opts || {};
  return {
    x: 20, y: 20,
    pill: null,
    base: null,
    type: { ascii: '.' },
    retile() {},
    getWorldCoordinates() { return [(this.x + 0.5) * TILE_SIZE_WORLD, (this.y + 0.5) * TILE_SIZE_WORLD]; }
  };
}

function mockWorld(opts) {
  const o = opts || {};
  const cell = o.cell || mockCell();
  return {
    map: {
      pills: [],
      bases: [],
      cellAtWorld() { return cell; },
      cellAtTile() { return cell; },
      _cell: cell
    },
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
    team: o.team != null ? o.team : 0,
    tank_idx: o.tank_idx != null ? o.tank_idx : 0,
    speed: o.speed != null ? o.speed : 8,
    cell: null,
    on() {},
    removeListener() {},
    isAlly(other) { return other === this || (this.team !== 255 && other.team === this.team); },
    getDirection16th() { return 0; }
  };
}

function createPillbox(world, opts) {
  const o = opts || {};
  world = world || mockWorld();
  const pill = new WorldPillbox(world);
  pill.idx = 0;
  pill.x = (20 + 0.5) * TILE_SIZE_WORLD;
  pill.y = (20 + 0.5) * TILE_SIZE_WORLD;
  pill.armour = o.armour != null ? o.armour : 15;
  pill.speed = o.speed != null ? o.speed : 50;
  pill.owner = null;
  pill.owner_idx = 255;
  pill.team = 255;
  pill.inTank = false;
  pill.carried = false;
  pill.haveTarget = false;
  pill.coolDown = 32;
  pill.reload = 0;
  pill.cell = world.map._cell || world.map.cellAtWorld();
  pill.cell.pill = pill;
  return pill;
}

describe('WorldPillbox', function () {
  describe('constructor (map form)', function () {
    it('should set position from tile coordinates', function () {
      const map = { cellAtTile() { return mockCell(); } };
      const pill = new WorldPillbox(map, 10, 15, 255, 15, 50);
      expect(pill.x).to.equal((10 + 0.5) * TILE_SIZE_WORLD);
      expect(pill.y).to.equal((15 + 0.5) * TILE_SIZE_WORLD);
    });

    it('should store owner_idx, armour, speed', function () {
      const map = { cellAtTile() { return mockCell(); } };
      const pill = new WorldPillbox(map, 10, 10, 3, 12, 40);
      expect(pill.owner_idx).to.equal(3);
      expect(pill.armour).to.equal(12);
      expect(pill.speed).to.equal(40);
    });
  });

  describe('updateOwner', function () {
    it('should set team from owner', function () {
      const pill = createPillbox();
      const tank = mockTank({ team: 1, tank_idx: 5 });
      pill.owner = { $: tank, clear() {}, on() { return this; } };
      pill.updateOwner();
      expect(pill.team).to.equal(1);
      expect(pill.owner_idx).to.equal(5);
    });

    it('should set team to 255 when no owner', function () {
      const pill = createPillbox();
      pill.owner = null;
      pill.updateOwner();
      expect(pill.team).to.equal(255);
      expect(pill.owner_idx).to.equal(255);
    });
  });

  describe('updateCell', function () {
    it('should clear old cell pill reference', function () {
      const world = mockWorld();
      const pill = createPillbox(world);
      const oldCell = pill.cell;
      oldCell.pill = pill;
      // Simulate moving to a new cell
      const newCell = mockCell();
      world.map.cellAtWorld = function () { return newCell; };
      pill.updateCell();
      expect(oldCell.pill).to.be.undefined;
      expect(newCell.pill).to.equal(pill);
    });

    it('should set cell to null when inTank', function () {
      const pill = createPillbox();
      pill.inTank = true;
      pill.updateCell();
      expect(pill.cell).to.be.null;
    });

    it('should set cell to null when carried', function () {
      const pill = createPillbox();
      pill.carried = true;
      pill.updateCell();
      expect(pill.cell).to.be.null;
    });
  });

  describe('placeAt', function () {
    it('should set inTank and carried to false', function () {
      const pill = createPillbox();
      pill.inTank = true;
      pill.carried = true;
      const cell = mockCell();
      pill.placeAt(cell);
      expect(pill.inTank).to.be.false;
      expect(pill.carried).to.be.false;
    });

    it('should set position from cell coordinates', function () {
      const pill = createPillbox();
      const cell = mockCell();
      cell.x = 30; cell.y = 40;
      pill.placeAt(cell);
      expect(pill.x).to.equal((30 + 0.5) * TILE_SIZE_WORLD);
      expect(pill.y).to.equal((40 + 0.5) * TILE_SIZE_WORLD);
    });

    it('should reset coolDown and reload', function () {
      const pill = createPillbox();
      pill.coolDown = 5;
      pill.reload = 10;
      pill.placeAt(mockCell());
      expect(pill.coolDown).to.equal(32);
      expect(pill.reload).to.equal(0);
    });
  });

  describe('reset', function () {
    it('should set coolDown to 32', function () {
      const pill = createPillbox();
      pill.coolDown = 0;
      pill.reset();
      expect(pill.coolDown).to.equal(32);
    });

    it('should set reload to 0', function () {
      const pill = createPillbox();
      pill.reload = 50;
      pill.reset();
      expect(pill.reload).to.equal(0);
    });
  });

  describe('aggravate', function () {
    it('should reset coolDown to 32', function () {
      const pill = createPillbox();
      pill.coolDown = 5;
      pill.aggravate();
      expect(pill.coolDown).to.equal(32);
    });

    it('should halve speed', function () {
      const pill = createPillbox(null, { speed: 40 });
      pill.aggravate();
      expect(pill.speed).to.equal(20);
    });

    it('should not reduce speed below 6', function () {
      const pill = createPillbox(null, { speed: 8 });
      pill.aggravate();
      expect(pill.speed).to.equal(6);
    });
  });

  describe('takeShellHit', function () {
    it('should reduce armour by 1', function () {
      const pill = createPillbox(null, { armour: 15 });
      pill.takeShellHit({});
      expect(pill.armour).to.equal(14);
    });

    it('should not reduce armour below 0', function () {
      const pill = createPillbox(null, { armour: 0 });
      pill.takeShellHit({});
      expect(pill.armour).to.equal(0);
    });

    it('should return SHOT_BUILDING sound', function () {
      const pill = createPillbox();
      const sfx = pill.takeShellHit({});
      expect(sfx).to.equal(sounds.SHOT_BUILDING);
    });

    it('should aggravate on hit', function () {
      const pill = createPillbox(null, { speed: 40 });
      pill.coolDown = 5;
      pill.takeShellHit({});
      expect(pill.coolDown).to.equal(32);
      expect(pill.speed).to.equal(20);
    });
  });

  describe('takeExplosionHit', function () {
    it('should reduce armour by 5', function () {
      const pill = createPillbox(null, { armour: 15 });
      pill.takeExplosionHit();
      expect(pill.armour).to.equal(10);
    });

    it('should not reduce armour below 0', function () {
      const pill = createPillbox(null, { armour: 3 });
      pill.takeExplosionHit();
      expect(pill.armour).to.equal(0);
    });
  });

  describe('repair', function () {
    it('should increase armour by trees * 4', function () {
      const pill = createPillbox(null, { armour: 3 });
      pill.repair(2);
      expect(pill.armour).to.equal(11);
    });

    it('should cap armour at 15', function () {
      const pill = createPillbox(null, { armour: 10 });
      pill.repair(10);
      expect(pill.armour).to.equal(15);
    });

    it('should return number of trees used', function () {
      const pill = createPillbox(null, { armour: 10 });
      const used = pill.repair(10);
      // Need ceil((15-10)/4) = ceil(1.25) = 2 trees
      expect(used).to.equal(2);
    });

    it('should return 0 when already at full armour', function () {
      const pill = createPillbox(null, { armour: 15 });
      const used = pill.repair(5);
      expect(used).to.equal(0);
    });

    it('should use only available trees', function () {
      const pill = createPillbox(null, { armour: 0 });
      // Need ceil(15/4) = 4 trees, but only have 2
      const used = pill.repair(2);
      expect(used).to.equal(2);
      expect(pill.armour).to.equal(8);
    });
  });

  describe('update', function () {
    it('should skip when inTank', function () {
      const pill = createPillbox();
      pill.inTank = true;
      pill.reload = 0;
      pill.update();
      expect(pill.reload).to.equal(0);
    });

    it('should skip when carried', function () {
      const pill = createPillbox();
      pill.carried = true;
      pill.reload = 0;
      pill.update();
      expect(pill.reload).to.equal(0);
    });

    it('should pick up destroyed pillbox when tank on cell', function () {
      const world = mockWorld();
      const pill = createPillbox(world, { armour: 0 });
      const tank = mockTank();
      tank.cell = pill.cell;
      world.tanks = [tank];
      pill.update();
      expect(pill.inTank).to.be.true;
      expect(pill.x).to.be.null;
      expect(pill.y).to.be.null;
    });

    it('should not pick up destroyed pillbox if no tank on cell', function () {
      const world = mockWorld();
      const pill = createPillbox(world, { armour: 0 });
      const tank = mockTank();
      tank.cell = mockCell(); // different cell
      world.tanks = [tank];
      pill.update();
      expect(pill.inTank).to.be.false;
    });

    it('should not pick up destroyed pillbox by dead tank', function () {
      const world = mockWorld();
      const pill = createPillbox(world, { armour: 0 });
      const tank = mockTank({ armour: 255 });
      tank.cell = pill.cell;
      world.tanks = [tank];
      pill.update();
      expect(pill.inTank).to.be.false;
    });

    it('should increment reload towards speed', function () {
      const world = mockWorld();
      const pill = createPillbox(world, { armour: 15, speed: 50 });
      pill.reload = 10;
      pill.update();
      expect(pill.reload).to.equal(11);
    });

    it('should decrement coolDown', function () {
      const world = mockWorld();
      const pill = createPillbox(world, { armour: 15 });
      pill.coolDown = 10;
      pill.update();
      expect(pill.coolDown).to.equal(9);
    });

    it('should reset coolDown and increment speed at coolDown 0', function () {
      const world = mockWorld();
      const pill = createPillbox(world, { armour: 15, speed: 50 });
      pill.coolDown = 1;
      pill.update();
      expect(pill.coolDown).to.equal(32);
      expect(pill.speed).to.equal(51);
    });

    it('should cap speed at 100', function () {
      const world = mockWorld();
      const pill = createPillbox(world, { armour: 15, speed: 100 });
      pill.coolDown = 1;
      pill.update();
      expect(pill.speed).to.equal(100);
    });

    it('should not fire when reload < speed', function () {
      const world = mockWorld();
      let fired = false;
      world.spawn = function () { fired = true; return {}; };
      const enemy = mockTank({ team: 1 });
      enemy.x = pill_x(); enemy.y = pill_y();
      world.tanks = [enemy];
      const pill = createPillbox(world, { armour: 15, speed: 50 });
      pill.reload = 10;
      pill.update();
      expect(fired).to.be.false;
    });

    it('should set haveTarget when enemy in range', function () {
      const world = mockWorld();
      world.spawn = function () { return {}; };
      const enemy = mockTank({ team: 1 });
      enemy.x = pill_x(); enemy.y = pill_y();
      enemy.cell = mockCell();
      world.tanks = [enemy];
      const pill = createPillbox(world, { armour: 15, speed: 1 });
      pill.reload = 1;
      pill.update();
      expect(pill.haveTarget).to.be.true;
    });

    it('should fire on second update when enemy in range', function () {
      const world = mockWorld();
      let fired = false;
      world.spawn = function () { fired = true; return {}; };
      const enemy = mockTank({ team: 1 });
      enemy.x = pill_x() + 100; enemy.y = pill_y();
      enemy.cell = mockCell();
      world.tanks = [enemy];
      const pill = createPillbox(world, { armour: 15, speed: 1 });
      pill.reload = 1;
      // First update: sets haveTarget but doesn't fire
      pill.update();
      expect(fired).to.be.false;
      // Second update: fires
      pill.reload = 1;
      pill.update();
      expect(fired).to.be.true;
      expect(pill.reload).to.equal(0);
    });

    it('should not target allied tanks', function () {
      const world = mockWorld();
      const owner = mockTank({ team: 0, tank_idx: 0 });
      const ally = mockTank({ team: 0, tank_idx: 1 });
      ally.x = pill_x(); ally.y = pill_y();
      ally.cell = mockCell();
      world.tanks = [ally];
      const pill = createPillbox(world, { armour: 15, speed: 1 });
      pill.owner = { $: owner, clear() {}, on() { return this; } };
      pill.reload = 1;
      pill.update();
      expect(pill.haveTarget).to.be.false;
    });

    it('should not target tanks out of range', function () {
      const world = mockWorld();
      const enemy = mockTank({ team: 1 });
      // Place far away (> 2048 world units)
      enemy.x = pill_x() + 3000; enemy.y = pill_y() + 3000;
      world.tanks = [enemy];
      const pill = createPillbox(world, { armour: 15, speed: 1 });
      pill.reload = 1;
      pill.update();
      expect(pill.haveTarget).to.be.false;
    });
  });
});

// Helpers for default pillbox position
function pill_x() { return (20 + 0.5) * TILE_SIZE_WORLD; }
function pill_y() { return (20 + 0.5) * TILE_SIZE_WORLD; }
