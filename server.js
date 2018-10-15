const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const World = require('./world');

let width = 2000,
  height = 1500,
  items = Math.floor((width * height) / 100000);

let status = {
  tickrate: 50,
  beforeGameTimer: 5,
  timeToRound: Infinity,
  playersAlive: 0,
  names: [],
  lastWinner: 'Anonymous'
};
status.timeToRound = status.tickrate * status.beforeGameTimer;

let players = {};
let ids = [];
let bullets = [];
let world = new World(width, height, items);
let itemsList = JSON.parse(fs.readFileSync('items.json', 'utf8'));

//runs the server
app.use("/client", express.static(__dirname + '/client'));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

//If running on heroku else use localhost:3000
if (process.env.PORT) {
  http.listen(process.env.PORT, function(x) {
    console.log('Server running');
  });
} else {
  http.listen(3000, function(x) {
    console.log('Server running on localhost:' + 3000);
  });
}

//helper methods
function diff(num1, num2) {
  if (num1 > num2) {
    return (num1 - num2);
  } else {
    return (num2 - num1);
  }
};

function dist(x1, y1, x2, y2) {
  var dX = diff(x1, x2);
  var dY = diff(y1, y2);
  var dist = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
  return (dist);
};

function random(highest) {
  return Math.floor(highest * Math.random());
}

function map(n, start1, stop1, start2, stop2) {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

//adds the player by id
function addPlayer(id) {
  players[id] = new Player(random(width), random(height), id);
  while (players[id].collidingWithAnyStructure()) {
    players[id] = new Player(random(width), random(height), id);
  }
  ids.push(id);
}

//removes the player by id
function removePlayer(id) {
  ids.splice(ids.indexOf(id), 1);
  delete players[id];
  status.names.splice(status.names.indexOf(id), 1);
}

//resets the game so a new round can begin
function resetRound() {
  status.timeToRound = status.beforeGameTimer * status.tickrate;
  bullets = [];
  status.playersAlive = 0;
  for (id of ids) {
    if (players[id].name != '') {
      let name = players[id].name;
      players[id] = new Player(random(width), random(height), id);
      while (players[id].collidingWithAnyStructure()) {
        players[id] = new Player(random(width), random(height), id);
      }
      players[id].alive = true;
      players[id].name = name;
      status.playersAlive++;
    }
  }
  width = status.playersAlive * 500 + 1000;
  height = width * 3 / 4;
  world = new World(width, height, items);
}

//A bullet object
function Bullet(x, y, dir, id, weapon) {
  this.size = 10;
  this.x = x;
  this.y = y;
  this.weaponType = weapon;
  this.direction = dir + map((Math.random() - .5), -.5, .5, -this.weaponType.accuracy, this.weaponType.accuracy);
  this.shooter = id;
  this.speed = this.weaponType.bulletSpeed;
  this.age = 0;

  this.update = function() {
    if (this.x > 0 || this.x < width || this.y > 0 || this.y < height) {
      this.y += this.speed * Math.sin(this.direction * Math.PI / 180);
      this.x += this.speed * Math.cos(this.direction * Math.PI / 180);
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

//A player object
function Player(x, y, id) {
  this.alive = false;
  this.id = id;
  this.name = '';
  this.x = x;
  this.y = y;
  this.direction = 90;
  this.size = 75;
  this.speed = 10;
  this.movement = [false, false, false, false];
  this.topColor = {
    r: random(255),
    g: random(255),
    b: random(255)
  };
  this.bottomColor = {
    r: random(255),
    g: random(255),
    b: random(255)
  };
  this.health = 100;
  this.shield = 100;
  this.selected = 0; //an index of this.items
  this.invSpace = 5;
  this.items = [null, null, null, null, null];
  this.sinceLastShot = Infinity;
  this.kills = [];
  this.usingConsumable = false;
  this.sinceUse = 0;
  this.reloading = false;
  this.sinceReload = 0;
  // this.hasMovedThisRound = false;

  this.update = function() {
    this.checkCollision();
    this.sinceLastShot++;
    if (this.reloading) {
      this.sinceReload++;
      if (this.sinceReload > this.selectedItem().reloadTime) {
        this.reloading = false;
        this.selectedItem().loaded = this.selectedItem().magSize;
      }
    } else {
      this.sinceReload = 0;
    }
    if (this.usingConsumable) {
      this.sinceUse++;
      if (this.sinceUse > this.selectedItem().useTime) {
        this.usingConsumable = false;
        if (this.selectedItem().health) {
          this.health = 100;
        }
        if (this.selectedItem().shield) {
          this.shield = 100;
        }
        this.items[this.selected] = null;
      }
    } else {
      this.sinceUse = 0;
    }
    if (this.movement[0] && this.y > 0) {
      this.y -= this.speed;
      if (this.collidingWithAnyStructure()) {
        this.y += this.speed;
      }
      // this.hasMovedThisRound = true;
    }
    if (this.movement[1] && this.y < height) {
      this.y += this.speed;
      if (this.collidingWithAnyStructure()) {
        this.y -= this.speed;
      }
      // this.hasMovedThisRound = true;
    }
    if (this.movement[2] && this.x > 0) {
      this.x -= this.speed;
      if (this.collidingWithAnyStructure()) {
        this.x += this.speed;
      }
      // this.hasMovedThisRound = true;
    }
    if (this.movement[3] && this.x < width) {
      this.x += this.speed;
      if (this.collidingWithAnyStructure()) {
        this.x -= this.speed;
      }
      // this.hasMovedThisRound = true;
    }
  }

  this.collidingWithAnyStructure = function() {
    for (structure of world.structures) {
      if (structure.health > 0 && structure.collidingWith(this.x, this.y, this.size / 2)) {
        return true;
      }
    }
    return false;
  }

  this.checkCollision = function() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      let bullet = bullets[i];
      if (bullet.shooter !== this.id) {
        if (dist(this.x, this.y, bullet.x, bullet.y) < this.size / 2 + bullet.size / 2) {
          this.shield -= bullet.getDamage();
          if (this.shield < 0) {
            this.health += this.shield;
            this.shield = 0;
          }
          if (this.health <= 0 && this.alive) {
            this.health = 0;
            players[bullet.shooter].kills.push(this.id);
            this.alive = false;
            status.playersAlive--;
            this.dropAllItems();
          }
          bullets.splice(i, 1);
        }
      }
    }
  }

  this.fire = function() {
    if (this.selectedItem().loaded > 0 && !this.reloading) {
      bullets.push(new Bullet(this.x, this.y, this.direction, this.id, this.selectedItem()));
      this.selectedItem().loaded--;
    }
  }

  this.selectedItem = function() {
    return this.items[this.selected];
  }

  this.firstOpenSlot = function() {
    return this.items.indexOf(null);
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

  this.pickUpItem = function() {
    if (this.getNearbyItemIndex() > -1) {
      let item = world.items[this.getNearbyItemIndex()].item;
      if (this.firstOpenSlot() !== -1) {
        world.items[this.getNearbyItemIndex()] = null;
        this.items[this.firstOpenSlot()] = item;
      } else {
        let item = {
          x: this.x,
          y: this.y,
          item: this.items[this.selected]
        };
        this.items[this.selected] = null;
        this.pickUpItem();
        world.items[world.items.indexOf(null)] = item;
      }
    }
  }

  this.dropItemIndex = function(index) {
    if (this.items[index]) {
      let item = {
        x: this.x,
        y: this.y,
        item: this.items[index]
      };
      world.items[world.items.indexOf(null)] = item;
      this.items[index] = null;
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
          let item = {
            x: this.x + 60 * Math.cos(index * (2 * Math.PI) / itemDropper.length),
            y: this.y + 60 * Math.sin(index * (2 * Math.PI) / itemDropper.length),
            item: itemDropper[index]
          };
          world.items[world.items.indexOf(null)] = item;
          itemDropper[index] = null;
        }
      }
    }
  }
}

function checkCollisionsWithStructures() {
  for (let i = world.structures.length - 1; i >= 0; i--) {
    let structure = world.structures[i];
    if (structure.health > 0) {
      for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        if (structure.collidingWith(bullet.x, bullet.y, bullet.size)) {
          structure.health -= bullet.getDamage();
          bullets.splice(i, 1);
        }
      }
    }
  }
}

