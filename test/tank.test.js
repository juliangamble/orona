require('coffeescript/register');
const { expect } = require('chai');
const Tank = require('../src/objects/tank.coffee');

// Minimal mock world that satisfies Tank's constructor and methods
function mockWorld() {
  const map = {
    pills: [],
    bases: [],
    starts: [{ cell: { getWorldCoordinates: () => [5120, 5120], x: 20, y: 20 }, direction: 0 }],
    cellAtWorld(x, y) { return mockCell(); },
    cellAtTile(x, y) { return mockCell(); },
    getRandomStart() { return this.starts[0]; }
  };
  const world = {
    map,
    tanks: [],
    objects: [],
    authority: true,
    addTank(t) { this.tanks.push(t); },
    removeTank(t) {
      const i = this.tanks.indexOf(t);
      if (i !== -1) this.tanks.splice(i, 1);
    },
    soundEffect() {},
    spawn(Cls, ...args) {
      const obj = { $: {}, clear() {}, on() { return this; }, world };
      // For Builder refs, return a thin wrapper
      return obj;
    },
    destroy() {}
  };
  return world;
}

function mockCell(type, opts) {
  const ascii = type || '.';
  return {
    x: 20, y: 20,
    type: { ascii },
    isType(...types) { return types.some(t => t === ascii); },
    mine: (opts && opts.mine) || false,
    pill: (opts && opts.pill) || null,
    base: (opts && opts.base) || null,
    getTankSpeed() {
      if (ascii === '.' || ascii === ':' || ascii === '~') return 16;
      if (ascii === '|' || ascii === '}') return 0;
      if (ascii === ' ' || ascii === '^') return 16;
      return 8;
    },
    getTankTurn() {
      if (ascii === '.') return 1;
      return 0.5;
    },
    getWorldCoordinates() { return [5120, 5120]; },
    setType() {}
  };
}

function createTank(world) {
  world = world || mockWorld();
  const tank = new Tank(world);
  // Simulate what world.spawn + anySpawn does
  tank.idx = 0;
  tank.team = 0;
  tank.builder = { $: {}, clear() {}, on() { return this; } };
  tank.reset();
  tank.cell = mockCell('.');
  world.tanks.push(tank);
  return tank;
}

