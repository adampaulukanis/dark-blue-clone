'use strict';

/*
 * Do wyświetlania gry wykorzystamy model DOM przeglądarki, a poczynania
 * użytkownika będziemy odczytywać poprzez obsługę zdarzeń klawiszy. Obsługa
 * myszą będzie stanowić niewielką część kodu.
 *
 * @todo translate comments into English
 */

/* Prosty poziom
 * x - ściana,
 * \Space - pusta przestrzeń,
 * ! - nieruchome kafelki lawy,
 * @ - początkowa pozycja gracza,
 * o - moneta,
 * a - blok lawy, która porusza się na boku,
 * | - lawa poruszająca się pionowo,
 * v - kapiąca lawa (nie odbija się od podłoża i nie wraca do początkowej pozycji)
 */
let simpleLevelPlan = [
  '                      ',
  '                      ',
  '  x              = x  ',
  '  x         o o    x  ',
  '  x @      xxxxx   x  ',
  '  xxxxx            x  ',
  '      x!!!!!!!!!!!!x  ',
  '      xxxxxxxxxxxxxx  ',
  '                      ',
];

var WALL_TYPE = 'wall';

/**
 * Gra będzie opierać się na prostych poziomach, wcześniej zrobionych, które
 * użytkownik musi przejść, aby ukończyć grę. Aby przejść poziom, należy zebrać
 * wszystkie monety. Jeżeli gracz dotknie lawy, następuje powrót do początku
 * poziomu i trzeba zacząć zbieranie monet od nowa.
 *
 * @constructor
 * @param {Object[]} plan - the level to be loaded
 *
 * @todo mechanizmy sprawdzające nieprawidłowe dane wejściowe: prawidłowo zbudowana plansza z pozycją początkową gracza i inne niezbędne składniki.
 */
function Level(plan) {
  // assert(plan != null);

  /** @type {Array} */
  /** @type {string} plan[0] */
  if (!Array.isArray(plan) || !typeof plan[0] == 'string' || plan == null) {
    throw new Error('Plan should be an array and made of strings');
  }

  /** @type {!number} */
  this.width = plan[0].length;

  /** @type {!number} */
  this.height = plan.length;

  /** każdy element ma swój typ (type) albo jest null, jeśli jest pusty */
  this.grid = [];

  /** elementy dynamiczne */
  this.actors = [];

  for (var y = 0; y < this.height; y++) {
    var line = plan[y],
      gridLine = [];
    for (var x = 0; x < this.width; x++) {
      var ch = line[x],
        fieldType = null;
      var Actor = actorChars[ch];
      if (Actor) {
        this.actors.push(
          new Actor(new Vector(x, y), ch /* used only with Lava class */)
        );
      } else if (ch == 'x') {
        fieldType = WALL_TYPE;
      } else if (ch == '!') {
        fieldType = LAVA_TYPE;
      }
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }

  /** Może być tylko jeden player, ale lepiej się upewnić
   * @todo czy [0] jest konieczne? Napisz test czy jest tylko jeden player
   */
  this.player = this.actors.filter(function (actor) {
    return actor.type == PLAYER_TYPE;
  });
  if (this.player.length !== 1) {
    throw new Error('There should be one and only one player');
  }
  this.player = this.player[0];

  /** status - czy gracz wygrał, czy przegrał */
  this.status = null;

  /** finishDelay - jeśli wiadomo, czy gracz wygrał, bądź przegrał, aktywny
   * poziom jest jeszcze pokazywany przez chwilę, aby wyświetlić prostą
   * animację (natychmiastowe zresetowanie poziomu albo przejście do kolejnego
   * wyglądałoby jak amatorszczyzna)
   */
  this.finishDelay = null;
}

/** Sprawdź, czy poziom został ukończony */
Level.prototype.isFinished = function () {
  return this.status != null && this.finishDelay < 0;
};

/**
 * Metoda ta wyznacza zbiór prostokątów siatki, z którymi pokrywa się obiekt.
 */
Level.prototype.obstacleAt = function (pos, size) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  if (xStart < 0 || xEnd > this.width || yStart < 0) {
    return WALL_TYPE;
  }
  if (yEnd > this.height) {
    return LAVA_TYPE;
  }
  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      var fieldType = this.grid[y][x];
      if (fieldType) {
        return fieldType;
      }
    }
  }
};

/**
 * Metoda ta skanuje tablicę aktorów w poszukiwaniu aktora pokrywającego się z
 * tym, który został przekazany jako argument.
 */
Level.prototype.actorAt = function (actor) {
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if (
      other != actor &&
      actor.pos.x + actor.size.x > other.pos.x &&
      actor.pos.x < other.pos.x + other.size.x &&
      actor.pos.y + actor.size.y > other.pos.y &&
      actor.pos.y < other.pos.y + other.size.y
    ) {
      return other;
    }
  }
};

