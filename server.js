const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const World = require('./world');
const tickrate = 50;
const beforeGameTimer = 10;

let width = 2000,
  height = 1500,
  items = Math.floor((width * height) / 100000);
let status = {
  timeToRound: beforeGameTimer * tickrate,
  tickrate: tickrate,
  beforeGameTimer: beforeGameTimer
};

let playersAlive = 0;
let players = {};
let ids = [];
let world = new World(width, height, items);
let itemsList = JSON.parse(fs.readFileSync('items.json', 'utf8'));
let bullets = [];

//helper methods
function diff(num1, num2) {
  if (num1 > num2) {
    return (num1 - num2);
  } else {
    return (num2 - num1);
  }
};

function random(highest) {
  return Math.floor(highest * Math.random());
}

function dist(x1, y1, x2, y2) {
  var dX = diff(x1, x2);
  var dY = diff(y1, y2);
  var dist = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
  return (dist);
};

function map(n, start1, stop1, start2, stop2) {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

function resetRound() {
  status.timeToRound = beforeGameTimer * tickrate;
  bullets = [];
  world = new World(width, height, items);
  playersAlive = 0;
  for (id of ids) {
    players[id] = new Player(random(width), random(height), id);
    players[id].alive = true;
    playersAlive++;
  }
}

function Bullet(x, y, dir, id, weapon) {
  this.shooter = id;
  this.weaponType = weapon;
  this.size = 10;
  this.x = x;
  this.y = y;
  this.direction = dir + map((Math.random() - .5), -.5, .5, -this.weaponType.accuracy, this.weaponType.accuracy);
  this.bulletSpeed = this.weaponType.bulletSpeed;
  this.age = 0;

  this.update = function() {
    if (this.x > 0 || this.x < width || this.y > 0 || this.y < height) {
      this.y += this.bulletSpeed * Math.sin(this.direction * Math.PI / 180);
      this.x += this.bulletSpeed * Math.cos(this.direction * Math.PI / 180);
    }
    this.age++;
    if (this.age > 150) {
      bullets.splice(0, 1);
    }
  }

  this.getDamage = function() {
    return this.weaponType.damage;
  }
}

function Player(x, y, id) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.movement = [false, false, false, false];
  this.topColor = { r: random(255), g: random(255), b: random(255) };
  this.bottomColor = { r: random(255), g: random(255), b: random(255) };
  this.size = 75;
  this.reloading = false;
  this.sinceReload = 0;
  this.speed = 10;
  this.direction = 90;
  this.health = 100;
  this.shield = 100;
  this.invSpace = 5;
  this.selected = 0; //an index of this.items
  this.sinceLastShot = Infinity;
  this.items = [null, null, null, null, null];
  this.alive = false;
  this.kills = [];
  this.usingConsumable = false;
  this.sinceUse = 0;

  this.fire = function(dir) {
    if (this.selectedItem().loaded > 0 && !this.reloading) {
      bullets.push(new Bullet(this.x, this.y, dir, this.id, this.selectedItem()));
      this.selectedItem().loaded--;
    }
  }

  this.dropAllItems = function() {
    let itemDropper = [];
    for (item of this.items) {
      if (item) {
        itemDropper.push(item);
      }
    }
    if (itemDropper[0]) {
      for (let index = 0; index < itemDropper.length; index++) {
        if (itemDropper[index]) {
          let item = { x: this.x + 60 * Math.cos(index * (2 * Math.PI) / itemDropper.length), y: this.y + 60 * Math.sin(index * (2 * Math.PI) / itemDropper.length), item: itemDropper[index] };
          world.items[world.items.indexOf(null)] = item;
          itemDropper[index] = null;
        }
      }
    }
  }

  this.getNearbyItemIndex = function() {
    for (var i = 0; i < world.items.length; i++) {
      if (world.items[i]) {
        if (dist(world.items[i].x, world.items[i].y, this.x, this.y) < this.size / 2 + world.itemSize / 2) {
          return i;
        }
      }
    }
    return -1;
  }

  this.selectedItem = function() {
    return this.items[this.selected];
  }

  this.dropItemIndex = function(index) {
    if (this.items[index]) {
      let item = { x: this.x, y: this.y, item: this.items[index] };
      world.items[world.items.indexOf(null)] = item;
      this.items[index] = null;
    }
  }

  this.firstOpenSlot = function() {
    return this.items.indexOf(null);
  }

  this.checkCollision = function() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      let bullet = bullets[i];
      if (bullet.shooter !== this.id) {
        if (dist(this.x, this.y, bullet.x, bullet.y) < this.size / 2 + bullet.size / 2) {
          console.log(i);
          this.shield -= bullet.getDamage();
          if (this.shield < 0) {
            this.health += this.shield;
            this.shield = 0;
          }
          if (this.health <= 0 && this.alive) {
            this.health = 0;
            players[bullet.shooter].kills.push(this.id);
            this.alive = false;
            playersAlive--;
            this.dropAllItems();
          }
          bullets.splice(i, 1);
        }
      }
    }
  }

  this.pickUpItem = function() {
    if (this.getNearbyItemIndex() > -1) {
      let item = world.items[this.getNearbyItemIndex()].item;
      if (this.firstOpenSlot() !== -1) {
        world.items[this.getNearbyItemIndex()] = null;
        this.items[this.firstOpenSlot()] = item;
      } else {
        let item = { x: this.x, y: this.y, item: this.items[this.selected] };
        this.items[this.selected] = null;
        this.pickUpItem();
        world.items[world.items.indexOf(null)] = item;
      }
    }
  }
}

