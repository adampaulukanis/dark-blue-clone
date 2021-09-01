'use strict';

suite('Test Level class', function () {
  var testPlan = null;
  var testLevel = null;
  test('No player at all, should return an error', function () {
    testPlan = [' '];
    try {
      testLevel = new Level(testPlan);
    } catch (err) {
      assert(err);
    }
  });
  test('Two players, too many, should throw an error', function () {
    testPlan = ['@@ ', '   ', '   '];
    try {
      testLevel = new Level(testPlan);
    } catch (err) {
      assert(err);
    }
  });
  test('One player and should pass', function () {
    testPlan = ['x  ', '  @', ' v '];
    testLevel = new Level(testPlan);
    assert(testLevel.width === 3);
    assert(testLevel.height === 3);
  });
  test('A proper plan passed to Level constructor, should pass', function () {
    testLevel = new Level(simpleLevelPlan);
    assert(testLevel.player instanceof Player, 'player should be of Player');
  });
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
  test('Has pos property', function () {
    assert(p.pos.x === 10);
    assert(p.pos.y === 12 + -0.5);
  });
  test('Has size', function () {
    assert((p.size.x = 0.8));
    assert((p.size.y = 1.5));
  });
  test('Has speed', function () {
    assert(p.speed.x === 0);
    assert(p.speed.y === 0);
  });
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

suite('Test Coin class', function () {
  var coin = null;
  var pos = new Vector(10, 12);
  setup(function () {
    coin = new Coin(pos);
  });
  test('it has the base position', function () {
    assert(coin.basePos === coin.pos);
  });
  test('has size', function () {
    assert(coin.size instanceof Vector);
  });
  test('can wobble', function () {
    assert(coin.wobble, 'has this property');
    // Random number <0 - 1>
    assert(coin.wobble >= 0, 'must be equal or higher than 0');
    assert(
      coin.wobble < 1 * Math.PI * 2,
      'must be equal or less 1 * Math.PI * 2'
    );
  });
  test('Type is coin', function () {
    assert(coin.type === 'coin', 'type is coin');
  });
});

suite('Test elt function', function () {
  test('should return div element with empty className', function () {
    var div = elt('div');
    assert(div instanceof HTMLDivElement, 'div should be HTMLDivElement');
    assert(div.className === '', 'div.className is empty');
  });
  test('should return div element with game class', function () {
    var div = elt('div', 'game');
    assert(div.className === 'game', 'div.className is equal to game');
  });
});

suite('Test DOMDisplay', function () {});

suite('IT tests', function () {});