describe('Tank', function () {
  describe('constructor', function () {
    it('should create a Tank instance', function () {
      const tank = createTank();
      expect(tank).to.be.instanceOf(Tank);
    });

    it('should have styled set to true', function () {
      const tank = createTank();
      expect(tank.styled).to.be.true;
    });
  });

  describe('reset', function () {
    it('should set initial armour to 40', function () {
      const tank = createTank();
      expect(tank.armour).to.equal(40);
    });

    it('should set initial shells to 40', function () {
      const tank = createTank();
      expect(tank.shells).to.equal(40);
    });

    it('should set initial mines to 0', function () {
      const tank = createTank();
      expect(tank.mines).to.equal(0);
    });

    it('should set initial trees to 0', function () {
      const tank = createTank();
      expect(tank.trees).to.equal(0);
    });

    it('should set speed to 0', function () {
      const tank = createTank();
      expect(tank.speed).to.equal(0);
    });

    it('should start on a boat', function () {
      const tank = createTank();
      expect(tank.onBoat).to.be.true;
    });

    it('should set firing range to 7', function () {
      const tank = createTank();
      expect(tank.firingRange).to.equal(7);
    });

    it('should not be shooting', function () {
      const tank = createTank();
      expect(tank.shooting).to.be.false;
    });

    it('should not be accelerating or braking', function () {
      const tank = createTank();
      expect(tank.accelerating).to.be.false;
      expect(tank.braking).to.be.false;
    });

    it('should not be turning', function () {
      const tank = createTank();
      expect(tank.turningClockwise).to.be.false;
      expect(tank.turningCounterClockwise).to.be.false;
    });

    it('should set position from random start', function () {
      const tank = createTank();
      expect(tank.x).to.equal(5120);
      expect(tank.y).to.equal(5120);
    });
  });

  describe('getDirection16th', function () {
    it('should return 0 for direction 1', function () {
      const tank = createTank();
      tank.direction = 1;
      expect(tank.getDirection16th()).to.equal(0);
    });

    it('should return 1 for direction 17', function () {
      const tank = createTank();
      tank.direction = 17;
      expect(tank.getDirection16th()).to.equal(1);
    });

    it('should wrap around at 256', function () {
      const tank = createTank();
      tank.direction = 255;
      expect(tank.getDirection16th()).to.be.within(0, 15);
    });
  });

  describe('increaseRange / decreaseRange', function () {
    it('should increase firing range by 0.5', function () {
      const tank = createTank();
      tank.firingRange = 3;
      tank.increaseRange();
      expect(tank.firingRange).to.equal(3.5);
    });

    it('should not exceed max range of 7', function () {
      const tank = createTank();
      tank.firingRange = 7;
      tank.increaseRange();
      expect(tank.firingRange).to.equal(7);
    });

    it('should decrease firing range by 0.5', function () {
      const tank = createTank();
      tank.firingRange = 5;
      tank.decreaseRange();
      expect(tank.firingRange).to.equal(4.5);
    });

    it('should not go below min range of 1', function () {
      const tank = createTank();
      tank.firingRange = 1;
      tank.decreaseRange();
      expect(tank.firingRange).to.equal(1);
    });
  });

  describe('isAlly', function () {
    it('should consider self as ally', function () {
      const tank = createTank();
      expect(tank.isAlly(tank)).to.be.true;
    });

    it('should consider same team as ally', function () {
      const world = mockWorld();
      const tank1 = createTank(world);
      const tank2 = createTank(world);
      tank1.team = 1;
      tank2.team = 1;
      expect(tank1.isAlly(tank2)).to.be.true;
    });

    it('should not consider different team as ally', function () {
      const world = mockWorld();
      const tank1 = createTank(world);
      const tank2 = createTank(world);
      tank1.team = 0;
      tank2.team = 1;
      expect(tank1.isAlly(tank2)).to.be.false;
    });

    it('should not consider team 255 (no team) as ally', function () {
      const world = mockWorld();
      const tank1 = createTank(world);
      const tank2 = createTank(world);
      tank1.team = 255;
      tank2.team = 255;
      expect(tank1.isAlly(tank2)).to.be.false;
    });
  });

  describe('getTile', function () {
    it('should return boat row when on boat', function () {
      const tank = createTank();
      tank.onBoat = true;
      tank.direction = 1;
      const [tx, ty] = tank.getTile();
      expect(ty).to.equal(1);
    });

    it('should return tank row when not on boat', function () {
      const tank = createTank();
      tank.onBoat = false;
      tank.direction = 1;
      const [tx, ty] = tank.getTile();
      expect(ty).to.equal(0);
    });

    it('should vary tx with direction', function () {
      const tank = createTank();
      tank.direction = 1;
      const [tx1] = tank.getTile();
      tank.direction = 129;
      const [tx2] = tank.getTile();
      expect(tx1).to.not.equal(tx2);
    });
  });

  describe('getCarryingPillboxes', function () {
    it('should return empty array when no pills', function () {
      const tank = createTank();
      expect(tank.getCarryingPillboxes()).to.deep.equal([]);
    });

    it('should return pills owned by this tank that are inTank', function () {
      const world = mockWorld();
      const tank = createTank(world);
      const pill = { inTank: true, owner: { $: tank } };
      world.map.pills.push(pill);
      expect(tank.getCarryingPillboxes()).to.deep.equal([pill]);
    });

    it('should not return pills owned by other tanks', function () {
      const world = mockWorld();
      const tank = createTank(world);
      const other = createTank(world);
      const pill = { inTank: true, owner: { $: other } };
      world.map.pills.push(pill);
      expect(tank.getCarryingPillboxes()).to.deep.equal([]);
    });

    it('should not return pills not inTank', function () {
      const world = mockWorld();
      const tank = createTank(world);
      const pill = { inTank: false, owner: { $: tank } };
      world.map.pills.push(pill);
      expect(tank.getCarryingPillboxes()).to.deep.equal([]);
    });
  });

  describe('takeShellHit', function () {
    it('should reduce armour by 5', function () {
      const tank = createTank();
      tank.armour = 40;
      tank.takeShellHit({ direction: 0 });
      expect(tank.armour).to.equal(35);
    });

    it('should set slide on hit', function () {
      const tank = createTank();
      tank.takeShellHit({ direction: 128 });
      expect(tank.slideTicks).to.equal(8);
      expect(tank.slideDirection).to.equal(128);
    });

    it('should kill tank when armour goes below 0', function () {
      const tank = createTank();
      tank.armour = 3;
      tank.takeShellHit({ direction: 0 });
      expect(tank.armour).to.equal(255);
    });

    it('should destroy boat on hit', function () {
      const tank = createTank();
      tank.onBoat = true;
      tank.armour = 40;
      tank.takeShellHit({ direction: 0 });
      expect(tank.onBoat).to.be.false;
    });

    it('should return HIT_TANK sound', function () {
      const sounds = require('../src/sounds.coffee');
      const tank = createTank();
      const result = tank.takeShellHit({ direction: 0 });
      expect(result).to.equal(sounds.HIT_TANK);
    });
  });

  describe('takeMineHit', function () {
    it('should reduce armour by 10', function () {
      const tank = createTank();
      tank.armour = 40;
      tank.takeMineHit();
      expect(tank.armour).to.equal(30);
    });

    it('should kill tank when armour goes below 0', function () {
      const tank = createTank();
      tank.armour = 5;
      tank.takeMineHit();
      expect(tank.armour).to.equal(255);
    });

    it('should destroy boat on mine hit', function () {
      const tank = createTank();
      tank.onBoat = true;
      tank.armour = 40;
      tank.takeMineHit();
      expect(tank.onBoat).to.be.false;
    });
  });

  describe('kill', function () {
    it('should set armour to 255', function () {
      const tank = createTank();
      tank.kill();
      expect(tank.armour).to.equal(255);
    });

    it('should null out position', function () {
      const tank = createTank();
      tank.kill();
      expect(tank.x).to.be.null;
      expect(tank.y).to.be.null;
    });

    it('should set respawnTimer to 255', function () {
      const tank = createTank();
      tank.kill();
      expect(tank.respawnTimer).to.equal(255);
    });
  });

  describe('death', function () {
    it('should return false when alive', function () {
      const tank = createTank();
      expect(tank.death()).to.be.false;
    });

    it('should return true when dead', function () {
      const tank = createTank();
      tank.kill();
      expect(tank.death()).to.be.true;
    });

    it('should decrement respawnTimer on authority', function () {
      const tank = createTank();
      tank.kill();
      const before = tank.respawnTimer;
      tank.death();
      expect(tank.respawnTimer).to.equal(before - 1);
    });
  });

  describe('turn', function () {
    it('should not turn when both keys cancel out', function () {
      const tank = createTank();
      tank.direction = 128;
      tank.turningClockwise = true;
      tank.turningCounterClockwise = true;
      tank.turn();
      expect(tank.direction).to.equal(128);
      expect(tank.turnSpeedup).to.equal(0);
    });

    it('should turn counter-clockwise', function () {
      const tank = createTank();
      tank.direction = 128;
      tank.turningCounterClockwise = true;
      tank.turn();
      expect(tank.direction).to.be.greaterThan(128);
    });

    it('should turn clockwise', function () {
      const tank = createTank();
      tank.direction = 128;
      tank.turningClockwise = true;
      tank.turn();
      expect(tank.direction).to.be.lessThan(128);
    });

    it('should wrap direction below 0', function () {
      const tank = createTank();
      tank.direction = 0;
      tank.turningClockwise = true;
      tank.turnSpeedup = -20;
      tank.turn();
      expect(tank.direction).to.be.greaterThanOrEqual(0);
      expect(tank.direction).to.be.lessThan(256);
    });
  });

  describe('accelerate', function () {
    it('should increase speed when accelerating', function () {
      const tank = createTank();
      tank.speed = 0;
      tank.accelerating = true;
      tank.accelerate();
      expect(tank.speed).to.equal(0.25);
    });

    it('should decrease speed when braking', function () {
      const tank = createTank();
      tank.speed = 4;
      tank.braking = true;
      tank.accelerate();
      expect(tank.speed).to.equal(3.75);
    });

    it('should not go below 0 speed', function () {
      const tank = createTank();
      tank.speed = 0;
      tank.braking = true;
      tank.accelerate();
      expect(tank.speed).to.equal(0);
    });

    it('should not exceed max speed for terrain', function () {
      const tank = createTank();
      tank.speed = 16;
      tank.accelerating = true;
      tank.accelerate();
      expect(tank.speed).to.equal(16);
    });

    it('should do nothing when accelerating and braking cancel out', function () {
      const tank = createTank();
      tank.speed = 4;
      tank.accelerating = true;
      tank.braking = true;
      tank.accelerate();
      expect(tank.speed).to.equal(4);
    });
  });

  describe('shootOrReload', function () {
    it('should fire when shooting with shells and no reload', function () {
      const world = mockWorld();
      let spawned = false;
      world.spawn = function () { spawned = true; return {}; };
      const tank = createTank(world);
      tank.shooting = true;
      tank.reload = 0;
      tank.shells = 10;
      tank.shootOrReload();
      expect(spawned).to.be.true;
      expect(tank.shells).to.equal(9);
      expect(tank.reload).to.equal(13);
    });

    it('should not fire when reloading', function () {
      const world = mockWorld();
      let spawned = false;
      world.spawn = function () { spawned = true; return {}; };
      const tank = createTank(world);
      tank.shooting = true;
      tank.reload = 5;
      tank.shells = 10;
      tank.shootOrReload();
      expect(spawned).to.be.false;
      expect(tank.reload).to.equal(4);
    });

    it('should not fire when out of shells', function () {
      const world = mockWorld();
      let spawned = false;
      world.spawn = function () { spawned = true; return {}; };
      const tank = createTank(world);
      tank.shooting = true;
      tank.reload = 0;
      tank.shells = 0;
      tank.shootOrReload();
      expect(spawned).to.be.false;
    });

    it('should decrement reload timer', function () {
      const tank = createTank();
      tank.reload = 5;
      tank.shooting = false;
      tank.shootOrReload();
      expect(tank.reload).to.equal(4);
    });
  });
});