//when a user connects
io.on('connection', function(socket) {
  io.to(socket.id).emit('id', {
    sockId: socket.id
  });
  addPlayer(socket.id);

  socket.on('join', function(data) {
    console.log('User registered as ' + data.name);
    players[socket.id].name = data.name;
    status.names.push(data.name);
    if (status.timeToRound > 0) {
      players[socket.id].alive = true;
      status.playersAlive++;
    }
  });

  socket.on('disconnect', function() {
    console.log(players[socket.id].name + ' disconnected');
    if (players[socket.id].alive) {
      status.playersAlive--;
    }
    removePlayer(socket.id);
  });

  socket.on('dir', function(dir) {
    players[socket.id].direction = dir.dir;
  })

  socket.on('requestFire', function(mouse) {
    if (players[socket.id].selectedItem()) {
      if (players[socket.id].selectedItem().magSize && players[socket.id].sinceLastShot > players[socket.id].selectedItem().fireCooldown) { //if holding a weapon and the fire rate is under control
        players[socket.id].fire();
        players[socket.id].sinceLastShot = 0;
      }
      if (players[socket.id].selectedItem().health !== undefined) { //holding a consumable
        players[socket.id].usingConsumable = true;
      }
    }
  });

  socket.on('pressedKey', function(key) {
    key = Number.isInteger(key.key) ? key.key : key.key.toUpperCase();
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
    key = key.key.toUpperCase();
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

//main server method
setInterval(function() {
  if (status.timeToRound < 0) { //round is active
    for (id of ids) {
      let player = players[id];
      if (player.alive) { //update each living player
        player.update();
      }
    }
    for (bullet of bullets) { //each bullet update
      bullet.update();
    }
    checkCollisionsWithStructures();
    if (status.playersAlive < 2) { //we have a winner
      for (id of ids) {
        let player = players[id];
        if (player.alive) {
          status.lastWinner = player.name; //get the last living player
        }
      }
      resetRound();
    }
  } else { //lobby mode
    if (status.names.length > 1) { //if there are enough players for a game to be played
      status.timeToRound--;
    } else {
      status.timeToRound = status.beforeGameTimer * status.tickrate;
    }
  }
  io.emit('data', JSON.stringify({
    status: status,
    players: players,
    ids: ids,
    world: world,
    bullets: bullets
  })); //sending all the data
}, 1000 / status.tickrate); //updates at the tickrate