# Orona Modernization Progress

## ✅ COMPLETED - Build System Modernized!

### 1. Dependencies Updated ✅
- Node.js requirement: 0.6 → >=18.0.0
- CoffeeScript: 1.x → 2.7.0
- Browserify: 1.10 → 17.0.0
- Connect → Express 4.18.2
- faye-websocket: 0.4 → 0.11.4
- irc-js → irc 0.5.2
- Added coffeeify 3.0.1 for CoffeeScript compilation

### 2. Build System Updated ✅
- Updated Cakefile to use modern browserify callback API
- Added coffeeify transform with custom CoffeeScript 2.x compiler
- Fixed entry point to use proper file path
- Build now produces js/bolo-bundle.js (218KB)

### 3. Git Submodules ✅
- Initialized villain submodule properly

### 4. CoffeeScript 2.x Syntax Compatibility ✅
All syntax issues fixed:

**Fixed bare `super` calls:**
- src/client/world/client.coffee
- src/client/world/local.coffee
- src/world_map.coffee
- src/server/application.coffee
- src/client/renderer/offscreen_2d.coffee
- src/client/renderer/webgl.coffee
- node_modules/villain/world/net/client.coffee
- node_modules/villain/world/net/server.coffee

**Fixed constructor parameter shorthand:**
- src/objects/tank.coffee
- src/objects/shell.coffee
- src/objects/world_base.coffee
- src/objects/world_pillbox.coffee
- src/objects/builder.coffee
- src/server/application.coffee
- src/server/map_index.coffee
- src/client/renderer/base.coffee
- src/client/renderer/offscreen_2d.coffee
- src/client/progress.coffee
- src/map.coffee
- node_modules/villain/world/object.coffee

## ✅ COMPLETED - Modernization Successful!

The Orona project is now fully functional on Node.js 18+!

## Recommended Next Steps

### 1. Update Documentation
- [x] Update README.md with new Node.js requirements (>=18.0.0)
- [x] Document the build process and fix-villain.sh script
- [x] Add troubleshooting section for common issues

### 2. Code Quality Improvements
- [x] Add unit tests for core game logic (critical for future migration)
  - [x] Map/tile logic (MapCell, WorldMapCell)
  - [x] Game objects (Tank, Shell, Builder, WorldPillbox, WorldBase)
  - [x] Helpers (distance, heading, extend)
  - [x] World mixin (tank management, map object spawning)
  - [x] Networking protocol (net message identifiers)
  - [x] Server components (application, command, map_index, irc)
  - [ ] Collision detection (integration-level)
  - [ ] Game state management
- [ ] Fix EventEmitter memory leak (increase max listeners or clean up properly)
- [ ] Replace deprecated `new Buffer()` with `Buffer.from()` throughout codebase
- [ ] Add error handling for missing config.json
- [ ] Update to modern Express middleware patterns

### 3. Dependency Updates (Optional)
- [ ] Replace irc-js with a modern IRC library if matchmaking is needed
- [ ] Update jQuery and jQuery UI to latest versions
- [ ] Consider migrating from CoffeeScript to modern JavaScript/TypeScript

### 4. Testing & Deployment
- [x] Visual integration tests (automated canvas rendering, tiled for parallel comparison)
  - [x] Shell hits (forest, building, grass chain)
  - [x] Explosions (terrain, boat)
  - [x] Road/building/river connections and destruction
  - [x] Forest clearing
  - [ ] Tank shooting pillbox (armour decrease, tile change)
  - [ ] Tank building a wall (builder placement, terrain transition)
  - [ ] Builder repairing structures
  - [ ] Flood fill after water exposed
  - [ ] Tank driving over different terrain (boat, road, grass)
  - [ ] Pillbox capturing and ownership changes
  - [ ] Base resupply interactions
- [x] Live browser visual tests (tiled scenarios animating in real-time for 15s)
- [ ] Interactive browser test scenarios (load and visually inspect game states)
- [ ] Test multiplayer functionality
- [ ] Add npm scripts for common tasks (build, start, dev)
- [ ] Create Docker container for easy deployment
- [ ] Add CI/CD pipeline

### 5. Git & Version Control
- [x] Commit all modernization changes
- [ ] Tag release (e.g., v0.2.0-modernized)
- [x] Update .gitignore for node_modules and build artifacts
- [ ] Consider forking villain submodule with fixes applied

## How to Build and Run

```bash
# 1. Install dependencies
npm install

# 2. Initialize git submodules (REQUIRED - contains villain library)
git submodule update --init --recursive

# 3. Fix villain submodule for CoffeeScript 2.x (REQUIRED after submodule checkout)
bash fix-villain.sh

# 4. Build the client bundle
npx cake build

# 5. Run the server with config file
./bin/bolo-server config.json
```

**First time setup:** If `config.json` doesn't exist, the server will create a sample for you. Edit it and run the command again.

## Server Configuration

Create a `config.json` file in the project root:

```json
{
  "general": {
    "base": "http://localhost:8124",
    "maxgames": 5
  },
  "web": {
    "port": 8124,
    "log": true
  }
}
```

Note: The generated sample includes an `irc` section which can be removed — IRC functionality is disabled.

