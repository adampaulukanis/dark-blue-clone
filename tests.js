'use strict';

suite('Test Level class', function () {
  test('Write a test');
});

suite('Test Vector class. v = new Vector(1, 2)', function () {
  var v = null;
  setup(function () {
    v = new Vector(1, 2);
  });
  test('Has x and y properties', function () {
    assert(v.x === 1);
    assert(v.y === 2);
  });
  test("x and y default to 0's if not provided", function () {
    v = new Vector();
    assert(v.x === 0);
    assert(v.y === 0);
  });
  test('add two vectors', function () {
    v = v.plus(v);
    assert(v.x === 2);
    assert(v.y === 4);
  });
  test('Scales a vector by a given amount', function () {
    v = v.times(5);
    assert(v.x === 5);
    assert(v.y === 10);
  });
});

suite('Test Player class', function () {
  var pos = new Vector(10, 12);
  var p = new Player(pos);
  test('Has pos property');
  test('Has size');
  test('Has speed');
  test('Type is player', function () {
    assert(p.type === 'player');
  });
});

suite('Test Lava class. pos = new Vector(10, 12)', function () {
  var lava = null;
  var pos = new Vector(10, 12);
  suite('Bouncing horizontally lava', function () {
    setup(function () {
      lava = new Lava(pos, '=');
    });
    test('speed property is (2, 0)', function () {
      assert(lava.speed.x === 2);
      assert(lava.speed.y === 0);
    });
    test('pos property is (10, 12)', function () {
      assert(lava.pos.x === pos.x);
      assert(lava.pos.y === pos.y);
    });
    test('size is (1, 1)', function () {
      assert(lava.size.x === 1);
      assert(lava.size.y === 1);
    });
    test('repeatPos is not in use', function () {
      assert(lava.repeatPos === null);
    });
    test('Type is lava', function () {
      assert(lava.type === 'lava');
    });
  });
  suite('Dripping lava', function () {
    setup(function () {
      lava = new Lava(pos, '|');
    });
    test('speed property is (0, 2)', function () {
      assert(lava.speed.x === 0);
      assert(lava.speed.y === 2);
    });
    test('pos property is (10, 12)', function () {
      assert(lava.pos.x === pos.x);
      assert(lava.pos.y === pos.y);
    });
    test('size is (1, 1)', function () {
      assert(lava.size.x === 1);
      assert(lava.size.y === 1);
    });
    test('repeatPos is not in use', function () {
      assert(lava.repeatPos === null);
    });
    test('Type is lava', function () {
      assert(lava.type === 'lava');
    });
  });
  suite('Bouncing vertically lava', function () {
    setup(function () {
      lava = new Lava(pos, 'v');
    });
    test('speed property is (0, 3)', function () {
      assert(lava.speed.x === 0);
      assert(lava.speed.y === 3);
    });
    test('pos property is (10, 12)', function () {
      assert(lava.pos.x === pos.x);
      assert(lava.pos.y === pos.y);
    });
    test('size is (1, 1)', function () {
      assert(lava.size.x === 1);
      assert(lava.size.y === 1);
    });
    test('repeatPos is set to starting position', function () {
      assert(lava.repeatPos === pos);
    });
    test('Type is lava', function () {
      assert(lava.type === 'lava');
    });
  });
});

suite('Test Coin class', function () {});

suite('IT tests');
