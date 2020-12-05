import Player from "./player.js";
import TILES from "./tile-mapping.js";
import ITEMS from "./findable_item.js";
import TilemapVisibility from "./tilemap-visibility.js";

/**
 * Scene that generates a new dungeon
 */
export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super();
    this.level = 0;
  }

  preload() {
    this.load.image("tiles", "./assets/tilesets/lab.png");
    this.load.spritesheet(
      "characters",
      "./assets/spritesheets/buch-characters-64px-extruded.png",
      {
        frameWidth: 64,
        frameHeight: 64,
        margin: 1,
        spacing: 2
      }
    );
    this.load.image("bandage", "./assets/spritesheets/bandage.png");
    this.load.image("battery", "./assets/spritesheets/battery.png");
    this.load.image("bible", "./assets/spritesheets/bible.png");
    this.load.image("blood bag", "./assets/spritesheets/blood_bag.png");
    this.load.image("detonator", "./assets/spritesheets/detonator.png");
    this.load.image("dice", "./assets/spritesheets/dice.png");
    this.load.image("dollar", "./assets/spritesheets/dollar.png");
    this.load.image("game", "./assets/spritesheets/game.png");
    this.load.image("hourglass", "./assets/spritesheets/hourglass.png");
    this.load.image("magic 8 ball", "./assets/spritesheets/magic_8_ball.png");
    this.load.image("magnet", "./assets/spritesheets/magnet.png");
    this.load.image("medicine", "./assets/spritesheets/medicine.png");
    this.load.image("phd", "./assets/spritesheets/phd.png");
    this.load.image("rainbow baby", "./assets/spritesheets/rainbow_baby.png");
    this.load.image("slot", "./assets/spritesheets/slot.png");
    this.load.image("book", "./assets/spritesheets/telepathy_for_dummies.png");
    this.load.image("tnt", "./assets/spritesheets/tnt.png");
    this.load.image("arrow", "./assets/spritesheets/arrow.png");
    this.load.image("potion", "./assets/spritesheets/potion.png");
  }

  create() {
    this.level++;
    this.hasPlayerReachedFinish = false;
    this.itemCompleted = false;
    this.gameOver = false;

    this.screenText = "Find ";
    this.itemsToFind = [];
    var random = this.generateRan(5); //generates 5 different numbers to make sure the items are different
    console.log(random);
    for(var i = 0; i < 5; i++){
      this.itemsToFind.push({name: ITEMS[random[i]], found: false});
      this.screenText += this.itemsToFind[i].name + " \n";
    }

    this.item_group = this.physics.add.group();
    this.powerup_group = this.physics.add.group();

    this.screenText += "Current Level: " + this.level;

    // Generate a random world with a few extra options:
    //  - Rooms should only have odd number dimensions so that they have a center tile.
    //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
    //    either side of the door location
    this.dungeon = new Dungeon({
      width: 50,
      height: 50,
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true }
      }
    });

    this.dungeon.drawToConsole();

    // Creating a blank tilemap with dimensions matching the dungeon
    const map = this.make.tilemap({
      tileWidth: 32,
      tileHeight: 32,
      width: this.dungeon.width,
      height: this.dungeon.height
    });
    const tileset = map.addTilesetImage("tiles", null, 32, 32, 0, 0); // 1px margin, 2px spacing
    this.floorLayer = map.createBlankDynamicLayer("Floor", tileset).fill(TILES.BLANK);
    this.groundLayer = map.createBlankDynamicLayer("Ground", tileset);
    this.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);
    const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);

    this.tilemapVisibility = new TilemapVisibility(shadowLayer);

    // Use the array of rooms generated to place tiles in the map
    // Note: using an arrow function here so that "this" still refers to our scene
    this.dungeon.rooms.forEach(room => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor with mostly clean tiles, but occasionally place a dirty tile
      // See "Weighted Randomize" example for more information on how to use weightedRandomize.
      this.floorLayer.fill(TILES.FLOOR, x + 1, y + 1, width - 2, height - 2);

      // Place the room corners tiles
      this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      this.floorLayer.putTileAt(TILES.FLOOR, left, top);
      this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      this.floorLayer.putTileAt(TILES.FLOOR, right, top);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      this.floorLayer.putTileAt(TILES.FLOOR, right, bottom);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);
      this.floorLayer.putTileAt(TILES.FLOOR, left, bottom);

      this.groundLayer.fill(TILES.WALL.TOP, left + 1, top, width - 2, 1);
      this.floorLayer.fill(TILES.FLOOR, left + 1, top, width - 2, 1);
      this.groundLayer.fill(TILES.WALL.BOTTOM, left + 1, bottom, width - 2, 1);
      this.floorLayer.fill(TILES.FLOOR, left + 1, bottom, width - 2, 1);
      this.groundLayer.fill(TILES.WALL.LEFT, left, top + 1, 1, height - 2);
      this.floorLayer.fill(TILES.FLOOR, left, top + 1, 1, height - 2);
      this.groundLayer.fill(TILES.WALL.RIGHT, right, top + 1, 1, height - 2);
      this.floorLayer.fill(TILES.FLOOR, right, top + 1, 1, height - 2);

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location. Each direction has a different door to tile mapping.
      var doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
      for (var i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].y === room.height - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].x === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
        } else if (doors[i].x === room.width - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
        }
      }
    });

    // Separate out the rooms into:
    //  - The starting room (index = 0)
    //  - A random room to be designated as the end room (with stairs and nothing else)
    //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
    const rooms = this.dungeon.rooms.slice();
    const startRoom = rooms.shift();
    const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    const itemRooms = [5];
    for(var k = 0; k < 5; k++){
      itemRooms[k] = Phaser.Utils.Array.RemoveRandomElement(rooms);
    }
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);

    // Place the stairs
    this.stuffLayer.putTileAt(TILES.FINISH, endRoom.centerX, endRoom.centerY);
    //this.stuffLayer.putTileAt(TILES.SPECIAL_POT, itemRoom.centerX, itemRoom.centerY);
    for(var n = 0; n < 5; n++){
      var item = this.item_group.create(map.tileToWorldX(itemRooms[n].centerX), map.tileToWorldY(itemRooms[n].centerY), this.itemsToFind[n].name);
      item.visible = false;
      item.found = false;
    }

    // Place stuff in the 90% "otherRooms"
    otherRooms.forEach(room => {
      var rand = Math.random();
      if (rand <= 0.25) {
        // 25% chance of chest
        this.stuffLayer.putTilesAt(TILES.CHEST, room.centerX, room.centerY);
      } else if (rand <= 0.5) {
        // 50% chance of a sack anywhere in the room... except don't block a door!
        const x = Phaser.Math.Between(room.left + 2, room.right - 2);
        const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
        this.stuffLayer.putTileAt(TILES.SACKS, x, y);
      } else {
        // 25% of either 2 or 4 bookcases, depending on the room size
        if (room.height >= 9) {
          this.stuffLayer.putTilesAt(TILES.BOOKCASE, room.centerX - 1, room.centerY + 1);
          this.stuffLayer.putTilesAt(TILES.BOOKCASE, room.centerX + 1, room.centerY + 1);
          this.stuffLayer.putTilesAt(TILES.BOOKCASE, room.centerX - 1, room.centerY - 2);
          this.stuffLayer.putTilesAt(TILES.BOOKCASE, room.centerX + 1, room.centerY - 2);
        } else {
          this.stuffLayer.putTilesAt(TILES.BOOKCASE, room.centerX - 1, room.centerY - 1);
          this.stuffLayer.putTilesAt(TILES.BOOKCASE, room.centerX + 1, room.centerY - 1);
        }
      }
      if(rand <= 0.2){
          var pu = this.powerup_group.create(map.tileToWorldX(room.centerX), map.tileToWorldY(room.centerY), 'potion');
          pu.visible = false;
          pu.found = false;
          //console.log(1);
      }
    });

    // Not exactly correct for the tileset since there are more possible floor tiles, but this will
    // do for the example.
    this.floorLayer.setCollisionByExclusion([-1, 70, 117, 115, 147, 149]);
    this.groundLayer.setCollisionByExclusion([-1, 70, 117, 115, 147, 149]);
    this.stuffLayer.setCollisionByExclusion([-1, 70, 117, 115, 147, 149]);

    // Place the player in the first room
    const playerRoom = startRoom;
    const x = map.tileToWorldX(playerRoom.centerX);
    const y = map.tileToWorldY(playerRoom.centerY);
    this.player = new Player(this, x, y);

    // Watch the player and tilemap layers for collisions, for the duration of the scene:
    this.physics.add.collider(this.player.sprite, this.groundLayer);
    this.physics.add.collider(this.player.sprite, this.stuffLayer);
    this.physics.add.overlap(this.player.sprite, this.item_group, this.collectItem, null, this);
    this.physics.add.overlap(this.player.sprite, this.powerup_group, this.collectPowerUp, null, this);

    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.cameras.main;

    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.player.sprite);

    // Help text that has a "fixed" position on the screen
    this.text = this.add.text(16, 16, this.screenText, {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);

    this.initialTime = 35 - (this.level * 5);
    this.countdown = this.add.text(600, 16, 'Countdown: ' + this.formatTime(this.initialTime), {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);
    this.timedEvent = this.time.addEvent({ delay: 1000, callback: this.onEvent, callbackScope: this, loop: true });
  }

  update(time, delta) {
    if(this.initialTime <= 0){
      this.add.text(this.cameras.main.centerX - 40, this.cameras.main.centerY - 20, 'GAME OVER', {  
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff" }).setScrollFactor(0);
      this.physics.pause();
      this.player.giveTint(0xff0000);
      this.gameOver = true;
    }
    else if(this.itemCompleted){
      this.screenText = `Find the computer. Current Level: ${this.level}`;
      this.stuffLayer.setTileIndexCallback(TILES.FINISH, () => {
        this.stuffLayer.setTileIndexCallback(TILES.FINISH, null);
        if(this.level == 6){
          this.add.text(this.cameras.main.centerX - 40, this.cameras.main.centerY - 20, 'YOU WON!', {  
            font: "18px monospace",
            fill: "#000000",
            padding: { x: 20, y: 10 },
            backgroundColor: "#ffffff" }).setScrollFactor(0);
          this.physics.pause();
          this.player.giveTint(0x00ff00);
          this.gameOver = true;
        }
        else{
          this.hasPlayerReachedFinish = true;
          this.player.freeze();
          const cam = this.cameras.main;
          cam.fade(250, 0, 0, 0);
          cam.once("camerafadeoutcomplete", () => {
            this.player.destroy();
            this.scene.restart();
          });
        }
      });
    }
    else {
       this.screenText = "Find ";
       var control = true;
       this.item_group.getChildren().forEach(function(item){
          if(!item.found){
            this.screenText += item.texture.key + " \n";
            control = false;
          }
       }, this);
      this.screenText += "Current Level: " + this.level;
       if(control){
          this.itemCompleted = true;
       }
    }

    if (this.hasPlayerReachedFinish) return;

    if(this.gameOver) return;

    this.text.setText(this.screenText);

    this.player.update();

    // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room object
    const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
    const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);

    this.tilemapVisibility.setActiveRoom(playerRoom);

    this.visibility(this.item_group, playerRoom);
    this.visibility(this.powerup_group, playerRoom);
  }
  //remove the item from the screen and mark it as found
  collectItem(player, item){
      item.disableBody(true, true);
      item.found = true;

      this.initialTime += 5;
  }

  collectPowerUp(player, powerup){
    powerup.disableBody(true,true);
    powerup.found = true;

    var rand = Math.random();

    if(rand < 0.5){
      this.showDirection();
    }
    else{
      this.player.increaseSpeed(600);
      this.player.giveTint(0x0000ff);
      this.timedEvent = this.time.addEvent({ delay: 4000, callback: this.speedDown, callbackScope: this, loop: false });
    }
  }

  formatTime(seconds){
      var minutes = Math.floor(seconds/60);
      var partInSeconds = seconds%60;
      partInSeconds = partInSeconds.toString().padStart(2,'0');
      return `${minutes}:${partInSeconds}`;
  }

  onEvent () {
    if(!this.gameOver){
      if(this.initialTime <= 0){
        this.initialTime = 0;
      }
      else{
      this.initialTime -= 1; // One second
      }
      this.countdown.setText('Countdown: ' + this.formatTime(this.initialTime));
    }
  }

  generateRan(length){
      var max = ITEMS.length;
      var random = [];
      for(var i = 0; i < length; i++){
          var temp = Math.floor(Math.random() * max);
          if(random.indexOf(temp) == -1){
              random.push(temp);
          }
          else
           i--;
      }
      return random;
  }

  showDirection(){
    var distance = 1000;
    var closest;

    this.item_group.getChildren().forEach(function(item){
        if(!item.found){
          var temp = Phaser.Math.Distance.Between(item.x, item.y, this.player.sprite.x, this.player.sprite.y);

          if(temp < distance){
            distance = temp;
            closest = item;
          }
        }
    },this);

    console.log(closest);
    this.arrow = this.add.image(this.player.sprite.x, this.player.sprite.y + 10, 'arrow');
    var angle = Phaser.Math.Angle.Between(closest.x, closest.y, this.player.sprite.x, this.player.sprite.y);
    this.arrow.rotation = angle - Math.PI;

    this.timedEvent = this.time.addEvent({ delay: 4000, callback: this.fadeArrow, callbackScope: this, loop: false });  
  }

  fadeArrow(){
    this.arrow.visible = false;
  }

  visibility(group, playerRoom){
    group.getChildren().forEach(function(element){
        //first check if the element has been already found, if not- only show the element if the player is in the same room
          if(!element.found){
            const x =  this.groundLayer.worldToTileX(element.x);;
            const y = this.groundLayer.worldToTileY(element.y);
            const room = this.dungeon.getRoomAt(x,y);

            if(room == playerRoom){
              element.visible = true;
            }
            else{
              element.visible = false;
            }
          }
    }, this);  
  }

  speedDown(){
    this.player.descreaseSpeed(600);
    this.player.removeTint();
  }
}

