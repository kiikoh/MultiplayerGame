function Player(x, y) {
  this.x = x;
  this.y = y;
  this.size = 75;
  this.topColor = color(244, 158, 66)
  this.bottomColor = color(35)
  this.speed = 5;
  this.direction = 90;

  this.health;
  this.shield;
  this.invSpace = 5;
  this.selected = 0; //an index of this.items
  this.items = Array(this.invSpace);
  this.ammo = {
    ar: 0,
    pistol: 0,
    smg: 0,
    explosive: 0
  };

  this.show = function() {
    strokeWeight(1);
    fill(this.topColor);
    ellipse(this.x, this.y, this.size);
    fill(this.bottomColor);
    angleMode(DEGREES);
    this.direction = atan2((mouseY - this.y), (mouseX - this.x));
    arc(this.x, this.y, this.size, this.size, this.direction + 90, this.direction - 90);
    // text(this.getNearbyItem().ammoType, 50, 50)
  }

  this.getNearbyItem = function() {
    for (var i = 0; i < world.items.length; i++) {
      if (dist(world.items[i].x, world.items[i].y, this.x, this.y) < this.size / 2 + world.itemSize / 2) {
        return world.items[i].item;
      }
    }
    return null;
  }

  this.color = function(top, bottom) {
    this.topColor = top;
    this.bottomColor = bottom;
  }

  this.selectedItem = function() {
    return this.items[this.selected];
  }

  this.pickUpItem = function() {
    let item = this.getNearbyItem();
    if (item) {
      if (0 < this.invSpace) {
        this.items[this.items.length - this.invSpace] = item;
        this.invSpace--;
      } else {
        this.dropItemIndex(this.selected);
        this.invSpace++;
        this.pickUpItem();
      }
    }
  }

  this.dropItemIndex = function(index) {
    this.items[index] = null;
  }

  this.walk = function(keys) {
    if (keys[0]) {
      this.y -= this.speed;
    }
    if (keys[1]) {
      this.y += this.speed;
    }
    if (keys[2]) {
      this.x -= this.speed;
    }
    if (keys[3]) {
      this.x += this.speed;
    }
  }

}