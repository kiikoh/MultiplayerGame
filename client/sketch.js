let hud;
let itemsList;
const socket = io();
let ready = false;
let myID;
let selected = 0;

socket.on('connect', function() {
  socket.on('id', function(socketId) {
    myID = socketId.sockId;
    console.log(myID);
    hud = new HUD();
  });
  socket.on('data', function(data) {
    hud.player = data.players[myID];
    drawAllFromServer(data);
  });
});

function toColor(obj) {
  return color(obj.r, obj.g, obj.b);
}

function drawAllFromServer(data) {
  if (ready) { //p5 has loaded
    //draw grass
    background(25, 175, 25);
    // draw players
    push();
    translate(width / 2, height / 2);
    translate(-data.players[myID].x, -data.players[myID].y);
    for (id of data.ids) {
      strokeWeight(1);
      fill(toColor(data.players[id].topColor));
      ellipse(data.players[id].x, data.players[id].y, data.players[id].size);
      fill(toColor(data.players[id].bottomColor));
      angleMode(DEGREES);
      if (id === myID)
        arc(data.players[id].x, data.players[id].y, data.players[id].size, data.players[id].size, atan2(mouseY - height / 2, mouseX - width / 2) + 90, atan2(mouseY - height / 2, mouseX - width / 2) - 90);
      else
        arc(data.players[id].x, data.players[id].y, data.players[id].size, data.players[id].size, 0, -180);
    }
    //draw items
    for (item of data.world.items) {
      if (item) {
        strokeWeight(1);
        fill(toColor(item.item));
        ellipse(item.x, item.y, data.world.itemSize);
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
    if (mouseIsPressed)
      socket.emit('requestFire', { dir: atan2(mouseY - height / 2, mouseX - width / 2), key: mouseButton });
  }
}

function preload() {
  // itemsList = loadJSON('client/items.json');
}

function setup() {
  noCursor();
  ready = true;
  createCanvas(1280, 720);
  // world = new World(width, height, 10);
}

function keyPressed() {
  socket.emit('pressedKey', { key: key });
}

function keyReleased() {
  socket.emit('releasedKey', { key: key });

}