## Summary

The Orona project has been successfully modernized from Node.js 0.6 (2011) to Node.js 18+ (2024). All CoffeeScript code has been updated to be compatible with CoffeeScript 2.x syntax requirements. The build system now works with modern tooling.

## Build Process Explained

### Overview

The build process compiles CoffeeScript source files into a single JavaScript bundle that runs in the browser.

### Build Steps

1. **npm install** - Installs all dependencies listed in package.json:
   - `coffeescript` - CoffeeScript 2.x compiler
   - `browserify` - Bundles modules for browser use
   - `coffeeify` - Browserify transform for CoffeeScript
   - `express` - Web server framework
   - `faye-websocket` - WebSocket support
   - `irc-js` - IRC client (currently disabled)

2. **git submodule update --init --recursive** - Checks out the Villain game engine:
   - Villain is a git submodule located at `node_modules/villain`
   - Contains core game loop and networking code
   - Required for both client and server

3. **bash fix-villain.sh** - Patches Villain for CoffeeScript 2.x compatibility:
   - Fixes bare `super` calls → `super()`
   - Fixes constructor parameter shorthand
   - Must be run after every `git submodule update`

4. **npx cake build** - Compiles the client bundle:
   - Entry point: `src/client/index.coffee`
   - Uses Browserify with coffeeify transform
   - Compiles all CoffeeScript to JavaScript
   - Bundles all dependencies into single file
   - Output: `js/bolo-bundle.js` (~218KB)
   - Standalone mode exposes `BoloWorld` global variable

### The fix-villain.sh Script

**Purpose:** The Villain submodule was written for CoffeeScript 1.x. CoffeeScript 2.x has stricter syntax rules that require:
- Bare `super` must be `super()`
- Constructor parameter shorthand (`@param`) requires calling `super()` before referencing `this`

**What it does:**
```bash
# Fixes bare super calls in network modules
perl -i -pe 's/^(\s*)super$/\1super()/g' node_modules/villain/world/net/client.coffee
perl -i -pe 's/^(\s*)super$/\1super()/g' node_modules/villain/world/net/server.coffee

# Fixes constructor in base object class
# Changes: constructor: (@world) ->
# To:      constructor: (world) ->
#            super()
#            @world = world
```

**When to run:**
- After initial `git submodule update --init --recursive`
- After any `git submodule update` that updates Villain
- If you see CoffeeScript syntax errors mentioning "super" or "@params"

**Why it's needed:**
- Villain is an external submodule we don't control
- Patching is simpler than forking and maintaining a separate version
- The fixes are minimal and don't change functionality

### Build Output

- **js/bolo-bundle.js** - Client-side JavaScript bundle containing:
  - All game logic (tanks, shells, explosions, etc.)
  - Rendering code (Canvas 2D and WebGL)
  - Networking code (WebSocket client)
  - Map loading and manipulation
  - Input handling
  - Villain game engine

### Troubleshooting Build Issues

**"Cannot find module 'villain/...'"**
- Run: `git submodule update --init --recursive`
- The Villain submodule wasn't checked out

**"unexpected newline" or "Can't use @params" errors**
- Run: `bash fix-villain.sh`
- Villain needs CoffeeScript 2.x compatibility patches

**"require is not defined" in browser**
- Rebuild: `npx cake build`
- The bundle wasn't built with standalone mode

**Build succeeds but bundle is 0 bytes**
- Check for CoffeeScript syntax errors in src/
- Run `npx cake build` and look for error messages

### Troubleshooting Runtime Issues

**Server crashes with "Cannot read properties of undefined"**
- Ensure `bash fix-villain.sh` was run after submodule checkout
- Check that all CoffeeScript files have proper `super()` calls

**"EADDRINUSE" error when starting server**
- Port is already in use
- Change port in config.json or kill existing process: `lsof -ti:8124 | xargs kill`

**Game loads but shows blank screen**
- Check browser console for JavaScript errors
- Ensure js/bolo-bundle.js exists and is not empty
- Try hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

**EventEmitter memory leak warning in browser**
- This is a known issue (see Known Issues section)
- Game still functions correctly
- Can be safely ignored

## Known Issues

- **EventEmitter memory leak warning**: The game shows a warning about too many `finalize` listeners. This is a pre-existing issue in the original codebase where event listeners accumulate during gameplay. The game still functions correctly, but this should be addressed in future updates by properly cleaning up event listeners or increasing the limit with `setMaxListeners()`.
- **IRC support disabled**: The `irc-js` package is incompatible with Node.js 18+. IRC matchmaking functionality has been disabled.

## Testing

### Running Tests

```bash
npm test
```

### Running Tests in Isolation

To run a specific test file:
```bash
npx mocha test/map.test.js
```

To run tests matching a pattern:
```bash
npx mocha test/map.test.js --grep "MapCell"
```

To run a specific test:
```bash
npx mocha test/map.test.js --grep "should initialize with correct coordinates"
```

### Test Coverage