var maxStep = 0.05;

/**
 * Metoda ta daje wszystkim aktorom na danym poziomie możliwość wykonania ruchu.
 * @param {number} step - odcinek czasu w sekundach.
 * @param {???} keys - które klawisze nacisnął gracz.
 */
Level.prototype.animate = function (step, keys) {
  if (this.status != null) {
    this.finishDelay -= step;
  }

  while (step > 0) {
    var thisStep = Math.min(step, maxStep);
    this.actors.forEach(function (actor) {
      actor.act(thisStep, this, keys);
    }, this);
    step -= thisStep;
  }
};

Level.prototype.playerTouched = function (type, actor) {
  if (type == LAVA_TYPE && this.status == null) {
    this.status = 'lost';
    this.finishDelay = 1;
  } else if (type == COIN_TYPE) {
    this.actors = this.actors.filter(function (other) {
      return other != actor;
    });

    if (
      !this.actors.some(function (actor) {
        return actor.type == COIN_TYPE;
      })
    ) {
      this.status = 'won';
      this.finishDelay = 1;
    }
  }
};

/** Obiekt Vector służy do określania pozycji w R^2 */
function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vector.prototype.plus = function (other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

/** Skaluj wektor o określoną wartość */
Vector.prototype.times = function (factor) {
  return new Vector(this.x * factor, this.y * factor);
};

/** Obiekt służy do tego, aby powiązać znaki z funkcjami konstrukcyjnymi */
var actorChars = {
  '@': Player,
  o: Coin,
  '=': Lava,
  '|': Lava,
  v: Lava,
};

/** Player class
 * @constructor
 * @param {Vector} pos - position of the object (top left corner)
 */
function Player(pos) {
  /**
   * The height of the player is 1.5, so its starting position is
   * 1/2 above the @ character
   * @type {Vector}
   */
  this.pos = pos.plus(new Vector(0, -0.5));

  /** @var {Vector} size */
  this.size = new Vector(0.8, 1.5);

  /** @var {Vector} speed - the actual speed of the player. It will help with
   * simulating gravity and momentum. Player starts
   */
  this.speed = new Vector(0, 0);
}

var PLAYER_TYPE = 'player';
Player.prototype.type = PLAYER_TYPE;

var playerXSpeed = 7;

Player.prototype.moveX = function (step, level, keys) {
  this.speed.x = 0;
  if (keys.left) {
    this.speed.x -= playerXSpeed;
  }
  if (keys.right) {
    this.speed.x += playerXSpeed;
  }

  var motion = new Vector(this.speed.x * step, 0);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle) {
    level.playerTouched(obstacle);
  } else {
    this.pos = newPos;
  }
};

var gravity = 30;
var jumpSpeed = 17;

Player.prototype.moveY = function (step, level, keys) {
  this.speed.y += step * gravity;
  var motion = new Vector(0, this.speed.y * step);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle) {
    level.playerTouched(obstacle);
    if (keys.up && this.speed.y > 0) {
      this.speed.y = -jumpSpeed;
    } else {
      this.speed.y = 0;
    }
  } else {
    this.pos = newPos;
  }
};

Player.prototype.act = function (step, level, keys) {
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);

  var otherActor = level.actorAt(this);
  if (otherActor) {
    level.playerTouched(otherActor.type, otherActor);
  }

  // animacja przegranej
  if (level.status == 'lost') {
    this.pos.y += step;
    this.size.y -= step;
  }
};

/** Lava class
 * The only class which takes in two parameters.
 * @constructor
 * @param {Vector} pos - position of the object (top left corner)
 * @param {String} ch - kind of lava we want
 */
function Lava(pos, ch) {
  /** @var {Vector} pos */
  this.pos = pos;

  /** @var {Vector} size */
  this.size = new Vector(1, 1);

  /** @var {Vector} repeatPos - what to do when the object encounters other object */
  this.repeatPos = null;

  /** @var {Vector} speed - depends on 'ch' parameter */
  if (ch == '=') {
    this.speed = new Vector(2, 0);
  } else if (ch == '|') {
    this.speed = new Vector(0, 2);
  } else if (ch == 'v') {
    this.speed = new Vector(0, 3);
    this.repeatPos = pos; // go back to your starting position
  }
}

var LAVA_TYPE = 'lava';
Lava.prototype.type = LAVA_TYPE;

Lava.prototype.act = function (step, level) {
  var newPos = this.pos.plus(this.speed.times(step));
  if (!level.obstacleAt(newPos, this.size)) {
    this.pos = newPos;
  } else if (this.repeatPos) {
    this.pos = this.repeatPos;
  } else {
    this.speed = this.speed.times(-1);
  }
};

