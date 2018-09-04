const fs = require('fs');
const Structure = require('./structure');
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
      "consumables": ['medkit', 'medkit', 'shield', 'shield', 'chug'],
      "tiers": ["common", "common", "common", "common", "common", "uncommon", "uncommon", "uncommon", "uncommon", "rare", "rare", "rare", "epic", "epic", "legendary"]
    }

    this.generateItem = function() {
      let group = Math.random() > 0.25 ? 'weapons' : 'consumables'; // 25% of items are consumables
      let itemName = this.lootTable[group][random(this.lootTable[group].length)];
      let tier = itemsList.tiers[this.lootTable.tiers[random(this.lootTable.tiers.length)]];
      let item = JSON.parse(JSON.stringify(itemsList[group][itemName]));
      if (group === 'weapons') {
        for (var property in tier) {
          if (tier.hasOwnProperty(property)) { //multiply the two values
            item[property] *= tier[property];
          }
        }
      }
      return item; //Copies the object's  values, not the pointer
    }

    for (var i = 0; i < this.items.length; i++) {
      this.items[i] = {
        x: random(width),
        y: random(height),
        item: this.generateItem()
      };
    }

    for (let i = 0; i < 10; i++) {
      let type = JSON.parse(JSON.stringify(itemsList.structures[Math.random() > 0.25 ? 'barrel' : 'bush']));
      this.structures.push(new Structure(random(width), random(height), type));
    }

  }