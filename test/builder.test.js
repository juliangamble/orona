require('coffeescript/register');
const { expect } = require('chai');
const Builder = require('../src/objects/builder.coffee');

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
    life: 5,
    setType(newType, mine, life) {
      if (newType != null) this.type = { ascii: newType };
      if (mine != null) this.mine = mine;
      if (life != null) this.life = life;
    },
    getWorldCoordinates() { return [5120, 5120]; },
    getManSpeed() {
      if (ascii === '.' || ascii === '=' || ascii === ':') return 16;
      if (ascii === '#') return 8;
      if (ascii === '|' || ascii === '}' || ascii === '^' || ascii === ' ') return 0;
      return 8;
    },
    hasTankOnBoat() { return false; }
  };
}

function mockWorld() {
  const map = {
    pills: [],
    bases: [],
    starts: [{ cell: { getWorldCoordinates: () => [5120, 5120] }, direction: 0 }],
    cellAtWorld() { return mockCell('.'); },
    cellAtTile() { return mockCell('.'); },
    getRandomStart() { return this.starts[0]; }
  };
  return {
    map,
    tanks: [],
    objects: [],
    authority: true,
    addTank(t) { this.tanks.push(t); },
    removeTank(t) { const i = this.tanks.indexOf(t); if (i !== -1) this.tanks.splice(i, 1); },
    soundEffect() {},
    spawn() { return {}; },
    destroy() {}
  };
}

function mockTank(opts) {
  const o = opts || {};
  return {
    x: 5120, y: 5120,
    armour: o.armour != null ? o.armour : 40,
    shells: 40, mines: o.mines != null ? o.mines : 5,
    trees: o.trees != null ? o.trees : 10,
    onBoat: o.onBoat || false,
    team: 0,
    cell: mockCell('.'),
    getCarryingPillboxes() { return o.pills || []; }
  };
}

function createBuilder(world, tank) {
  world = world || mockWorld();
  tank = tank || mockTank();
  const builder = new Builder(world);
  builder.idx = 0;
  // Simulate spawn
  builder.owner = { $: tank, clear() {}, on() { return this; } };
  builder.order = builder.states.inTank;
  builder.team = tank.team;
  builder.animation = 0;
  builder.trees = 0;
  builder.hasMine = false;
  builder.pillbox = null;
  builder.x = null;
  builder.y = null;
  builder.cell = null;
  return builder;
}

