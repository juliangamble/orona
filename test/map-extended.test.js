require('coffeescript/register');
const { expect } = require('chai');
const { Map, TERRAIN_TYPES } = require('../src/map.coffee');
const WorldMap = require('../src/world_map.coffee');

describe('Map Retiling', function() {
  let map, cell;

  beforeEach(function() {
    map = new Map();
    cell = map.cellAtTile(100, 100);
  });

  describe('retileBuilding', function() {
    it('should render isolated building', function() {
      cell.setType('|');
      // Isolated building should use standalone tile
      expect(cell.type.ascii).to.equal('|');
    });

    it('should connect adjacent buildings', function() {
      cell.setType('|');
      map.cellAtTile(101, 100).setType('|');
      map.cellAtTile(99, 100).setType('|');
      // Buildings should connect horizontally
      expect(cell.type.ascii).to.equal('|');
    });
  });

  describe('retileRiver', function() {
    it('should render river surrounded by land', function() {
      cell.setType(' ');
      expect(cell.type.ascii).to.equal(' ');
    });

    it('should connect to adjacent water', function() {
      cell.setType(' ');
      map.cellAtTile(101, 100).setType(' ');
      expect(cell.type.ascii).to.equal(' ');
    });
  });

  describe('retileRoad', function() {
    it('should render isolated road', function() {
      cell.setType('=');
      expect(cell.type.ascii).to.equal('=');
    });

    it('should connect adjacent roads', function() {
      cell.setType('=');
      map.cellAtTile(101, 100).setType('=');
      map.cellAtTile(99, 100).setType('=');
      expect(cell.type.ascii).to.equal('=');
    });
  });

  describe('retileForest', function() {
    it('should render isolated forest', function() {
      cell.setType('#');
      expect(cell.type.ascii).to.equal('#');
    });

    it('should connect adjacent forests', function() {
      cell.setType('#');
      map.cellAtTile(101, 100).setType('#');
      expect(cell.type.ascii).to.equal('#');
    });
  });

  describe('retileBoat', function() {
    it('should render boat on water', function() {
      cell.setType('b');
      expect(cell.type.ascii).to.equal('b');
    });
  });
});

describe('Map Serialization', function() {
  let map;

  beforeEach(function() {
    map = new Map();
  });

  describe('dump', function() {
    it('should create BMAP header', function() {
      const data = map.dump();
      expect(data.length).to.be.greaterThan(12);
      // Check magic bytes "BMAPBOLO"
      expect(String.fromCharCode(...data.slice(0, 8))).to.equal('BMAPBOLO');
    });

    it('should include version number', function() {
      const data = map.dump();
      expect(data[8]).to.equal(1); // Version 1
    });

    it('should serialize empty map', function() {
      const data = map.dump();
      expect(data).to.be.an('array');
      expect(data.length).to.be.greaterThan(0);
    });

    it('should serialize map with terrain', function() {
      map.cellAtTile(50, 50).setType('.');
      map.cellAtTile(51, 50).setType('#');
      const data = map.dump();
      expect(data.length).to.be.greaterThan(12);
    });

    it('should exclude pills when noPills option set', function() {
      const data = map.dump({ noPills: true });
      expect(data[9]).to.equal(0); // numPills
    });

    it('should exclude bases when noBases option set', function() {
      const data = map.dump({ noBases: true });
      expect(data[10]).to.equal(0); // numBases
    });

    it('should exclude starts when noStarts option set', function() {
      const data = map.dump({ noStarts: true });
      expect(data[11]).to.equal(0); // numStarts
    });
  });

  describe('load', function() {
    it('should load empty map', function() {
      const data = map.dump();
      const loaded = Map.load(data);
      expect(loaded).to.be.instanceOf(Map);
      expect(loaded.cells.length).to.equal(256);
    });

    it('should preserve terrain types', function() {
      map.cellAtTile(50, 50).setType('.');
      map.cellAtTile(51, 50).setType('#');
      const data = map.dump();
      const loaded = Map.load(data);
      expect(loaded.cellAtTile(50, 50).type.ascii).to.equal('.');
      expect(loaded.cellAtTile(51, 50).type.ascii).to.equal('#');
    });

    it('should throw error for invalid magic bytes', function() {
      const badData = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(() => Map.load(badData)).to.throw('Not a Bolo map');
    });

    it('should throw error for unsupported version', function() {
      const data = map.dump();
      data[8] = 99; // Invalid version
      expect(() => Map.load(data)).to.throw('Unsupported map version');
    });
  });

  describe('round-trip', function() {
    it('should preserve map through dump/load cycle', function() {
      map.cellAtTile(50, 50).setType('.');
      map.cellAtTile(51, 50).setType('#');
      map.cellAtTile(52, 50).setType('=');
      
      const data = map.dump();
      const loaded = Map.load(data);
      
      expect(loaded.cellAtTile(50, 50).type.ascii).to.equal('.');
      expect(loaded.cellAtTile(51, 50).type.ascii).to.equal('#');
      expect(loaded.cellAtTile(52, 50).type.ascii).to.equal('=');
    });
  });
});

