// Entry point for the visual test browser bundle.
// Exposes just the map modules needed for visual testing.
exports.WorldMap = require('../../../src/world_map.coffee');
exports.Map = require('../../../src/map.coffee').Map;
exports.TERRAIN_TYPES = require('../../../src/map.coffee').TERRAIN_TYPES;
