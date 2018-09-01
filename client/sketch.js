let hud;
let itemsList;
const socket = io();
let ready = false;
let myID;
let selected = 0;
let images = {};
let width,
  height;

socket.on('connect', function() {
  socket.on('id', function(socketId) {
    myID = socketId.sockId;
    console.log(myID);
  });
  socket.on('data', function(data) {
    drawAllFromServer(data);
  });
});

function preload() {
  let path = 'client/images/'
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
  if (ready) { //p5 has loaded
    hud.player = data.players[myID];
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
        if (id === myID)
          arc(data.players[id].x, data.players[id].y, data.players[id].size, data.players[id].size, atan2(mouseY - height / 2, mouseX - width / 2) + 90, atan2(mouseY - height / 2, mouseX - width / 2) - 90);
        else
          arc(data.players[id].x, data.players[id].y, data.players[id].size, data.players[id].size, 0, -180);
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
    if (ceil(data.status.timeToRound / data.status.tickrate) > 0 && ceil(data.status.timeToRound / data.status.tickrate) <= data.status.beforeGameTimer) {
      textSize(192);
      text(ceil(data.status.timeToRound / data.status.tickrate), width / 2, height / 2);
    } else if (ceil(data.status.timeToRound / data.status.tickrate) === data.status.beforeGameTimer) {
      textSize(48);
      text('Waiting for more players to join the game...', width / 2, height / 2);
    }
    textAlign(LEFT, BASELINE);
    if (mouseIsPressed)
      socket.emit('requestFire', { dir: atan2(mouseY - height / 2, mouseX - width / 2), key: mouseButton });
  }
}

function setup() {
  noCursor();
  ready = true;
  width = windowWidth;
  height = windowHeight;
  hud = new HUD();
  createCanvas(width, height);
}

function keyPressed() {
  socket.emit('pressedKey', { key: key });
}

function keyReleased() {
  socket.emit('releasedKey', { key: key });

}