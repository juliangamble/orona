require('coffeescript/register');
const { expect } = require('chai');
const { Map, TERRAIN_TYPES } = require('../src/map.coffee');
const WorldMap = require('../src/world_map.coffee');

describe('MapCell', function() {
  let map, cell;

  beforeEach(function() {
    map = new Map();
    cell = map.cellAtTile(50, 50);
  });

  describe('constructor', function() {
    it('should initialize with correct coordinates', function() {
      expect(cell.x).to.equal(50);
      expect(cell.y).to.equal(50);
    });

    it('should initialize with deep sea type', function() {
      expect(cell.type.ascii).to.equal('^');
    });

    it('should calculate correct index', function() {
      expect(cell.idx).to.equal(50 * 256 + 50);
    });

    it('should mark edge cells as mined', function() {
      const edgeCell = map.cellAtTile(10, 10);
      expect(edgeCell.mine).to.be.true;
    });

    it('should not mark center cells as mined', function() {
      expect(cell.mine).to.be.false;
    });
  });

  describe('neigh', function() {
    it('should return neighboring cell', function() {
      const neighbor = cell.neigh(1, 0);
      expect(neighbor.x).to.equal(51);
      expect(neighbor.y).to.equal(50);
    });

    it('should return dummy cell for off-map coordinates', function() {
      const neighbor = cell.neigh(-100, -100);
      expect(neighbor.type.ascii).to.equal('^');
    });
  });

  describe('isType', function() {
    beforeEach(function() {
      cell.setType('.');
    });

    it('should return true for matching type object', function() {
      expect(cell.isType(TERRAIN_TYPES['.'])).to.be.true;
    });

    it('should return true for matching ascii character', function() {
      expect(cell.isType('.')).to.be.true;
    });

    it('should return false for non-matching type', function() {
      expect(cell.isType('#')).to.be.false;
    });

    it('should handle multiple types', function() {
      expect(cell.isType('.', '#', '=')).to.be.true;
      expect(cell.isType('#', '=', '|')).to.be.false;
    });

    it('should return false for undefined type', function() {
      cell.type = undefined;
      expect(cell.isType('.')).to.be.false;
    });
  });

  describe('isEdgeCell', function() {
    it('should return true for left edge', function() {
      expect(map.cellAtTile(10, 100).isEdgeCell()).to.be.true;
    });

    it('should return true for right edge', function() {
      expect(map.cellAtTile(240, 100).isEdgeCell()).to.be.true;
    });

    it('should return true for top edge', function() {
      expect(map.cellAtTile(100, 10).isEdgeCell()).to.be.true;
    });

    it('should return true for bottom edge', function() {
      expect(map.cellAtTile(100, 240).isEdgeCell()).to.be.true;
    });

    it('should return false for center cells', function() {
      expect(map.cellAtTile(128, 128).isEdgeCell()).to.be.false;
    });
  });

  describe('getNumericType', function() {
    it('should return -1 for deep sea', function() {
      cell.setType('^');
      expect(cell.getNumericType()).to.equal(-1);
    });

    it('should return correct index for terrain types', function() {
      cell.setType('.');
      expect(cell.getNumericType()).to.equal(7);
    });

    it('should add 8 for mined cells', function() {
      cell.setType('.', true);
      expect(cell.getNumericType()).to.equal(15);
    });
  });

  describe('setType', function() {
    it('should set type by ascii character', function() {
      cell.setType('.');
      expect(cell.type.ascii).to.equal('.');
    });

    it('should set type by numeric value', function() {
      cell.setType(7);
      expect(cell.type.ascii).to.equal('.');
    });

    it('should set mine flag', function() {
      cell.setType('.', true);
      expect(cell.mine).to.be.true;
    });

    it('should handle numeric type with mine (>= 10)', function() {
      cell.setType(15);
      expect(cell.type.ascii).to.equal('.');
      expect(cell.mine).to.be.true;
    });

    it('should throw error for invalid string type', function() {
      expect(() => cell.setType('invalid')).to.throw('Invalid terrain type');
    });

    it('should throw error for invalid numeric type', function() {
      expect(() => cell.setType(99)).to.throw('Invalid terrain type');
    });

    it('should force mine on edge cells', function() {
      const edgeCell = map.cellAtTile(10, 10);
      edgeCell.setType('.', false);
      expect(edgeCell.mine).to.be.true;
    });
  });
});