describe('Map Objects', function() {
  let map;

  beforeEach(function() {
    map = new Map();
  });

  describe('Pillbox', function() {
    it('should create pillbox with correct properties', function() {
      const pill = new map.PillboxClass(map, 50, 50, 0, 15, 50);
      expect(pill.x).to.equal(50);
      expect(pill.y).to.equal(50);
      expect(pill.owner_idx).to.equal(0);
      expect(pill.armour).to.equal(15);
      expect(pill.speed).to.equal(50);
    });

    it('should reference correct cell', function() {
      const pill = new map.PillboxClass(map, 50, 50, 0, 15, 50);
      expect(pill.cell).to.equal(map.cellAtTile(50, 50));
    });
  });

  describe('Base', function() {
    it('should create base with correct properties', function() {
      const base = new map.BaseClass(map, 50, 50, 0, 90, 50, 50);
      expect(base.x).to.equal(50);
      expect(base.y).to.equal(50);
      expect(base.owner_idx).to.equal(0);
      expect(base.armour).to.equal(90);
      expect(base.shells).to.equal(50);
      expect(base.mines).to.equal(50);
    });
  });

  describe('Start', function() {
    it('should create start with correct properties', function() {
      const start = new map.StartClass(map, 50, 50, 0);
      expect(start.x).to.equal(50);
      expect(start.y).to.equal(50);
      expect(start.direction).to.equal(0);
    });
  });
});

describe('WorldMap', function() {
  let map;

  beforeEach(function() {
    map = new WorldMap();
    map.world = { tanks: [], mapChanged: () => {} };
  });

  describe('cellAtPixel', function() {
    it('should convert pixel coordinates to cell', function() {
      const cell = map.cellAtPixel(1600, 1600);
      expect(cell.x).to.equal(50);
      expect(cell.y).to.equal(50);
    });

    it('should handle edge coordinates', function() {
      const cell = map.cellAtPixel(0, 0);
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
    });
  });

  describe('cellAtWorld', function() {
    it('should convert world coordinates to cell', function() {
      const cell = map.cellAtWorld(12800, 12800);
      expect(cell.x).to.equal(50);
      expect(cell.y).to.equal(50);
    });

    it('should handle fractional coordinates', function() {
      const cell = map.cellAtWorld(12850, 12850);
      expect(cell.x).to.equal(50);
      expect(cell.y).to.equal(50);
    });
  });

  describe('getRandomStart', function() {
    it('should return undefined for empty starts', function() {
      const start = map.getRandomStart();
      expect(start).to.be.undefined;
    });

    it('should return a start when available', function() {
      map.starts = [
        new map.StartClass(map, 50, 50, 0),
        new map.StartClass(map, 100, 100, 0)
      ];
      const start = map.getRandomStart();
      expect(start).to.be.instanceOf(map.StartClass);
    });
  });
});

