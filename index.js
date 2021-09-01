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
        fieldType = 'wall';
      } else if (ch == '!') {
        fieldType = 'lava';
      }
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }

  /** Może być tylko jeden player, ale lepiej się upewnić
   * @todo czy [0] jest konieczne? Napisz test czy jest tylko jeden player
   */
  this.player = this.actors.filter(function (actor) {
    return actor.type == 'player';
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

Player.prototype.type = 'player';

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

Lava.prototype.type = 'lava';

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

Coin.prototype.type = 'coin';

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
  throw Error();
};
