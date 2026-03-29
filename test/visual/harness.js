/**
 * Visual Integration Test Harness
 *
 * Renders game scenarios as before/after tiles on a single canvas image.
 * Each scenario occupies a tile in a grid, showing the state before and
 * after an interaction. The output is saved as a PNG for visual inspection
 * and regression comparison.
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Tile constants matching src/constants.coffee
const TILE_SIZE = 32;

// Layout constants for the output image
const SCENARIO_PADDING = 4;
const LABEL_HEIGHT = 16;
const CELL_RENDER_SIZE = TILE_SIZE; // Each map cell rendered at tile size
const VIEW_CELLS = 5; // 5x5 cell view per before/after panel
const PANEL_SIZE = VIEW_CELLS * CELL_RENDER_SIZE;
const SCENARIO_WIDTH = PANEL_SIZE * 2 + SCENARIO_PADDING * 3;
const SCENARIO_HEIGHT = PANEL_SIZE + SCENARIO_PADDING * 2 + LABEL_HEIGHT;

class VisualTestHarness {
  constructor(options = {}) {
    this.columns = options.columns || 3;
    this.scenarios = [];
    this.tilemap = null;
  }

  async loadTilemap() {
    const tilemapPath = path.join(__dirname, '../../images/base.png');
    this.tilemap = await loadImage(tilemapPath);
  }

  /**
   * Draw a single tile from the tilemap onto a canvas context.
   * tx, ty are tile indices in the tilemap (not pixel coordinates).
   */
  drawTile(ctx, tx, ty, dx, dy) {
    ctx.drawImage(
      this.tilemap,
      tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
      dx, dy, TILE_SIZE, TILE_SIZE
    );
  }

  /**
   * Render a 5x5 cell grid from a map centered on (cx, cy).
   * Uses the retile data stored on each cell to draw the correct tile.
   */
  renderMapView(ctx, map, cx, cy, offsetX, offsetY) {
    const half = Math.floor(VIEW_CELLS / 2);
    for (let dy = 0; dy < VIEW_CELLS; dy++) {
      for (let dx = 0; dx < VIEW_CELLS; dx++) {
        const cell = map.cellAtTile(cx - half + dx, cy - half + dy);
        const tile = cell._visualTile;
        if (tile) {
          this.drawTile(ctx, tile.tx, tile.ty, offsetX + dx * CELL_RENDER_SIZE, offsetY + dy * CELL_RENDER_SIZE);
        } else {
          // Deep sea fallback
          this.drawTile(ctx, 0, 0, offsetX + dx * CELL_RENDER_SIZE, offsetY + dy * CELL_RENDER_SIZE);
        }
      }
    }
  }

  /**
   * Register a test scenario.
   * @param {string} name - Scenario label
   * @param {Function} setupFn - Function(map) that sets up initial state, returns {cx, cy} center
   * @param {Function} actionFn - Function(map) that performs the interaction
   */
  addScenario(name, setupFn, actionFn) {
    this.scenarios.push({ name, setupFn, actionFn });
  }

  /**
   * Run all scenarios and render to a single tiled PNG.
   */
  async render(outputPath) {
    if (!this.tilemap) await this.loadTilemap();

    const rows = Math.ceil(this.scenarios.length / this.columns);
    const totalWidth = this.columns * SCENARIO_WIDTH;
    const totalHeight = rows * SCENARIO_HEIGHT;

    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    for (let i = 0; i < this.scenarios.length; i++) {
      const scenario = this.scenarios[i];
      const col = i % this.columns;
      const row = Math.floor(i / this.columns);
      const baseX = col * SCENARIO_WIDTH;
      const baseY = row * SCENARIO_HEIGHT;

      await this.renderScenario(ctx, scenario, baseX, baseY);
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  async renderScenario(ctx, scenario, baseX, baseY) {
    const WorldMap = require('../../src/world_map.coffee');

    // --- BEFORE state ---
    const beforeMap = new WorldMap();
    beforeMap.world = { tanks: [], mapChanged: () => {}, spawn: () => {} };
    // Hook into retile to capture tile data
    this.hookRetile(beforeMap);
    const { cx, cy } = scenario.setupFn(beforeMap);
    beforeMap.retile(cx - 3, cy - 3, cx + 3, cy + 3);

    // --- AFTER state ---
    const afterMap = new WorldMap();
    afterMap.world = { tanks: [], mapChanged: () => {}, spawn: () => {} };
    this.hookRetile(afterMap);
    scenario.setupFn(afterMap);
    afterMap.retile(cx - 3, cy - 3, cx + 3, cy + 3);
    scenario.actionFn(afterMap, cx, cy);
    afterMap.retile(cx - 3, cy - 3, cx + 3, cy + 3);

    // --- Draw label ---
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(scenario.name, baseX + SCENARIO_PADDING, baseY + LABEL_HEIGHT - 3);

    // Sub-labels
    ctx.fillStyle = '#888888';
    ctx.font = '9px sans-serif';
    ctx.fillText('BEFORE', baseX + SCENARIO_PADDING + PANEL_SIZE / 2 - 18, baseY + LABEL_HEIGHT + 10);
    ctx.fillText('AFTER', baseX + SCENARIO_PADDING * 2 + PANEL_SIZE + PANEL_SIZE / 2 - 14, baseY + LABEL_HEIGHT + 10);

    // --- Draw border ---
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(baseX + 1, baseY + 1, SCENARIO_WIDTH - 2, SCENARIO_HEIGHT - 2);

    // --- Render before panel ---
    const beforeX = baseX + SCENARIO_PADDING;
    const beforeY = baseY + LABEL_HEIGHT + SCENARIO_PADDING;
    this.renderMapView(ctx, beforeMap, cx, cy, beforeX, beforeY);

    // --- Render after panel ---
    const afterX = baseX + SCENARIO_PADDING * 2 + PANEL_SIZE;
    const afterY = baseY + LABEL_HEIGHT + SCENARIO_PADDING;
    this.renderMapView(ctx, afterMap, cx, cy, afterX, afterY);
  }

  /**
   * Hook into the map's retile system to capture tile coordinates
   * for each cell, so we can render them without a full browser renderer.
   */
  hookRetile(map) {
    map.view = {
      onRetile: (cell, tx, ty) => {
        cell._visualTile = { tx, ty };
      }
    };
  }
}

module.exports = VisualTestHarness;
