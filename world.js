const fs = require('fs');
let itemsList = JSON.parse(fs.readFileSync('items.json', 'utf8'));

function random(highest) {
  return Math.floor(highest * Math.random());
}

module.exports =
  function World(width, height, items) {
    this.width = width;
    this.height = height;
    this.items = new Array(items);
    this.itemSize = 40;
    this.structures = [];

    this.lootTable = {
      "weapons": ['ar', 'rocket', 'pistol', 'pistol', 'pistol', 'smg', 'smg', 'smg'],
      "consumables": ['medkit', 'medkit', 'shield', 'shield', 'chug']
    }

    this.generateItem = function() {
      let group = Math.random() > 0.25 ? 'weapons' : 'consumables'; // 25% of items are consumables
      let itemName = group === 'weapons' ? this.lootTable.weapons[random(this.lootTable.weapons.length)] : this.lootTable.consumables[random(this.lootTable.consumables.length)];
      return JSON.parse(JSON.stringify(itemsList[group][itemName])); //Copies the object's  values, not the pointer
    }

    for (var i = 0; i < this.items.length; i++) {
      this.items[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        item: this.generateItem()
      };
    }

  }