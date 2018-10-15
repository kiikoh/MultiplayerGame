let hud;
const socket = io();
let ready = false;
let myID;
let images = {};
let width,
  height;
let selected = 1;
let name = '';
let namePicked = false;
let canvas, input, source;
let github;

socket.on('connect', function() {
  socket.on('id', function(socketId) {
    myID = socketId.sockId;
    console.log(myID);
  });
  socket.on('data', function(data) {
    data = JSON.parse(data);
    if (ready) { //p5 has loaded
      hud.player = data.players[myID];
      hud.status = data.status;
      if (!namePicked) { //if server has no player name // MENU Screen
        background(170, 50, 50);
        textAlign(CENTER, CENTER);
        fill(240);
        strokeWeight(5);
        stroke(30);
        textSize(96);
        text('Welcome to CHS Royale', width / 2, height / 8);
        textAlign(LEFT, BASELINE);
        input.position(width / 2 - input.width / 2, height / 2 - input.height / 2);
        source.position(width - source.width - 20, height - source.height - 20);
      } else {
        noCursor();
        drawAllFromServer(data);
      }
    }
  });
});

function preload() {
  let path = 'client/images/'
  // github = loadImage(path + 'github.png');
  images.AR = loadImage(path + 'ar.png');
  images.SMG = loadImage(path + 'smg.png');
  images.Pistol = loadImage(path + 'pistol.png');
  images.Rocket = loadImage(path + 'rocket.png');
  images.Medkit = loadImage(path + 'medkit.png');
  images.Shield = loadImage(path + 'shield.png');
  images.Chug = loadImage(path + 'chug.png');
}

function toColor(obj) {
  return color(obj.r, obj.g, obj.b);
}

function drawAllFromServer(data) {
  //draw grass
  background(25, 175, 25);
  // draw players
  push();
  translate(width / 2, height / 2);
  scale(.8);
  translate(-data.players[myID].x, -data.players[myID].y);
  for (id of data.ids) {
    if (data.players[id].alive) {
      strokeWeight(1);
      fill(toColor(data.players[id].topColor));
      ellipse(data.players[id].x, data.players[id].y, data.players[id].size);
      fill(toColor(data.players[id].bottomColor));
      angleMode(DEGREES);
      arc(data.players[id].x, data.players[id].y, data.players[id].size, data.players[id].size, data.players[id].direction + 90, data.players[id].direction - 90);
    } else if (id === myID) {
      textAlign(CENTER);
      fill(255);
      text('Waiting for next game...', data.players[id].x, data.players[id].y);
      textAlign(LEFT);
      // location.reload();
    }
  }
  //draw items
  for (item of data.world.items) {
    if (item) {
      strokeWeight(1);
      fill(toColor(item.item));
      ellipse(item.x, item.y, data.world.itemSize);
      let size = 2.25 * sqrt(data.world.itemSize);
      image(images[item.item.name], item.x - size, item.y - size, 2 * size, 2 * size);
    }
  }
  for (structure of data.world.structures) {
    if (structure.health > 0) {
      if (structure.type.includes('Wall')) { //is a wall object
        fill(toColor(structure));
        line(structure.x, structure.y, structure.x + structure.width, structure.y + structure.height);
      } else {
        fill(toColor(structure));
        ellipse(structure.x, structure.y, structure.width, structure.height);
      }
    }
  }

  for (bullet of data.bullets) {
    fill(toColor(bullet.weaponType));
    ellipse(bullet.x, bullet.y, bullet.size, bullet.size);
  }
  noFill();
  strokeWeight(5);
  stroke(170, 0, 0);
  rect(0, 0, data.world.width, data.world.height);
  pop();
  hud.show();
  //draw loading
  textAlign(CENTER, CENTER);
  if (ceil(data.status.timeToRound / data.status.tickrate) > 0 && ceil(data.status.timeToRound / data.status.tickrate) < data.status.beforeGameTimer) {
    textSize(192);
    text(ceil(data.status.timeToRound / data.status.tickrate), width / 2, height / 2);
  } else if (ceil(data.status.timeToRound / data.status.tickrate) === data.status.beforeGameTimer) {
    textSize(48);
    text('Waiting for more players to join the game...', width / 2, height / 2);
  }
  textAlign(LEFT, BASELINE);
  if (mouseIsPressed) {
    socket.emit('requestFire', {
      key: mouseButton
    });
  }
  let dir = atan2(mouseY - height / 2, mouseX - width / 2);
  socket.emit('dir', {
    dir: dir
  });
}

function setup() {
  ready = true;
  width = windowWidth;
  height = windowHeight;
  hud = new HUD();
  canvas = createCanvas(width, height);
  input = createInput().size(600, 75);
  input.attribute('placeholder', 'Enter your name.');
  input.attribute('autofocus', 'true');
  input.style('font-size', '70px');
  input.style('border-radius', '37px');
  input.style('text-align', 'center');
  input.style('border', '2px solid grey');
  source = createImg('client/images/' + 'github.png');
  source.attribute('onClick', 'javascript:window.location.href = \'https://github.com/kiikoh/MultiplayerGame\'');
  source.size(150, 150);
}

function mouseWheel(event) {
  if (event.delta < 0) { //weapon slot down
    selected--;
    if (selected < 1)
      selected = 5;
    socket.emit('pressedKey', {
      key: selected
    });
  } else { //weapon slot up
    selected++;
    if (selected > 5)
      selected = 1;
    socket.emit('pressedKey', {
      key: selected
    });
  }
}

let holdingShift = false;

function keyPressed() {
  if (namePicked) { //if user has picked a name
    if (0 < key && key < 6) {
      selected = key;
    }
    socket.emit('pressedKey', {
      key: key
    });
  } else {
    if (keyCode === 13) {
      name = input.value();
      socket.emit('join', {
        name: name
      });
      input.remove();
      source.remove();
      namePicked = true;
    }
  }
}

function mouseReleased() {
  if (mouseY > height - hud.invBarSize / 5 && mouseX > width - hud.invBarSize) {
    selected = width + mouseX - hud.invBarSize;
    selected = floor(selected / (hud.invBarSize / 5));
    selected -= 19;
    socket.emit('pressedKey', {
      key: selected
    });
  }
}

function keyReleased() {
  if (keyCode === 16) {
    holdingShift = false;
  }
  socket.emit('releasedKey', {
    key: key
  });

}