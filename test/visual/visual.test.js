/**
 * Visual Integration Tests
 *
 * Renders game scenarios to a tiled PNG image for visual inspection
 * and regression comparison. Run with: npx mocha test/visual/visual.test.js
 */

require('coffeescript/register');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const VisualTestHarness = require('./harness');

const OUTPUT_DIR = path.join(__dirname, 'output');
const REFERENCE_DIR = path.join(__dirname, 'reference');

describe('Visual Integration Tests', function() {
  this.timeout(30000); // Canvas rendering can be slow

  let harness;

  before(async function() {
    harness = new VisualTestHarness({ columns: 3 });
    await harness.loadTilemap();
  });

  describe('Terrain Interactions', function() {
    const scenarios = require('./scenarios/terrain-interactions');

    it('should render all terrain interaction scenarios', async function() {
      for (const scenario of scenarios) {
        harness.addScenario(scenario.name, scenario.setup, scenario.action);
      }

      const outputPath = path.join(OUTPUT_DIR, 'terrain-interactions.png');
      await harness.render(outputPath);

      expect(fs.existsSync(outputPath)).to.be.true;
      const stats = fs.statSync(outputPath);
      expect(stats.size).to.be.greaterThan(0);
    });

    it('should match reference image if one exists', function() {
      const outputPath = path.join(OUTPUT_DIR, 'terrain-interactions.png');
      const referencePath = path.join(REFERENCE_DIR, 'terrain-interactions.png');

      if (!fs.existsSync(referencePath)) {
        this.skip(); // No reference yet, skip comparison
        return;
      }

      const output = fs.readFileSync(outputPath);
      const reference = fs.readFileSync(referencePath);
      expect(output.equals(reference)).to.be.true;
    });
  });
});