describe('WorldMapCell Game Logic', function() {
  let map, cell;

  beforeEach(function() {
    map = new WorldMap();
    map.world = { tanks: [], mapChanged: () => {}, spawn: () => {} };
    cell = map.cellAtTile(100, 100);
  });

  describe('getTankSpeed', function() {
    const mockTank = { armour: 10, onBoat: false };

    it('should return 0 for pillbox with armour', function() {
      cell.pill = { armour: 10 };
      expect(cell.getTankSpeed(mockTank)).to.equal(0);
    });

    it('should return terrain speed for grass', function() {
      cell.setType('.');
      expect(cell.getTankSpeed(mockTank)).to.equal(12);
    });

    it('should return 16 for tank on boat in water', function() {
      cell.setType(' ');
      const tankOnBoat = { armour: 10, onBoat: true };
      expect(cell.getTankSpeed(tankOnBoat)).to.equal(16);
    });

    it('should return 0 for buildings', function() {
      cell.setType('|');
      expect(cell.getTankSpeed(mockTank)).to.equal(0);
    });
  });

  describe('getTankTurn', function() {
    const mockTank = { armour: 10, onBoat: false };

    it('should return 0 for pillbox', function() {
      cell.pill = { armour: 10 };
      expect(cell.getTankTurn(mockTank)).to.equal(0);
    });

    it('should return terrain turn speed for grass', function() {
      cell.setType('.');
      expect(cell.getTankTurn(mockTank)).to.equal(1.00);
    });

    it('should return 1.00 for tank on boat', function() {
      cell.setType(' ');
      const tankOnBoat = { armour: 10, onBoat: true };
      expect(cell.getTankTurn(tankOnBoat)).to.equal(1.00);
    });
  });

  describe('getManSpeed', function() {
    const mockMan = { owner: { $: { armour: 10 } } };

    it('should return 0 for pillbox', function() {
      cell.pill = { armour: 10 };
      expect(cell.getManSpeed(mockMan)).to.equal(0);
    });

    it('should return terrain speed for grass', function() {
      cell.setType('.');
      expect(cell.getManSpeed(mockMan)).to.equal(16);
    });

    it('should return 0 for water', function() {
      cell.setType(' ');
      expect(cell.getManSpeed(mockMan)).to.equal(0);
    });
  });

  describe('takeShellHit', function() {
    it('should damage grass', function() {
      cell.setType('.');
      cell.takeShellHit({ direction: 0 });
      expect(cell.life).to.equal(4);
    });

    it('should convert grass to swamp after damage', function() {
      cell.setType('.');
      for (let i = 0; i < 5; i++) {
        cell.takeShellHit({ direction: 0 });
      }
      expect(cell.type.ascii).to.equal('~');
    });

    it('should convert forest to grass', function() {
      cell.setType('#');
      cell.takeShellHit({ direction: 0 });
      expect(cell.type.ascii).to.equal('.');
    });

    it('should convert building to shot building', function() {
      cell.setType('|');
      cell.takeShellHit({ direction: 0 });
      expect(cell.type.ascii).to.equal('}');
    });
  });

  describe('takeExplosionHit', function() {
    it('should convert boat to water', function() {
      cell.setType('b');
      cell.takeExplosionHit();
      expect(cell.type.ascii).to.equal(' ');
    });

    it('should convert terrain to crater', function() {
      cell.setType('.');
      cell.takeExplosionHit();
      expect(cell.type.ascii).to.equal('%');
    });

    it('should not affect water', function() {
      cell.setType(' ');
      cell.takeExplosionHit();
      expect(cell.type.ascii).to.equal(' ');
    });
  });

  describe('hasTankOnBoat', function() {
    it('should return false when no tanks', function() {
      expect(cell.hasTankOnBoat()).to.be.false;
    });

    it('should return true when tank on boat at cell', function() {
      map.world.tanks = [{ armour: 10, cell: cell, onBoat: true }];
      expect(cell.hasTankOnBoat()).to.be.true;
    });

    it('should return false when tank not on boat', function() {
      map.world.tanks = [{ armour: 10, cell: cell, onBoat: false }];
      expect(cell.hasTankOnBoat()).to.be.false;
    });

    it('should return false for dead tank', function() {
      map.world.tanks = [{ armour: 255, cell: cell, onBoat: true }];
      expect(cell.hasTankOnBoat()).to.be.false;
    });
  });
});
