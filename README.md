# Bolo

Bolo is a top-down game of tank warfare originally written by Stuart Cheshire for the BBC Micro and
Apple Macintosh, and also notably rewritten for Windows and Linux by John Morrison.

 * [The Bolo homepage][Bolo]
 * [The WinBolo homepage][WinBolo]
 * [The WinBolo project at Google Code][WinBolo project]

## Orona

Orona is another rewrite of Bolo, intended to be played in any modern browser. Orona is developed
in [CoffeeScript], and relies on some of the newer technologies made possible by HTML5.

The name comes from an uninhabited island situated in the central Pacific Ocean.

## Playing Orona

Orona is alpha quality, but still very playable. Take a look at [GitHub Pages] to see a single
player game in action, which should work on most modern browsers.

If you're seeing odd things in your browser, take a look at the [browser compatibility] wiki page,
and feel free to extend it with your experiences. [Issue] reports are also welcome.

## Running an Orona server

**Requirements:**
- [Node.js] 18.0 or higher
- [git]

### Quick Start

```bash
git clone https://github.com/stephank/orona.git
cd orona
git submodule update --init --recursive
npm install
bash fix-villain.sh
npx cake build
./bin/bolo-server config.json
```

### Detailed Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/stephank/orona.git
   cd orona
   ```

2. **Initialize submodules** (contains the Villain game engine):
   ```bash
   git submodule update --init --recursive
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Fix Villain submodule** for CoffeeScript 2.x compatibility:
   ```bash
   bash fix-villain.sh
   ```

5. **Build the client bundle:**
   ```bash
   npx cake build
   ```

6. **Create configuration file:**
   
   On first run, the server will create a sample `config.json`:
   ```bash
   ./bin/bolo-server config.json
   ```
   
   Edit the generated `config.json` to customize settings:
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
   
   Note: The generated sample also includes an `irc` section which can be removed — IRC functionality is disabled.

7. **Start the server:**
   ```bash
   ./bin/bolo-server config.json
   ```

8. **Play the game:**
   
   Open your browser to `http://localhost:8124/`

### Notes

- IRC functionality has been disabled due to incompatibility with modern Node.js
- The game runs in single-player mode by default
- See [MODERNIZATION.md](MODERNIZATION.md) for details on the Node.js 18+ upgrade

### Troubleshooting

**Build fails with "Cannot find module 'villain'"**
```bash
git submodule update --init --recursive
```

**Build fails with CoffeeScript syntax errors**
```bash
bash fix-villain.sh
npx cake build
```

**Browser shows "require is not defined"**
```bash
npx cake build  # Rebuild the bundle
```

**Server won't start**
- Ensure you're using Node.js 18 or higher: `node --version`
- Check that config.json exists and is valid JSON

### Debugging

**Test individual CoffeeScript file compilation**

To debug syntax errors in specific files, compile them individually:
```bash
npx coffee -c src/path/to/file.coffee
```

To test all files in a directory:
```bash
find src -name '*.coffee' -exec npx coffee -c {} \;
```

This helps identify which specific file has syntax errors before running the full build.

For detailed build process documentation, see [MODERNIZATION.md](MODERNIZATION.md).

## Testing

Run the unit test suite:
```bash
npm test
```

Run a specific test file:
```bash
npx mocha test/map.test.js
```

Run tests matching a pattern:
```bash
npx mocha test/map.test.js --grep "MapCell"
```

The project includes unit tests for core game logic (Map/tile logic with 101 tests) and visual integration tests (9 scenarios rendered as tiled before/after PNG). Tests use Mocha, Chai, and node-canvas.

## Visual Integration Tests

Render game interaction scenarios as a tiled before/after image:
```bash
npm run test:visual
```

Output is saved to `test/visual/output/terrain-interactions.png` for visual inspection. See [MODERNIZATION.md](MODERNIZATION.md) for details.

## Live Browser Visual Tests

Watch game scenarios animate in real-time in a tiled browser view:
```bash
npm run test:live
```
Then open `test/visual/live/index.html` in your browser. See [MODERNIZATION.md](MODERNIZATION.md) for details.

## License

The source code of Orona is distributed with the GNU GPL version 2, as inherited from WinBolo.
Much of the game logic was written with WinBolo as a reference, thus becoming a derived work of it.
Though the GNU GPL version 2 is a fine license either way. You can find a copy of the license
in the COPYING file.

Some files, or parts of files, are subject to other licenses, where indicated in the files
themselves. A short overview of those parts follows.

All the graphic and sound files are from:

 * [Bolo], © 1993 Stuart Cheshire.

For the browser client, Orona also bundles:

 * [jQuery], © 2010 John Resig, licensed MIT and GPLv2.
 * [Sizzle], © 2010 The Dojo Foundation, licensed MIT, BSD and GPL.
 * [jQuery UI], © 2010 The jQuery UI Team, licensed MIT and GPLv2.
 * [jQuery Cookie plugin], © 2006 Klaus Hartl, licensed MIT and GPLv2.
 * Components that are part of [Villain].

 [Bolo]: http://www.bolo.net/
 [WinBolo]: http://www.winbolo.com/
 [WinBolo project]: http://code.google.com/p/winbolo/
 [CoffeeScript]: http://jashkenas.github.com/coffee-script/
 [GitHub Pages]: http://stephank.github.com/orona/
 [browser compatibility]: http://github.com/stephank/orona/wiki/Browser-compatibility
 [Issue]: http://github.com/stephank/orona/issues
 [Node.js]: http://nodejs.org/
 [git]: http://git-scm.com/
 [jQuery]: http://jquery.com/
 [Sizzle]: http://sizzlejs.com/
 [jQuery UI]: http://jqueryui.com/
 [jQuery Cookie plugin]: http://plugins.jquery.com/project/Cookie
 [Villain]: http://github.com/stephank/villain
