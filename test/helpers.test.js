require('coffeescript/register');
const { expect } = require('chai');
const { extend, distance, heading } = require('../src/helpers.coffee');

describe('helpers', function () {
  describe('extend', function () {
    it('should copy properties to target', function () {
      const target = { a: 1 };
      extend(target, { b: 2, c: 3 });
      expect(target.b).to.equal(2);
      expect(target.c).to.equal(3);
    });

    it('should overwrite existing properties', function () {
      const target = { a: 1 };
      extend(target, { a: 99 });
      expect(target.a).to.equal(99);
    });

    it('should return the target object', function () {
      const target = {};
      const result = extend(target, { x: 1 });
      expect(result).to.equal(target);
    });

    it('should handle empty properties', function () {
      const target = { a: 1 };
      extend(target, {});
      expect(target).to.deep.equal({ a: 1 });
    });

    it('should be a shallow copy', function () {
      const inner = { nested: true };
      const target = {};
      extend(target, { obj: inner });
      expect(target.obj).to.equal(inner);
    });
  });

  describe('distance', function () {
    it('should return 0 for same point', function () {
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).to.equal(0);
    });

    it('should calculate horizontal distance', function () {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 0 })).to.equal(3);
    });

    it('should calculate vertical distance', function () {
      expect(distance({ x: 0, y: 0 }, { x: 0, y: 4 })).to.equal(4);
    });

    it('should calculate diagonal distance (3-4-5 triangle)', function () {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).to.equal(5);
    });

    it('should be commutative', function () {
      const a = { x: 10, y: 20 };
      const b = { x: 30, y: 40 };
      expect(distance(a, b)).to.equal(distance(b, a));
    });

    it('should handle negative coordinates', function () {
      expect(distance({ x: -3, y: 0 }, { x: 0, y: 4 })).to.equal(5);
    });
  });

  describe('heading', function () {
    it('should return 0 for due east', function () {
      expect(heading({ x: 0, y: 0 }, { x: 10, y: 0 })).to.equal(0);
    });

    it('should return PI/2 for due south', function () {
      expect(heading({ x: 0, y: 0 }, { x: 0, y: 10 })).to.be.closeTo(Math.PI / 2, 0.001);
    });

    it('should return PI for due west', function () {
      expect(heading({ x: 0, y: 0 }, { x: -10, y: 0 })).to.be.closeTo(Math.PI, 0.001);
    });

    it('should return -PI/2 for due north', function () {
      expect(heading({ x: 0, y: 0 }, { x: 0, y: -10 })).to.be.closeTo(-Math.PI / 2, 0.001);
    });

    it('should return PI/4 for 45 degrees', function () {
      expect(heading({ x: 0, y: 0 }, { x: 10, y: 10 })).to.be.closeTo(Math.PI / 4, 0.001);
    });

    it('should work with non-origin points', function () {
      const h1 = heading({ x: 0, y: 0 }, { x: 5, y: 5 });
      const h2 = heading({ x: 100, y: 100 }, { x: 105, y: 105 });
      expect(h1).to.be.closeTo(h2, 0.001);
    });
  });
});
