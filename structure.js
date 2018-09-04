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

module.exports =
  function Structure(x, y, type) {
    this.x = x;
    this.y = y;
    this.health = type.health;
    this.width = type.width;
    this.height = type.height;
    this.type = type.type;
    this.r = type.r;
    this.g = type.g;
    this.b = type.b;


    this.collidingWith = function(x, y, r) {
      if (type.type === 'barrel') {
        let myR = this.width / 2;
        return ((myR + r) > dist(x, y, this.x, this.y));
      }
    }
  }