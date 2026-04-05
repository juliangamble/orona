require('coffeescript/register');
const { expect } = require('chai');
const Shell = require('../src/objects/shell.coffee');
const { TILE_SIZE_WORLD } = require('../src/constants.coffee');

function mockCell(type, opts) {
  const ascii = type || '.';
  const o = opts || {};
  return {
    x: 20, y: 20,
    type: { ascii },
    isType(...types) { return types.some(t => t === ascii); },
    mine: o.mine || false,
    pill: o.pill || null,
    base: o.base || null,
    getWorldCoordinates() { return [(this.x + 0.5) * TILE_SIZE_WORLD, (this.y + 0.5) * TILE_SIZE_WORLD]; },
    takeShellHit() { return 0; }
  };
}

function mockWorld(opts) {
  const o = opts || {};
  const defaultCell = mockCell(o.cellType || '.');
  return {
    map: {
      pills: [],
      bases: [],
      cellAtWorld() { return o.cell || defaultCell; }
    },
    tanks: o.tanks || [],
    objects: [],
    authority: true,
    soundEffect() {},
    spawn() { return {}; },
    destroy() {}
  };
}

function mockOwner(opts) {
  const o = opts || {};
  return {
    x: o.x || 5120, y: o.y || 5120,
    direction: o.direction || 0,
    armour: 40,
    team: 0,
    builder: { $: { order: 0, states: { inTank: 0, parachuting: 3 }, cell: null, kill() {} } },
    on() {}, removeListener() {},
    isAlly(other) { return other === this; }
  };
}

function createShell(world, owner, options) {
  world = world || mockWorld();
  owner = owner || mockOwner();
  const shell = new Shell(world);
  shell.idx = 0;
  // Simulate spawn
  shell.owner = { $: owner, clear() {}, on() { return this; } };
  shell.attribution = { $: owner, clear() {}, on() { return this; } };
  shell.direction = (options && options.direction) || owner.direction || 64;
  shell.lifespan = ((options && options.range) || 7) * TILE_SIZE_WORLD / 32 - 2;
  shell.onWater = (options && options.onWater) || false;
  shell.x = owner.x;
  shell.y = owner.y;
  shell.cell = world.map.cellAtWorld(shell.x, shell.y);
  return shell;
}

