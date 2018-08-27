module.exports =
  function Bullet(x, y, dir, id, weapon) {
    this.shooter = id;
    this.weaponType = weapon;
    this.size = 5;
    this.x = x;
    this.y = y;
    this.direction = dir + map((Math.random() - .5), -.5, .5, -7 / this.weaponType.accuracy, 7 / this.weaponType.accuracy);
    this.bulletSpeed = this.weaponType.bulletSpeed;
    this.age = 0;

    this.update = function() {
      if (this.x > 0 || this.x < width || this.y > 0 || this.y < height) {
        this.y += this.bulletSpeed * Math.sin(this.direction * Math.PI / 180);
        this.x += this.bulletSpeed * Math.cos(this.direction * Math.PI / 180);
      }
      this.age++;
      if (this.age > 150) {
        module.exports.bullets.splice(0, 1);
      }
    }

    this.getDamage = function() {
      return this.weaponType.damage;
    }
  }