app.use("/client", express.static(__dirname + '/client'));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
if (process.env.PORT) {
  http.listen(process.env.PORT, function(x) {
    console.log('Server running');
  });
} else {
  http.listen(3000, function(x) {
    console.log('Server running on localhost:' + 3000);
  });
}

function addPlayer(id) {
  players[id] = new Player(random(width), random(height), id);
  ids.push(id);
}

function removePlayer(id) {
  ids.splice(ids.indexOf(id), 1);
  delete players[id];
}

io.on('connection', function(socket) {
  console.log('a user connected');
  io.to(socket.id).emit('id', { sockId: socket.id });
  addPlayer(socket.id);
  if (status.timeToRound > 0) {
    players[socket.id].alive = true;
    playersAlive++;
  }

  socket.on('disconnect', function() {
    console.log('user disconnected');
    if (players[socket.id].alive) {
      playersAlive--;
    }
    removePlayer(socket.id);
  });

  socket.on('requestFire', function(mouse) {
    if (players[socket.id].selectedItem()) {
      if (players[socket.id].selectedItem().magSize && players[socket.id].sinceLastShot > players[socket.id].selectedItem().fireCooldown) { //if holding a weapon and the fire rate is under control
        players[socket.id].fire(mouse.dir);
        players[socket.id].sinceLastShot = 0;
      }
      if (players[socket.id].selectedItem().health !== undefined) { //holding a consumable
        players[socket.id].usingConsumable = true;
      }
    }
  });

  socket.on('pressedKey', function(key) {
    key = key.key;
    if (key === 'W') {
      players[socket.id].movement[0] = true;
    } else if (key === 'S') {
      players[socket.id].movement[1] = true;
    } else if (key === 'A') {
      players[socket.id].movement[2] = true;
    } else if (key === 'D') {
      players[socket.id].movement[3] = true;
    } else if (key === 'F' && !players[socket.id].reloading) {
      players[socket.id].pickUpItem();
    } else if (key === 'G' && !players[socket.id].reloading) {
      players[socket.id].dropItemIndex(players[socket.id].selected);
    } else if (key === 'R') {
      if (players[socket.id].selectedItem() && players[socket.id].selectedItem().magSize !== players[socket.id].selectedItem().loaded)
        players[socket.id].reloading = true;
    } else if (0 < key && key < 6 && !players[socket.id].reloading && !players[socket.id].usingConsumable) {
      players[socket.id].selected = key - 1;
    }
  });

  socket.on('releasedKey', function(key) {
    key = key.key;
    if (key === 'W') {
      players[socket.id].movement[0] = false;
    } else if (key === 'S') {
      players[socket.id].movement[1] = false;
    } else if (key === 'A') {
      players[socket.id].movement[2] = false;
    } else if (key === 'D') {
      players[socket.id].movement[3] = false;
    }
  });
});

setInterval(function() {
  if (status.timeToRound < 0) {
    for (id of ids) {
      let player = players[id];
      if (player.alive) {
        player.checkCollision();
        player.sinceLastShot++;
        if (player.reloading) {
          player.sinceReload++;
          if (player.sinceReload > player.selectedItem().reloadTime) {
            player.reloading = false;
            player.selectedItem().loaded = player.selectedItem().magSize;
          }
        } else {
          player.sinceReload = 0;
        }
        if (player.usingConsumable) {
          player.sinceUse++;
          if (player.sinceUse > player.selectedItem().useTime) {
            player.usingConsumable = false;
            if (player.selectedItem().health) {
              player.health = 100;
            }
            if (player.selectedItem().shield) {
              player.shield = 100;
            }
            player.items[player.selected] = null;
          }
        } else {
          player.sinceUse = 0;
        }
        if (player.movement[0] && player.y > 0) {
          player.y -= player.speed;
          player.usingConsumable = false;
        }
        if (player.movement[1] && player.y < height) {
          player.y += player.speed;
          player.usingConsumable = false;
        }
        if (player.movement[2] && player.x > 0) {
          player.x -= player.speed;
          player.usingConsumable = false;
        }
        if (player.movement[3] && player.x < width) {
          player.x += player.speed;
          player.usingConsumable = false;
        }
      }
      for (bullet of bullets) {
        bullet.update();
      }
    }
    if (playersAlive < 2) { //we have a winner
      resetRound();
    }
  } else { //lobby mode
    if (ids.length > 1) {
      status.timeToRound--;
      console.log(ids.length, status.timeToRound / tickrate);
    } else {
      status.timeToRound = beforeGameTimer * tickrate;
    }
  }
  io.emit('data', { status: status, players: players, ids: ids, world: world, bullets: bullets });
}, 1000 / tickrate);