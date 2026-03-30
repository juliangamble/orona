require('coffeescript/register');
const { expect } = require('chai');

const net = require('../src/net.coffee');

describe('net', function () {
  describe('server message identifiers', function () {
    it('should define SYNC_MESSAGE as charCode of "s"', function () {
      expect(net.SYNC_MESSAGE).to.equal('s'.charCodeAt(0));
    });

    it('should define WELCOME_MESSAGE as charCode of "W"', function () {
      expect(net.WELCOME_MESSAGE).to.equal('W'.charCodeAt(0));
    });

    it('should define CREATE_MESSAGE as charCode of "C"', function () {
      expect(net.CREATE_MESSAGE).to.equal('C'.charCodeAt(0));
    });

    it('should define DESTROY_MESSAGE as charCode of "D"', function () {
      expect(net.DESTROY_MESSAGE).to.equal('D'.charCodeAt(0));
    });

    it('should define MAPCHANGE_MESSAGE as charCode of "M"', function () {
      expect(net.MAPCHANGE_MESSAGE).to.equal('M'.charCodeAt(0));
    });

    it('should define UPDATE_MESSAGE as charCode of "U"', function () {
      expect(net.UPDATE_MESSAGE).to.equal('U'.charCodeAt(0));
    });

    it('should define TINY_UPDATE_MESSAGE as charCode of "u"', function () {
      expect(net.TINY_UPDATE_MESSAGE).to.equal('u'.charCodeAt(0));
    });

    it('should define SOUNDEFFECT_MESSAGE as charCode of "S"', function () {
      expect(net.SOUNDEFFECT_MESSAGE).to.equal('S'.charCodeAt(0));
    });

    it('should have unique server message identifiers', function () {
      const ids = [
        net.SYNC_MESSAGE, net.WELCOME_MESSAGE, net.CREATE_MESSAGE,
        net.DESTROY_MESSAGE, net.MAPCHANGE_MESSAGE, net.UPDATE_MESSAGE,
        net.TINY_UPDATE_MESSAGE, net.SOUNDEFFECT_MESSAGE
      ];
      expect(new Set(ids).size).to.equal(ids.length);
    });
  });

  describe('client message identifiers', function () {
    it('should define turning commands', function () {
      expect(net.START_TURNING_CCW).to.equal('L');
      expect(net.STOP_TURNING_CCW).to.equal('l');
      expect(net.START_TURNING_CW).to.equal('R');
      expect(net.STOP_TURNING_CW).to.equal('r');
    });

    it('should define movement commands', function () {
      expect(net.START_ACCELERATING).to.equal('A');
      expect(net.STOP_ACCELERATING).to.equal('a');
      expect(net.START_BRAKING).to.equal('B');
      expect(net.STOP_BRAKING).to.equal('b');
    });

    it('should define shooting commands', function () {
      expect(net.START_SHOOTING).to.equal('S');
      expect(net.STOP_SHOOTING).to.equal('s');
    });

    it('should define range commands', function () {
      expect(net.INC_RANGE).to.equal('I');
      expect(net.DEC_RANGE).to.equal('D');
    });

    it('should define BUILD_ORDER', function () {
      expect(net.BUILD_ORDER).to.equal('O');
    });

    it('should use single ASCII characters for all client commands', function () {
      const cmds = [
        net.START_TURNING_CCW, net.STOP_TURNING_CCW,
        net.START_TURNING_CW, net.STOP_TURNING_CW,
        net.START_ACCELERATING, net.STOP_ACCELERATING,
        net.START_BRAKING, net.STOP_BRAKING,
        net.START_SHOOTING, net.STOP_SHOOTING,
        net.INC_RANGE, net.DEC_RANGE, net.BUILD_ORDER
      ];
      for (const cmd of cmds) {
        expect(cmd).to.be.a('string').with.lengthOf(1);
      }
    });
  });
});
