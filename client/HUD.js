function HUD() {
  this.player = null;
  this.invBarSize = width / 3;

  this.show = function() {
    //Inv bar
    if (this.player) {
      strokeWeight(4);
      for (let i = 0; i < this.player.items.length; i++) {
        if (this.player.items[i]) {
          fill(toColor(this.player.items[i]));
        } else {
          fill(200);
        }
        rect(width - this.invBarSize + i * this.invBarSize / 5, height - this.invBarSize / 5, this.invBarSize / 5, this.invBarSize / 5);
        if (this.player.items[i])
          image(images[this.player.items[i].name], width - this.invBarSize + i * this.invBarSize / 5 + 7, height - this.invBarSize / 5 + 7, this.invBarSize / 5 - 14, this.invBarSize / 5 - 14)
        fill(230);
        strokeWeight(2.5);
        textSize(24);
        if (this.player.items[i]) { //only for weapons
          if (this.player.items[i].loaded !== undefined) {
            text(this.player.items[i].loaded + '/' + this.player.items[i].magSize, 10 + width - this.invBarSize + i * this.invBarSize / 5, height - 10);
          } else if (this.player.items[i].name) {
            text(this.player.items[i].name, 10 + width - this.invBarSize + i * this.invBarSize / 5, height - 10);
          }
        }
        strokeWeight(4);
        fill(255);
        text(i + 1, 6 + width - this.invBarSize + i * this.invBarSize / 5, height - this.invBarSize / 5 + 22);
      }
      noFill();
      stroke(140);
      rect(width - this.invBarSize + this.player.selected * this.invBarSize / 5, height - this.invBarSize / 5, this.invBarSize / 5, this.invBarSize / 5);
      stroke(0);
      // framerate
      // fill(255);
      // text('FPS : ' + Math.floor(frameRate()), 10, 25);
      //healthbars
      strokeWeight(2);
      fill(0);
      rect(width / 2 - 100, height - 50, 200, 25);
      rect(width / 2 - 100, height - 80, 200, 25);
      fill(0, 0, 130);
      rect(width / 2 - 100, height - 80, 2 * this.player.shield, 25);
      fill(0, 175, 0);
      rect(width / 2 - 100, height - 50, 2 * this.player.health, 25);
      fill(255);
      textSize(20);
      text(this.player.health, width / 2 - 90, height - 30);
      text(this.player.shield, width / 2 - 90, height - 60);
      //reload indicator
      noFill();
      stroke(255);
      strokeWeight(4);
      if (this.player.sinceReload !== 0) {
        arc(mouseX, mouseY, 50, 50, 0, map(this.player.sinceReload / this.player.items[this.player.selected].reloadTime, 0, 1, 0, 360));
      } else if (this.player.sinceUse !== 0 && this.player.items[this.player.selected]) {
        arc(mouseX, mouseY, 50, 50, 0, map(this.player.sinceUse / this.player.items[this.player.selected].useTime, 0, 1, 0, 360));
      }
      //crosshair
      stroke(0, 199, 255);
      line(mouseX - 15, mouseY, mouseX - 5, mouseY);
      line(mouseX + 15, mouseY, mouseX + 5, mouseY);
      line(mouseX, mouseY + 15, mouseX, mouseY + 5);
      line(mouseX, mouseY - 15, mouseX, mouseY - 5);
      stroke(0);
      //kill counter
      textSize(24);
      fill(255);
      text('Kills: ' + this.player.kills.length, width - 75, height - 12 - this.invBarSize / 5);
    }
  }
}