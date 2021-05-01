'use strict';

let simpleLevelPlan = [
  '                      ',
  '                 =    ',
  ' x                  x ',
  ' x             o o  x ',
  ' x  @        xxxxxx x ',
  ' xxxxxxxxx          x ',
  '         x!!!!!!!!!!x ',
  '         xxxxxxxxxxxx ',
  '                      ',
];

class Player {

  constructor(pos) {
    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
  }
}
Player.prototype.type = 'player';

class Coin {
  constructor(pos) {
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
    this.wobble = Math.random() * Math.PI * 2;
  }
}
Coin.prototype.type = 'coin';

class Lava {
  constructor(pos, ch) {
    this.pos = pos;
    this.size = new Vector(1, 1);
    if (ch == '='){
      this.speed = new Vector(2, 0);
    } else if (ch == '|'){
      this.speed = new Vector(0, 2);
    } else if(ch == 'v'){
      this.speed = new Vector(0, 3);
      this.repeatPos = pos;
    }
  }
}
Lava.prototype.type = 'lava';

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  plus(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  }
  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}

const actorChars = {
  '@': Player,
  'o': Coin,
  '=': Lava,
  '|': Lava,
  'v': Lava,
};

class Level {
  constructor(plan) {
    this.width = plan[0].length;
    this.height = plan.length;
    this.grid = [];
    this.actors = [];

    for (let y = 0; y < this.height; y++) {
      let line = plan[y],
        gridLine = [];
      for (let x = 0; x < this.width; x++) {
        let ch = line[x],
          fieldType = null;

        let Actor = actorChars[ch];
        if (Actor) {
          this.actors.push(new Actor(new Vector(x, y), ch));
        } else if (ch == 'x') {
          fieldType = 'wall';
        } else if (ch == '!') {
          fieldType = 'lava';
        }
        gridLine.push(fieldType);
      }
      this.grid.push(gridLine);
    }
    this.player = this.actors.filter((actor) => {
      return actor.type == 'player';
    })[0];
    this.status = this.finishDelay = null;
  }

  isFinished() {
    return this.status != null && this.finishDelay < 0;
  }
}

function elt(name, className) {
  let elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

const scale = 20;

class DOMDisplay {
  constructor(parent, level) {
    this.wrap = parent.appendChild(elt('div', 'game'));
    this.level = level;

    this.wrap.appendChild(this.drawBackground());
    this.actorLayer = null;
    this.drawFrame();
  }
  drawBackground() {
    let table = elt('table', 'background');
    table.style.width = this.level.width * scale + 'px';
    this.level.grid.forEach((row) => {
      let rowElt = table.appendChild(elt('tr'));
      rowElt.style.height = scale + 'px';
      row.forEach((type) => {
        rowElt.appendChild(elt('td', type));
      });
    });
    return table;
  }
  drawActors() {
    let wrap = elt('div');
    this.level.actors.forEach((actor) => {
      let rect = wrap.appendChild(elt('div', 'actor ' + actor.type));
      rect.style.width = actor.size.x * scale + 'px';
      rect.style.height = actor.size.y * scale + 'px';
      rect.style.left = actor.pos.x * scale + 'px';
      rect.style.top = actor.pos.y * scale + 'px';
    });
    return wrap;
  }
  drawFrame() {
    if (this.actorLayer) {
      this.wrap.removeChild(this.actorLayer);
    }
    this.actorLayer = this.wrap.appendChild(this.drawActors());
    this.wrap.className = 'game ' + (this.level.status || '');
    this.scrollPlayerIntoView();
  }
  clear() {
    this.wrap.parentNode.removeChild(this.wrap);
  }
  scrollPlayerIntoView(){
    let width = this.wrap.clientWidth;
    let height = this.wrap.clientHeight;
    let margin = width / 3;

    // Obszar widoku
    let left = this.wrap.scrollLeft,
      right = left + width;
    let top = this.wrap.scrollTop,
      bottom = top + height;
    let player = this.level.player;
    let center = player.pos.plus(player.size.times(0.5)).times(scale);

    if (center.x < left + margin){
      this.wrap.scrollLeft = center.x - margin;
    } else if (center.x > right - margin){
      this.wrap.scrollLeft = center.x + margin - width;
    }

    if(center.y < top + margin){
      this.wrap.scrollTop = center.y - margin;

    } else if (center.y > bottom - margin){
      this.wrap.scrollTop = center.y + margin - height;
    }
  }
}
