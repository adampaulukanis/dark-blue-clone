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
function Level (plan) {
  /** @type {!number} */
  this.width = plan[0].length;

  /** @type {!number} */
  this.height = plan.length;

  /** każdy element ma swój typ (type) albo jest null, jeśli jest pusty */
  this.grid = [];
  
  /** elementy dynamiczne */
  this.actors = [];

  for (var y = 0; y < this.height;y++) {
    var line = plan[y], gridLine = [];
    for (var x = 0; x < this.width;x++) {
      var ch = line[x], fieldType = null;
      var Actor = actorChars[ch];
      if (Actor) {
        this.actors.push(new Actor(new Vector(x, y), ch /* used only with Lava class */));
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
  })[0];

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
function Vector (x, y) {
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
  'o': Coin,
  '=': Lava, '|': Lava, 'v': Lava
};

/** Player class
 * @constructor
 * @param {Vector} pos - position of the object (top left corner)
 */
function Player (pos) {
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
function Lava (pos, ch) {
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
function Coin (pos) {
}

