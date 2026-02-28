# Orona Project Context

Orona is a browser-based rewrite of Bolo, a top-down tank warfare game originally by Stuart Cheshire, inherited from the WinBolo project by John Morrison.

## Technology Stack
- **Language**: CoffeeScript 2.7.0
- **Runtime**: Node.js 18+
- **Client**: HTML5 browser technologies
- **Build**: Cake build system with Browserify 17.0.0
- **Server**: Express 4.18.2

## Project Structure
- Browser client with bundled jQuery, jQuery UI, Sizzle, jQuery Cookie plugin, and Villain components
- Server component (bolo-server) with WebSocket support
- Graphics and sound assets from original Bolo (© 1993 Stuart Cheshire)
- Villain game engine (git submodule) - requires fix-villain.sh patch for CoffeeScript 2.x

## Modernization Status
- ✅ Upgraded from Node.js 0.6 to 18+
- ✅ Upgraded from CoffeeScript 1.x to 2.7.0
- ✅ Migrated from Connect to Express
- ⚠️ IRC matchmaking disabled (incompatible with Node.js 18+)

## License
GNU GPL version 2 (inherited from WinBolo). Game logic derived from WinBolo reference implementation.