describe('Shell', function () {
  describe('constructor', function () {
    it('should create a Shell instance', function () {
      const shell = createShell();
      expect(shell).to.be.instanceOf(Shell);
    });

    it('should have updatePriority of 20', function () {
      const shell = createShell();
      expect(shell.updatePriority).to.equal(20);
    });

    it('should have styled set to false', function () {
      const shell = createShell();
      expect(shell.styled).to.be.false;
    });
  });

  describe('getDirection16th', function () {
    it('should return 0 for direction 1', function () {
      const shell = createShell();
      shell.direction = 1;
      expect(shell.getDirection16th()).to.equal(0);
    });

    it('should return 1 for direction 17', function () {
      const shell = createShell();
      shell.direction = 17;
      expect(shell.getDirection16th()).to.equal(1);
    });

    it('should wrap around at 256', function () {
      const shell = createShell();
      shell.direction = 255;
      expect(shell.getDirection16th()).to.be.within(0, 15);
    });
  });

  describe('getTile', function () {
    it('should return row 4', function () {
      const shell = createShell();
      const [tx, ty] = shell.getTile();
      expect(ty).to.equal(4);
    });

    it('should vary tx with direction', function () {
      const shell = createShell();
      shell.direction = 1;
      const [tx1] = shell.getTile();
      shell.direction = 129;
      const [tx2] = shell.getTile();
      expect(tx1).to.not.equal(tx2);
    });
  });

  describe('spawn defaults', function () {
    it('should set lifespan based on range', function () {
      const shell = createShell(null, null, { range: 7 });
      expect(shell.lifespan).to.equal(7 * TILE_SIZE_WORLD / 32 - 2);
    });

    it('should default onWater to false', function () {
      const shell = createShell();
      expect(shell.onWater).to.be.false;
    });

    it('should start at owner position', function () {
      const owner = mockOwner({ x: 3000, y: 4000 });
      const shell = createShell(null, owner);
      expect(shell.x).to.equal(3000);
      expect(shell.y).to.equal(4000);
    });
  });

  describe('move', function () {
    it('should change position after move', function () {
      const shell = createShell();
      const origX = shell.x;
      const origY = shell.y;
      shell.move();
      const moved = (shell.x !== origX) || (shell.y !== origY);
      expect(moved).to.be.true;
    });

    it('should move approximately 32 units per step', function () {
      const shell = createShell(null, null, { direction: 64 });
      shell.direction = 64; // straight up
      const origX = shell.x;
      const origY = shell.y;
      shell.move();
      const dx = shell.x - origX;
      const dy = shell.y - origY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).to.be.closeTo(32, 1);
    });

    it('should update cell after move', function () {
      let cellUpdated = false;
      const world = mockWorld();
      const origCellAtWorld = world.map.cellAtWorld;
      world.map.cellAtWorld = function () { cellUpdated = true; return origCellAtWorld(); };
      const shell = createShell(world);
      shell.move();
      expect(cellUpdated).to.be.true;
    });
  });

  describe('collide', function () {
    it('should return undefined on open grass', function () {
      const world = mockWorld({ cellType: '.' });
      const shell = createShell(world);
      expect(shell.collide()).to.be.undefined;
    });

    it('should collide with building terrain', function () {
      const cell = mockCell('|');
      const world = mockWorld({ cell });
      const shell = createShell(world);
      shell.cell = cell;
      const result = shell.collide();
      expect(result).to.not.be.undefined;
      expect(result[0]).to.equal('cell');
    });

    it('should collide with forest terrain', function () {
      const cell = mockCell('#');
      const world = mockWorld({ cell });
      const shell = createShell(world);
      shell.cell = cell;
      const result = shell.collide();
      expect(result[0]).to.equal('cell');
    });

    it('should collide with shot building terrain', function () {
      const cell = mockCell('}');
      const world = mockWorld({ cell });
      const shell = createShell(world);
      shell.cell = cell;
      const result = shell.collide();
      expect(result[0]).to.equal('cell');
    });

    it('should collide with boat terrain', function () {
      const cell = mockCell('b');
      const world = mockWorld({ cell });
      const shell = createShell(world);
      shell.cell = cell;
      const result = shell.collide();
      expect(result[0]).to.equal('cell');
    });

    it('should not collide with deep sea when not onWater', function () {
      const cell = mockCell('^');
      const world = mockWorld({ cell });
      const shell = createShell(world);
      shell.cell = cell;
      shell.onWater = false;
      expect(shell.collide()).to.be.undefined;
    });

    it('should not collide with water when onWater', function () {
      const cell = mockCell(' ');
      const world = mockWorld({ cell });
      const shell = createShell(world);
      shell.cell = cell;
      shell.onWater = true;
      expect(shell.collide()).to.be.undefined;
    });

    it('should collide with grass when onWater', function () {
      const cell = mockCell('.');
      const world = mockWorld({ cell });
      const shell = createShell(world);
      shell.cell = cell;
      shell.onWater = true;
      const result = shell.collide();
      expect(result[0]).to.equal('cell');
    });

    it('should collide with pillbox that has armour', function () {
      const pill = { armour: 10, takeShellHit() { return 0; } };
      const cell = mockCell('.', { pill });
      cell.getWorldCoordinates = function () { return [this.x, this.y]; };
      // Place shell right on top of the cell
      const world = mockWorld({ cell });
      const owner = mockOwner();
      const shell = createShell(world, owner);
      shell.cell = cell;
      shell.x = cell.x;
      shell.y = cell.y;
      const result = shell.collide();
      expect(result).to.not.be.undefined;
      expect(result[0]).to.equal('cell');
      expect(result[1]).to.equal(pill);
    });

    it('should not collide with own pillbox', function () {
      const owner = mockOwner();
      const pill = { armour: 10 };
      const cell = mockCell('.', { pill });
      const world = mockWorld({ cell });
      const shell = createShell(world, owner);
      shell.cell = cell;
      // pill IS the owner
      shell.owner = { $: pill, clear() {}, on() { return this; } };
      expect(shell.collide()).to.be.undefined;
    });

    it('should collide with enemy tank', function () {
      const owner = mockOwner();
      const enemy = { x: 5120, y: 5120, armour: 40, team: 1 };
      const world = mockWorld({ tanks: [enemy] });
      const shell = createShell(world, owner);
      // Place shell right on top of enemy
      shell.x = enemy.x;
      shell.y = enemy.y;
      const result = shell.collide();
      expect(result).to.not.be.undefined;
      expect(result[0]).to.equal('tank');
      expect(result[1]).to.equal(enemy);
    });

    it('should not collide with own tank', function () {
      const owner = mockOwner();
      const world = mockWorld({ tanks: [owner] });
      const shell = createShell(world, owner);
      shell.x = owner.x;
      shell.y = owner.y;
      expect(shell.collide()).to.be.undefined;
    });

    it('should not collide with dead tank', function () {
      const owner = mockOwner();
      const dead = { x: 5120, y: 5120, armour: 255, team: 1 };
      const world = mockWorld({ tanks: [dead] });
      const shell = createShell(world, owner);
      shell.x = dead.x;
      shell.y = dead.y;
      expect(shell.collide()).to.be.undefined;
    });
  });

  describe('asplode', function () {
    it('should spawn an explosion', function () {
      let explosionSpawned = false;
      const world = mockWorld();
      world.spawn = function () { explosionSpawned = true; return {}; };
      const shell = createShell(world);
      shell.asplode(shell.x, shell.y, 'eol');
      expect(explosionSpawned).to.be.true;
    });

    it('should destroy the shell', function () {
      let destroyed = false;
      const world = mockWorld();
      world.destroy = function (obj) { if (obj === shell) destroyed = true; };
      world.spawn = function () { return {}; };
      const shell = createShell(world);
      shell.asplode(shell.x, shell.y, 'eol');
      expect(destroyed).to.be.true;
    });

    it('should kill builders on the same cell in cell mode', function () {
      let builderKilled = false;
      const builder = {
        order: 1, // waiting (not inTank or parachuting)
        states: { inTank: 0, parachuting: 3 },
        cell: null,
        kill() { builderKilled = true; }
      };
      const tank = { builder: { $: builder }, armour: 40 };
      const world = mockWorld({ tanks: [tank] });
      world.spawn = function () { return {}; };
      const shell = createShell(world);
      builder.cell = shell.cell;
      shell.asplode(shell.x, shell.y, 'cell');
      expect(builderKilled).to.be.true;
    });

    it('should not kill builders that are inTank', function () {
      let builderKilled = false;
      const builder = {
        order: 0, // inTank
        states: { inTank: 0, parachuting: 3 },
        cell: null,
        kill() { builderKilled = true; }
      };
      const tank = { builder: { $: builder }, armour: 40 };
      const world = mockWorld({ tanks: [tank] });
      world.spawn = function () { return {}; };
      const shell = createShell(world);
      builder.cell = shell.cell;
      shell.asplode(shell.x, shell.y, 'cell');
      expect(builderKilled).to.be.false;
    });
  });

  describe('update', function () {
    it('should decrement lifespan when no collision', function () {
      const world = mockWorld({ cellType: '.' });
      const shell = createShell(world);
      const before = shell.lifespan;
      shell.update();
      expect(shell.lifespan).to.equal(before - 1);
    });

    it('should destroy shell when lifespan reaches 0', function () {
      let destroyed = false;
      const world = mockWorld({ cellType: '.' });
      world.destroy = function () { destroyed = true; };
      world.spawn = function () { return {}; };
      const shell = createShell(world);
      shell.lifespan = 0;
      shell.update();
      expect(destroyed).to.be.true;
    });
  });
});
