require('coffeescript/register');
const { expect } = require('chai');

const createBoloApp = require('../src/server/application.coffee');

function makeApp() {
  const app = createBoloApp({
    general: { base: 'http://localhost:9999', maxgames: 2 },
    web: { port: 9999 }
  });
  // Neuter resetDemo to prevent async map loading from starting real games/loops
  app.resetDemo = function (cb) { cb && cb(); };
  app.loop.stop();
  return app;
}

describe('application', function () {
  describe('createBoloApp', function () {
    it('should be a function', function () {
      expect(createBoloApp).to.be.a('function');
    });

    it('should return an Application instance', function () {
      const app = makeApp();
      expect(app).to.have.property('games');
      expect(app).to.have.property('options');
      expect(app).to.have.property('connectServer');
      expect(app).to.have.property('loop');
    });
  });

  describe('Application', function () {
    let app;

    beforeEach(function () {
      app = makeApp();
    });

    afterEach(function () {
      app.loop.stop();
    });

    describe('haveOpenSlots', function () {
      it('should return true when no games exist', function () {
        expect(app.haveOpenSlots()).to.be.true;
      });

      it('should return false when at maxgames', function () {
        app.games['a'.repeat(20)] = { tick() {} };
        app.games['b'.repeat(20)] = { tick() {} };
        expect(app.haveOpenSlots()).to.be.false;
      });
    });

    describe('createGameId', function () {
      it('should return a 20-character lowercase string', function () {
        const gid = app.createGameId();
        expect(gid).to.have.lengthOf(20);
        expect(gid).to.match(/^[a-z]{20}$/);
      });

      it('should return unique ids', function () {
        const ids = new Set();
        for (let i = 0; i < 50; i++) {
          ids.add(app.createGameId());
        }
        expect(ids.size).to.equal(50);
      });

      it('should avoid collisions with existing game ids', function () {
        const existing = app.createGameId();
        app.games[existing] = { tick() {} };
        const next = app.createGameId();
        expect(next).to.not.equal(existing);
      });
    });

    describe('getSocketPathHandler', function () {
      it('should return false for /lobby', function () {
        expect(app.getSocketPathHandler('/lobby')).to.be.false;
      });

      it('should return false for unknown match id', function () {
        expect(app.getSocketPathHandler('/match/' + 'a'.repeat(20))).to.be.false;
      });

      it('should return a handler for a known match id', function () {
        const gid = 'a'.repeat(20);
        app.games[gid] = { onConnect() {}, tick() {} };
        const handler = app.getSocketPathHandler('/match/' + gid);
        expect(handler).to.be.a('function');
      });

      it('should return false for invalid match path format', function () {
        expect(app.getSocketPathHandler('/match/short')).to.be.false;
        expect(app.getSocketPathHandler('/match/' + '1'.repeat(20))).to.be.false;
      });

      it('should return handler for /demo when demo exists', function () {
        app.demo = { onConnect() {}, close() {} };
        const handler = app.getSocketPathHandler('/demo');
        expect(handler).to.be.a('function');
      });

      it('should return false for /demo when no demo', function () {
        app.demo = null;
        expect(app.getSocketPathHandler('/demo')).to.be.false;
      });

      it('should return false for unknown paths', function () {
        expect(app.getSocketPathHandler('/unknown')).to.be.false;
      });
    });

    describe('registerIrcClient', function () {
      it('should add client to ircClients array', function () {
        const fakeClient = { shutdown() {} };
        app.registerIrcClient(fakeClient);
        expect(app.ircClients).to.include(fakeClient);
      });
    });

    describe('tick', function () {
      it('should call tick on all games', function () {
        let tickCount = 0;
        const gid = 'a'.repeat(20);
        app.games[gid] = { tick() { tickCount++; } };
        app.tick();
        expect(tickCount).to.equal(1);
      });
    });
  });

  describe('redirector middleware', function () {
    let app;

    beforeEach(function () {
      app = makeApp();
    });

    afterEach(function () {
      app.loop.stop();
    });

    it('should redirect /match/<id> to base URL with query param', function (done) {
      const matchId = 'a'.repeat(20);
      const http = require('http');
      const res = new http.ServerResponse({ method: 'GET' });
      res.writeHead = function (code, headers) {
        expect(code).to.equal(301);
        expect(headers.Location).to.equal(`http://localhost:9999/?${matchId}`);
      };
      res.end = function () { done(); };
      app.connectServer(
        { method: 'GET', url: `/match/${matchId}`, headers: {} },
        res
      );
    });

    it('should pass through non-match URLs', function (done) {
      app.connectServer.handle(
        { method: 'GET', url: '/something-else', headers: {} },
        { writeHead() {}, end() {} },
        function () { done(); }
      );
    });
  });
});