describe('Builder', function () {
  describe('states', function () {
    it('should define inTank as 0', function () {
      const b = createBuilder();
      expect(b.states.inTank).to.equal(0);
    });

    it('should define waiting as 1', function () {
      const b = createBuilder();
      expect(b.states.waiting).to.equal(1);
    });

    it('should define returning as 2', function () {
      const b = createBuilder();
      expect(b.states.returning).to.equal(2);
    });

    it('should define parachuting as 3', function () {
      const b = createBuilder();
      expect(b.states.parachuting).to.equal(3);
    });

    it('should define action states starting at 10', function () {
      const b = createBuilder();
      expect(b.states.actions._min).to.equal(10);
      expect(b.states.actions.forest).to.equal(10);
      expect(b.states.actions.mine).to.equal(16);
    });

    it('should define all build actions', function () {
      const b = createBuilder();
      const actions = b.states.actions;
      expect(actions).to.have.property('forest');
      expect(actions).to.have.property('road');
      expect(actions).to.have.property('repair');
      expect(actions).to.have.property('boat');
      expect(actions).to.have.property('building');
      expect(actions).to.have.property('pillbox');
      expect(actions).to.have.property('mine');
    });
  });

  describe('getTile', function () {
    it('should return parachute tile when parachuting', function () {
      const b = createBuilder();
      b.order = b.states.parachuting;
      const [tx, ty] = b.getTile();
      expect(tx).to.equal(16);
      expect(ty).to.equal(1);
    });

    it('should return animation-based tile otherwise', function () {
      const b = createBuilder();
      b.order = b.states.waiting;
      b.animation = 0;
      const [tx, ty] = b.getTile();
      expect(tx).to.equal(17);
      expect(ty).to.equal(0);
    });

    it('should vary tile with animation frame', function () {
      const b = createBuilder();
      b.order = b.states.returning;
      b.animation = 6;
      const [tx, ty] = b.getTile();
      expect(ty).to.equal(2); // floor(6/3) = 2
    });
  });

  describe('performOrder', function () {
    it('should not accept orders when not inTank', function () {
      const b = createBuilder();
      b.order = b.states.waiting;
      const tank = b.owner.$;
      const origTrees = tank.trees;
      b.performOrder('road', 2, mockCell('.'));
      expect(b.order).to.equal(b.states.waiting);
      expect(tank.trees).to.equal(origTrees);
    });

    it('should accept a road order and deduct trees', function () {
      const tank = mockTank({ trees: 10 });
      const b = createBuilder(null, tank);
      b.performOrder('road', 2, tank.cell);
      expect(b.order).to.equal(b.states.actions.road);
      expect(b.trees).to.equal(2);
      expect(tank.trees).to.equal(8);
    });

    it('should reject order if tank has insufficient trees', function () {
      const tank = mockTank({ trees: 1 });
      const b = createBuilder(null, tank);
      b.performOrder('road', 5, tank.cell);
      expect(b.order).to.equal(b.states.inTank);
    });

    it('should accept mine order and deduct a mine', function () {
      const tank = mockTank({ mines: 3 });
      const b = createBuilder(null, tank);
      b.performOrder('mine', 0, tank.cell);
      expect(b.order).to.equal(b.states.actions.mine);
      expect(b.hasMine).to.be.true;
      expect(tank.mines).to.equal(2);
    });

    it('should reject mine order when tank has no mines', function () {
      const tank = mockTank({ mines: 0 });
      const b = createBuilder(null, tank);
      b.performOrder('mine', 0, tank.cell);
      expect(b.order).to.equal(b.states.inTank);
    });

    it('should handle pillbox order and pop a carried pill', function () {
      const EventEmitter = require('events');
      const pill = new EventEmitter();
      pill.inTank = true; pill.carried = false;
      const tank = mockTank({ pills: [pill] });
      const b = createBuilder(null, tank);
      b.performOrder('pillbox', 4, tank.cell);
      expect(b.order).to.equal(b.states.actions.pillbox);
      expect(pill.inTank).to.be.false;
      expect(pill.carried).to.be.true;
    });

    it('should reject pillbox order when no pills carried', function () {
      const tank = mockTank({ pills: [] });
      const b = createBuilder(null, tank);
      b.performOrder('pillbox', 4, tank.cell);
      expect(b.order).to.equal(b.states.inTank);
    });

    it('should set position to tank position on order', function () {
      const tank = mockTank();
      const b = createBuilder(null, tank);
      b.performOrder('road', 2, tank.cell);
      expect(b.x).to.equal(tank.x);
      expect(b.y).to.equal(tank.y);
    });

    it('should set target to cell world coordinates', function () {
      const tank = mockTank();
      const cell = mockCell('.');
      const b = createBuilder(null, tank);
      b.performOrder('road', 2, cell);
      expect(b.targetX).to.equal(5120);
      expect(b.targetY).to.equal(5120);
    });
  });

  describe('kill', function () {
    it('should set order to parachuting', function () {
      const world = mockWorld();
      const tank = mockTank();
      const b = createBuilder(world, tank);
      b.order = b.states.actions.road;
      b.x = 5120; b.y = 5120;
      b.cell = mockCell('.');
      b.kill();
      expect(b.order).to.equal(b.states.parachuting);
    });

    it('should clear trees and hasMine', function () {
      const world = mockWorld();
      const tank = mockTank();
      const b = createBuilder(world, tank);
      b.order = b.states.actions.road;
      b.x = 5120; b.y = 5120;
      b.cell = mockCell('.');
      b.trees = 5;
      b.hasMine = true;
      b.kill();
      expect(b.trees).to.equal(0);
      expect(b.hasMine).to.be.false;
    });

    it('should not kill when not authority', function () {
      const world = mockWorld();
      world.authority = false;
      const b = createBuilder(world);
      b.order = b.states.actions.road;
      b.kill();
      expect(b.order).to.equal(b.states.actions.road);
    });

    it('should set target to own position when tank is dead', function () {
      const world = mockWorld();
      const tank = mockTank({ armour: 255 });
      const b = createBuilder(world, tank);
      b.order = b.states.actions.road;
      b.x = 3000; b.y = 4000;
      b.cell = mockCell('.');
      b.kill();
      expect(b.targetX).to.equal(3000);
      expect(b.targetY).to.equal(4000);
    });

    it('should set target to tank position when tank is alive', function () {
      const world = mockWorld();
      const tank = mockTank({ armour: 40 });
      tank.x = 7000; tank.y = 8000;
      const b = createBuilder(world, tank);
      b.order = b.states.actions.road;
      b.x = 3000; b.y = 4000;
      b.cell = mockCell('.');
      b.kill();
      expect(b.targetX).to.equal(7000);
      expect(b.targetY).to.equal(8000);
    });
  });

  describe('reached - returning', function () {
    it('should set order to inTank when returning', function () {
      const b = createBuilder();
      b.order = b.states.returning;
      b.trees = 3;
      b.hasMine = false;
      b.reached();
      expect(b.order).to.equal(b.states.inTank);
      expect(b.x).to.be.null;
      expect(b.y).to.be.null;
    });

    it('should return trees to tank', function () {
      const tank = mockTank({ trees: 5 });
      const b = createBuilder(null, tank);
      b.order = b.states.returning;
      b.trees = 3;
      b.hasMine = false;
      b.reached();
      expect(tank.trees).to.equal(8);
      expect(b.trees).to.equal(0);
    });

    it('should cap returned trees at 40', function () {
      const tank = mockTank({ trees: 38 });
      const b = createBuilder(null, tank);
      b.order = b.states.returning;
      b.trees = 10;
      b.hasMine = false;
      b.reached();
      expect(tank.trees).to.equal(40);
    });

    it('should return mine to tank', function () {
      const tank = mockTank({ mines: 5 });
      const b = createBuilder(null, tank);
      b.order = b.states.returning;
      b.trees = 0;
      b.hasMine = true;
      b.reached();
      expect(tank.mines).to.equal(6);
      expect(b.hasMine).to.be.false;
    });

    it('should return carried pillbox to inTank state', function () {
      const pill = { inTank: false, carried: true };
      const b = createBuilder();
      b.order = b.states.returning;
      b.trees = 0;
      b.hasMine = false;
      b.pillbox = { $: pill, clear() {}, on() { return this; } };
      b.reached();
      expect(pill.inTank).to.be.true;
      expect(pill.carried).to.be.false;
    });
  });

  describe('reached - build actions', function () {
    it('should harvest forest and gain 4 trees', function () {
      const b = createBuilder();
      b.order = b.states.actions.forest;
      const cell = mockCell('#');
      b.cell = cell;
      b.reached();
      expect(cell.type.ascii).to.equal('.');
      expect(b.trees).to.equal(4);
      expect(b.order).to.equal(b.states.waiting);
    });

    it('should not harvest forest on base cell', function () {
      const b = createBuilder();
      b.order = b.states.actions.forest;
      b.cell = mockCell('#', { base: {} });
      b.reached();
      expect(b.trees).to.equal(0);
    });

    it('should build road on grass', function () {
      const b = createBuilder();
      b.order = b.states.actions.road;
      const cell = mockCell('.');
      b.cell = cell;
      b.reached();
      expect(cell.type.ascii).to.equal('=');
      expect(b.order).to.equal(b.states.waiting);
    });

    it('should not build road on building', function () {
      const b = createBuilder();
      b.order = b.states.actions.road;
      b.cell = mockCell('|');
      b.reached();
      // Should still transition to waiting (the switch falls through to the end)
      expect(b.order).to.equal(b.states.waiting);
    });

    it('should repair shot building to building', function () {
      const b = createBuilder();
      b.order = b.states.actions.repair;
      const cell = mockCell('}');
      b.cell = cell;
      b.reached();
      expect(cell.type.ascii).to.equal('|');
      expect(b.order).to.equal(b.states.waiting);
    });

    it('should repair pillbox and deduct trees', function () {
      let repairCalled = false;
      const pill = { repair(trees) { repairCalled = true; return 3; } };
      const b = createBuilder();
      b.order = b.states.actions.repair;
      b.trees = 5;
      b.cell = mockCell('.', { pill });
      b.reached();
      expect(repairCalled).to.be.true;
      expect(b.trees).to.equal(2);
    });

    it('should build boat on water', function () {
      const b = createBuilder();
      b.order = b.states.actions.boat;
      const cell = mockCell(' ');
      b.cell = cell;
      b.reached();
      expect(cell.type.ascii).to.equal('b');
      expect(b.order).to.equal(b.states.waiting);
    });

    it('should not build boat on non-water', function () {
      const b = createBuilder();
      b.order = b.states.actions.boat;
      b.cell = mockCell('.');
      b.reached();
      // Cell unchanged
      expect(b.cell.type.ascii).to.equal('.');
    });

    it('should build building on grass', function () {
      const b = createBuilder();
      b.order = b.states.actions.building;
      const cell = mockCell('.');
      b.cell = cell;
      b.reached();
      expect(cell.type.ascii).to.equal('|');
      expect(b.order).to.equal(b.states.waiting);
    });

    it('should not build building on forest', function () {
      const b = createBuilder();
      b.order = b.states.actions.building;
      b.cell = mockCell('#');
      b.reached();
      // '#' is in the exclusion list, so cell stays as forest
      expect(b.cell.type.ascii).to.equal('#');
    });

    it('should place pillbox on valid cell', function () {
      const pill = { armour: 0, placeAt(cell) { this.placed = cell; } };
      const b = createBuilder();
      b.order = b.states.actions.pillbox;
      b.pillbox = { $: pill, clear() {}, on() { return this; } };
      b.trees = 4;
      const cell = mockCell('.');
      b.cell = cell;
      b.reached();
      expect(pill.armour).to.equal(15);
      expect(pill.placed).to.equal(cell);
      expect(b.trees).to.equal(0);
    });

    it('should lay mine on valid cell', function () {
      const b = createBuilder();
      b.order = b.states.actions.mine;
      b.hasMine = true;
      const cell = mockCell('.');
      b.cell = cell;
      b.reached();
      expect(cell.mine).to.be.true;
      expect(b.hasMine).to.be.false;
    });

    it('should not lay mine on water', function () {
      const b = createBuilder();
      b.order = b.states.actions.mine;
      b.hasMine = true;
      b.cell = mockCell(' ');
      b.reached();
      expect(b.cell.mine).to.be.false;
    });

    it('should trigger mine explosion if cell is mined', function () {
      const world = mockWorld();
      let mineSpawned = false;
      world.spawn = function () { mineSpawned = true; return {}; };
      const b = createBuilder(world);
      b.order = b.states.actions.road;
      b.cell = mockCell('.', { mine: true });
      b.reached();
      expect(mineSpawned).to.be.true;
      expect(b.order).to.equal(b.states.waiting);
      expect(b.waitTimer).to.equal(20);
    });
  });

  describe('update', function () {
    it('should not animate when inTank', function () {
      const b = createBuilder();
      b.order = b.states.inTank;
      b.animation = 0;
      b.update();
      expect(b.animation).to.equal(0);
    });

    it('should increment animation when not inTank', function () {
      const b = createBuilder();
      b.order = b.states.waiting;
      b.waitTimer = 10;
      b.animation = 0;
      b.update();
      expect(b.animation).to.equal(1);
    });

    it('should wrap animation at 9', function () {
      const b = createBuilder();
      b.order = b.states.waiting;
      b.waitTimer = 10;
      b.animation = 8;
      b.update();
      expect(b.animation).to.equal(0);
    });

    it('should decrement waitTimer when waiting', function () {
      const b = createBuilder();
      b.order = b.states.waiting;
      b.waitTimer = 5;
      b.update();
      expect(b.waitTimer).to.equal(4);
    });

    it('should transition to returning when waitTimer hits 0', function () {
      const b = createBuilder();
      b.order = b.states.waiting;
      b.waitTimer = 0;
      b.update();
      // Post-decrement: checks 0 == 0 (true), then decrements
      expect(b.order).to.equal(b.states.returning);
    });
  });
});