/** Coin class
 * @constructor
 * @param {Vector} pos - position of the object (top left corner)
 */
function Coin(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));

  this.size = new Vector(0.6, 0.6);

  /** Losowa pozycja startowa na fali, tak aby każda moneta falowała z inną fazą */
  this.wobble = Math.random() * Math.PI * 2;
}

var COIN_TYPE = 'coin';
Coin.prototype.type = COIN_TYPE;

var wobbleSpeed = 8;
var wobbleDist = 0.07;

Coin.prototype.act = function (step) {
  this.wobble += step * wobbleSpeed;
  var wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

function elt(name, className) {
  var elt = document.createElement(name);
  if (className) {
    elt.className = className;
  }
  return elt;
}

/**
 * A display is created by giving it a parent element to which it should append
 * itself and a level object.
 * @constructor
 */
function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(elt('div', 'game'));
  this.level = level;

  this.wrap.appendChild(this.drawBackground());
  this.actorLayer = null;
  this.drawFrame();
}

var scale = 20;

DOMDisplay.prototype.drawBackground = function () {
  var table = elt('table', 'background');
  table.style.width = this.level.width * scale + 'px';
  this.level.grid.forEach(function (row) {
    var rowElt = table.appendChild(elt('tr'));
    rowElt.style.height = scale + 'px';
    row.forEach(function (type) {
      rowElt.appendChild(elt('td', type));
    });
  });
  return table;
};

DOMDisplay.prototype.drawActors = function () {
  var wrap = elt('div');
  this.level.actors.forEach(function (actor) {
    var rect = wrap.appendChild(elt('div', 'actor ' + actor.type));
    rect.style.width = actor.size.x * scale + 'px';
    rect.style.height = actor.size.y * scale + 'px';
    rect.style.left = actor.pos.x * scale + 'px';
    rect.style.top = actor.pos.y * scale + 'px';
  });
  return wrap;
};

/**
 * When it updates the display, the drawFrame method first removes the old actor
 * graphics, if any, and then redraws them in their new positions. It may be
 * tempting to try to reuse the DOM elements for actors, but to make that work,
 * we would need a lot of additional information flow between the display code
 * and the simulation code. We’d need to associate actors with DOM elements, and
 * the drawing code must remove elements when their actors vanish. Since there
 * will typically be only a handful of actors in the game, redrawing all of them
 * is not expensive.
 */
DOMDisplay.prototype.drawFrame = function () {
  if (this.actorLayer) {
    this.wrap.removeChild(this.actorLayer);
  }
  this.actorLayer = this.wrap.appendChild(this.drawActors());
  this.wrap.className = 'game ' + (this.level.status || '');
  this.scrollPlayerIntoView();
};

DOMDisplay.prototype.scrollPlayerIntoView = function () {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;
  var margin = width / 3;

  // The viewport
  var left = this.wrap.scrollLeft,
    right = left + width;
  var top = this.wrap.scrollTop,
    bottom = top + height;

  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5)).times(scale);

  if (center.x < left + margin) {
    this.wrap.scrollLeft = center.x - margin;
  } else if (center.x > right - margin) {
    this.wrap.scrollLeft = center.x + margin - width;
  }
  if (center.y < top + margin) {
    this.wrap.scrollTop = center.y - margin;
  } else if (center.y > bottom - margin) {
    this.wrap.scrollTop = center.y + margin - height;
  }
};

DOMDisplay.prototype.clear = function () {
  this.wrap.parentNode.removeChild(this.wrap);
};

var arrowCodes = { 37: 'left', 38: 'up', 39: 'right' };

function trackKeys(codes) {
  var pressed = Object.create(null);

  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == 'keydown';
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }

  addEventListener('keydown', handler);
  addEventListener('keyup', handler);

  return pressed;
}

function runAnimation(frameFunc) {
  var lastTime = null;

  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) == false;
    }
    lastTime = time;
    if (!stop) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

var arrows = trackKeys(arrowCodes);

function runLevel(level, Display, andThen) {
  var display = new Display(document.body, level);

  runAnimation(function (step) {
    level.animate(step, arrows);
    display.drawFrame(step);
    if (level.isFinished()) {
      display.clear();
      if (andThen) {
        andThen(level.status);
      }
      return false;
    }
  });
}

function runGame(plans, Display) {
  function startLevel(n) {
    runLevel(new Level(plans[n]), Display, function (status) {
      if (status == 'lost') {
        startLevel(n);
      } else if (n < plans.length - 1) {
        startLevel(n + 1);
      } else {
        console.log('You win!');
      }
    });
  }
  startLevel(0);
}