**Map/Tile Logic** (131 unit tests) ✓
- MapCell: constructor, neighbors, type checking, edge detection, numeric types, setType
- WorldMapCell: life tracking, obstacles, pixel/world coordinates, tank/man speed, damage handling
- Map: grid initialization, cell access, iteration, clearing, retiling algorithms
- Map Serialization: BMAP format dump/load, round-trip preservation
- Map Objects: Pillbox, Base, Start creation and properties
- WorldMap: coordinate conversion (pixel/world), random start selection
- Game Logic: shell hits, explosion damage, boat detection

**Game Objects** (173 unit tests) ✓
- Tank: reset, direction, range, allies, tiles, combat, turning, acceleration, shooting
- Builder: states, getTile, performOrder, kill, reached, build actions, update
- Shell: direction, tile, spawn, move, collision detection, asplode, update
- WorldPillbox: constructor, updateOwner/Cell, placeAt, aggravate, takeShellHit, repair, update/targeting
- WorldBase: constructor, updateOwner, takeShellHit, refueling, findSubject

**Server Components** (51 unit tests) ✓
- application: createBoloApp, game slots, game IDs, WebSocket routing, redirector middleware
- command: CLI usage, sample config creation, JSON validation
- map_index: file indexing, fuzzy search, reindex
- irc: CoffeeScript compilation, exports, class structure
- net: server/client message identifiers

**Shared Modules** (36 unit tests) ✓
- helpers: extend, distance, heading
- world_mixin: boloInit, addTank, removeTank, getAllMapObjects, spawnMapObjects, resolveMapObjectOwners

**Visual Integration Tests** (2 tests, 9 scenarios) ✓
- Renders before/after game scenarios as tiled PNG for visual comparison
- Scenarios: shell hits (forest, building, grass chain), explosions (terrain, boat), road/building/river connections, forest adjacency
- Reference image regression: compares output against stored reference screenshots

Tests use Mocha, Chai, and node-canvas. Test files are in `test/` directory.

### Running Visual Tests

```bash
npm run test:visual
```

This generates `test/visual/output/terrain-interactions.png` - a tiled image showing before/after states for each scenario. Open it to visually inspect the results.

To update reference images after intentional changes:
```bash
cp test/visual/output/terrain-interactions.png test/visual/reference/terrain-interactions.png
```

### Live Browser Visual Tests

Run animated scenarios in the browser, tiled in a 3-column grid with before/live panels:
```bash
npm run test:live
```

Then open `test/visual/live/index.html` in your browser. Each scenario plays out over 15 seconds, showing terrain interactions happening in real-time. Scenarios include:
- Shell hits (forest, building, grass damage chain)
- Explosions (terrain to crater, boat to water)
- Building cluster destruction
- Road network destruction
- Forest clearing (row by row)
- River channel formation

To rebuild after code changes:
```bash
node test/visual/live/build.js
```

### Visual Integration Tests (Planned)

Automated tests that render game scenarios to a canvas, tiled so multiple test cases can be compared side-by-side in a single view.

#### Approach

1. **Test harness** renders an HTML page with a grid of small canvases, one per test scenario
2. Each canvas sets up a minimal game state (map, objects, tanks) and simulates an interaction
3. The canvas renders the before/after state side-by-side within each tile
4. Tests run headlessly via Puppeteer/Playwright, capturing screenshots for comparison
5. Reference screenshots are stored in `test/visual/reference/` for regression detection

#### Example tile layout

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Tank shoots     │ Tank builds     │ Shell hits       │
│ pillbox         │ wall            │ forest           │
│ [before][after] │ [before][after] │ [before][after]  │
├─────────────────┼─────────────────┼─────────────────┤
│ Builder repairs │ Flood fill      │ Tank on boat     │
│ structure       │ after explosion │ enters water     │
│ [before][after] │ [before][after] │ [before][after]  │
└─────────────────┴─────────────────┴─────────────────┘
```

#### Planned test scenarios

| Scenario | Setup | Action | Expected visual result |
|---|---|---|---|
| Tank shoots pillbox | Pillbox with armour 15 | Fire shell at pillbox | Armour decreases, tile changes |
| Tank builds wall | Empty grass tile, builder nearby | Builder places wall | Grass → building tile |
| Shell hits forest | Forest tile | Shell impact | Forest → grass |
| Shell hits building | Building tile | Shell impact | Building → shot building |
| Terrain damage chain | Grass tile | 5 shell hits | Grass → swamp → river |
| Builder repairs | Damaged building | Builder repairs | Shot building → building |
| Flood fill | Land surrounded by water | Explosion creates gap | Water floods in |
| Tank on boat | Tank at river edge | Tank enters water | Boat tile appears |
| Pillbox capture | Enemy pillbox, armour 0 | Tank approaches | Ownership changes |
| Base resupply | Friendly base | Tank on base | Shells/mines replenished |

#### File structure

```
test/
  visual/
    harness.html          # Tiled canvas grid
    harness.js            # Test runner, renders scenarios
    scenarios/            # Individual test scenario definitions
      tank-shoots-pillbox.js
      tank-builds-wall.js
      shell-hits-terrain.js
      ...
    reference/            # Reference screenshots for regression
    visual.test.js        # Headless test runner (Puppeteer/Playwright)
```
