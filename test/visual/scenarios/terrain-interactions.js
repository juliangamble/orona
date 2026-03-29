/**
 * Visual test scenario definitions.
 *
 * Each scenario exports { name, setup, action }.
 *   setup(map)          - Sets terrain and objects, returns { cx, cy } center of interest.
 *   action(map, cx, cy) - Performs the game interaction on the map.
 */

require('coffeescript/register');
const { TERRAIN_TYPES } = require('../../../src/map.coffee');

const CENTER = 100; // All scenarios centered around tile 100,100

// Helper: set a block of terrain
function setArea(map, cx, cy, radius, type) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      map.cellAtTile(cx + dx, cy + dy).setType(type);
    }
  }
}

const scenarios = [
  {
    name: 'Shell hits forest → grass',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, '.');
      map.cellAtTile(CENTER, CENTER).setType('#');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      const cell = map.cellAtTile(cx, cy);
      cell.takeShellHit({ direction: 0 });
    }
  },
  {
    name: 'Shell hits building → shot building',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, '.');
      map.cellAtTile(CENTER, CENTER).setType('|');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      map.cellAtTile(cx, cy).takeShellHit({ direction: 0 });
    }
  },
  {
    name: 'Grass damage chain (5 hits → swamp)',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, '.');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      const cell = map.cellAtTile(cx, cy);
      for (let i = 0; i < 5; i++) {
        cell.takeShellHit({ direction: 0 });
      }
    }
  },
  {
    name: 'Explosion converts terrain → crater',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, '.');
      map.cellAtTile(CENTER, CENTER).setType('#');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      map.cellAtTile(cx, cy).takeExplosionHit();
    }
  },
  {
    name: 'Explosion on boat → water',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, ' ');
      map.cellAtTile(CENTER, CENTER).setType('b');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      map.cellAtTile(cx, cy).takeExplosionHit();
    }
  },
  {
    name: 'Road connections (cross)',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, '.');
      map.cellAtTile(CENTER, CENTER).setType('=');
      map.cellAtTile(CENTER - 1, CENTER).setType('=');
      map.cellAtTile(CENTER + 1, CENTER).setType('=');
      map.cellAtTile(CENTER, CENTER - 1).setType('=');
      map.cellAtTile(CENTER, CENTER + 1).setType('=');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      // Shell hits road next to water
      const cell = map.cellAtTile(cx + 1, cy);
      map.cellAtTile(cx + 2, cy).setType(' ');
      cell.takeShellHit({ direction: 0 });
    }
  },
  {
    name: 'Building connections (cluster)',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, '.');
      map.cellAtTile(CENTER, CENTER).setType('|');
      map.cellAtTile(CENTER + 1, CENTER).setType('|');
      map.cellAtTile(CENTER, CENTER + 1).setType('|');
      map.cellAtTile(CENTER + 1, CENTER + 1).setType('|');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      // Shoot one building in the cluster
      map.cellAtTile(cx + 1, cy).takeShellHit({ direction: 0 });
    }
  },
  {
    name: 'River surrounded by land',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, '.');
      map.cellAtTile(CENTER, CENTER).setType(' ');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      // Add more water to form a channel
      map.cellAtTile(cx - 1, cy).setType(' ');
      map.cellAtTile(cx + 1, cy).setType(' ');
    }
  },
  {
    name: 'Forest adjacency patterns',
    setup(map) {
      setArea(map, CENTER, CENTER, 2, '.');
      map.cellAtTile(CENTER, CENTER).setType('#');
      map.cellAtTile(CENTER + 1, CENTER).setType('#');
      map.cellAtTile(CENTER, CENTER + 1).setType('#');
      return { cx: CENTER, cy: CENTER };
    },
    action(map, cx, cy) {
      // Shell one forest, leaving an L-shape
      map.cellAtTile(cx, cy).takeShellHit({ direction: 0 });
    }
  }
];

module.exports = scenarios;