describe('WorldMapCell', function() {
  let map, cell;

  beforeEach(function() {
    map = new WorldMap();
    map.world = { tanks: [], mapChanged: () => {} };
    cell = map.cellAtTile(50, 50);
  });

  describe('constructor', function() {
    it('should initialize life to 0', function() {
      expect(cell.life).to.equal(0);
    });

    it('should inherit from MapCell', function() {
      expect(cell.x).to.equal(50);
      expect(cell.y).to.equal(50);
    });
  });

  describe('isObstacle', function() {
    it('should return true for buildings', function() {
      cell.setType('|');
      expect(cell.isObstacle()).to.be.true;
    });

    it('should return false for grass', function() {
      cell.setType('.');
      expect(cell.isObstacle()).to.be.false;
    });

    it('should return true for pillbox with armour', function() {
      cell.pill = { armour: 10 };
      expect(cell.isObstacle()).to.be.true;
    });

    it('should return false for destroyed pillbox', function() {
      cell.pill = { armour: 0 };
      cell.setType('.');
      expect(cell.isObstacle()).to.be.false;
    });
  });

  describe('setType', function() {
    it('should set life to 5 for grass', function() {
      cell.setType('.');
      expect(cell.life).to.equal(5);
    });

    it('should set life to 5 for shot building', function() {
      cell.setType('}');
      expect(cell.life).to.equal(5);
    });

    it('should set life to 5 for rubble', function() {
      cell.setType(':');
      expect(cell.life).to.equal(5);
    });

    it('should set life to 4 for swamp', function() {
      cell.setType('~');
      expect(cell.life).to.equal(4);
    });

    it('should set life to 0 for other terrain', function() {
      cell.setType('#');
      expect(cell.life).to.equal(0);
    });
  });

  describe('getPixelCoordinates', function() {
    it('should return center pixel coordinates', function() {
      const [x, y] = cell.getPixelCoordinates();
      expect(x).to.equal((50 + 0.5) * 32);
      expect(y).to.equal((50 + 0.5) * 32);
    });
  });

  describe('getWorldCoordinates', function() {
    it('should return center world coordinates', function() {
      const [x, y] = cell.getWorldCoordinates();
      expect(x).to.equal((50 + 0.5) * 256);
      expect(y).to.equal((50 + 0.5) * 256);
    });
  });
});

describe('Map', function() {
  let map;

  beforeEach(function() {
    map = new Map();
  });

  describe('constructor', function() {
    it('should create 256x256 grid', function() {
      expect(map.cells.length).to.equal(256);
      expect(map.cells[0].length).to.equal(256);
    });

    it('should initialize empty object arrays', function() {
      expect(map.pills).to.be.an('array').that.is.empty;
      expect(map.bases).to.be.an('array').that.is.empty;
      expect(map.starts).to.be.an('array').that.is.empty;
    });
  });

  describe('cellAtTile', function() {
    it('should return cell at valid coordinates', function() {
      const cell = map.cellAtTile(100, 100);
      expect(cell.x).to.equal(100);
      expect(cell.y).to.equal(100);
    });

    it('should return dummy cell for negative coordinates', function() {
      const cell = map.cellAtTile(-1, -1);
      expect(cell.type.ascii).to.equal('^');
    });

    it('should return dummy cell for out of bounds coordinates', function() {
      const cell = map.cellAtTile(300, 300);
      expect(cell.type.ascii).to.equal('^');
    });
  });

  describe('each', function() {
    it('should iterate over all cells by default', function() {
      let count = 0;
      map.each(() => count++);
      expect(count).to.equal(256 * 256);
    });

    it('should iterate over specified area', function() {
      let count = 0;
      map.each(() => count++, 0, 0, 9, 9);
      expect(count).to.equal(10 * 10);
    });
  });

  describe('clear', function() {
    it('should set all cells to deep sea', function() {
      map.cellAtTile(50, 50).setType('.');
      map.clear();
      expect(map.cellAtTile(50, 50).type.ascii).to.equal('^');
    });

    it('should clear specified area only', function() {
      map.cellAtTile(50, 50).setType('.');
      map.cellAtTile(100, 100).setType('.');
      map.clear(40, 40, 60, 60);
      expect(map.cellAtTile(50, 50).type.ascii).to.equal('^');
      expect(map.cellAtTile(100, 100).type.ascii).to.equal('.');
    });
  });
});
