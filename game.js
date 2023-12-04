let player;
let arrows;
let slimes;
let demons;
let docs;
let zombies; 
let keys; // stores key objects for input and movement control
let lastDir = 'down'; // stores the last direction the player was facing
let healthBar;
let scoreText;

// Dimensions of game map, must be a multiple of 32 (tile size)
const mapWidth = 1920
const mapHeight = 1920

// arrow cool down variables
let lastShotTime = 0;
let shotCooldown = 250;
let arrowDamage = 50;

let maxEnemies = 30;
let currentEnemies = 0;

let score = 0;
let scoreDiv = 0;

let gameMusic;

function preload() {

    this.load.spritesheet('player-running', './assets/player_sprite_sheet.png', { frameWidth: 16, frameHeight: 32 });
    this.load.spritesheet('grass-tiles', './assets/grass_tiles.png', {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.image('arrow', './assets/weapon_arrow.png')
    this.load.spritesheet('slime', './assets/slime_move.png',{ frameWidth: 16, frameHeight: 18 })
    this.load.spritesheet('demon', './assets/demon_sheet.png', { frameWidth: 32, frameHeight: 36 })
    this.load.spritesheet('doc', './assets/doc_sheet.png', { frameWidth: 16, frameHeight: 23 })
    this.load.spritesheet('zombie', './assets/zombie_sheet.png', { frameWidth: 32, frameHeight: 28 })
    this.load.audio('gamebg', './assets/game.mp3')
}

function create() {

    // Create the tilemap floor
    createTilemapFloor.call(this, mapWidth, mapHeight, 'grass-tiles');

    gameMusic = this.sound.add('gamebg', { loop: true, volume: 0.025 });
    gameMusic.play()

    // Set the world bounds to match the floor size
    this.physics.world.bounds.width = mapWidth;
    this.physics.world.bounds.height = mapHeight;

    
    // The coordinates (400, 300) place the player sprite in the middle of the screen
    player = this.physics.add.sprite(mapWidth/2, mapHeight/2, 'player-running', 1);
    player.setScale(3);

    // make hitbox smaller than sprite size and center the hitbox on the sprite
    const hitboxWidth = player.width * 0.75;
    const hitboxHeight = player.height * 0.5;
    player.body.setSize(hitboxWidth, hitboxHeight);
    player.body.setOffset((player.width - hitboxWidth) / 2, (player.height - hitboxHeight) / 1.15);

    // Make sure the player doesn't move out of the world bounds
    player.setCollideWorldBounds(true);

    player.health = 100;  // starting health
    player.isImmune = false;  // Flag to indicate if player is currently immune
    player.immunityDuration = 400; // lenght of time player is immune after taking damage

    // Create a graphics object for the health bar
    healthBar = this.add.graphics();
    scoreText = this.add.text(0, 0, `Score: ${score}`, { font: 'bold 16px Arial', fill: '#ffffff' })
    updateHealthBar(this);
    updateScore(this)

    // Create key objects for movement controls
    keys = this.input.keyboard.addKeys({
        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'right': Phaser.Input.Keyboard.KeyCodes.D,
        'space': Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    if (!this.anims.exists('player-down')) {
        this.anims.create({
            key: 'player-down',
            frames: [
                { key: 'player-running', frame: 1 },
                { key: 'player-running', frame: 0 },
                { key: 'player-running', frame: 2 }
            ],
            frameRate: 10,
            repeat: -1
        });

        // player running up animation
        this.anims.create({
            key: 'player-up',
            frames: [
                { key: 'player-running', frame: 4 },
                { key: 'player-running', frame: 3 },
                { key: 'player-running', frame: 5 }
            ],
            frameRate: 10,
            repeat: -1
        });

        // player running left animation
        this.anims.create({
            key: 'player-left',
            frames: [
                { key: 'player-running', frame: 7 },
                { key: 'player-running', frame: 6 },
                { key: 'player-running', frame: 8 }
            ],
            frameRate: 10,
            repeat: -1
        });

        // player running down animation
        this.anims.create({
            key: 'player-right',
            frames: [
                { key: 'player-running', frame: 10 },
                { key: 'player-running', frame: 9 },
                { key: 'player-running', frame: 11 }
            ],
            frameRate: 10,
            repeat: -1
        });

        createSlimeAnim(this); // slime animations
        createDemonAnim(this); // Demon animations
        createDocAnim(this);   // Doc animations
        createZombieAnim(this); // Zombie animations
    
    }

    // Tell the camera to follow the player sprite
    this.cameras.main.startFollow(player);

    // Set the camera bounds to the size of the world (floor)
    //this.cameras.main.setBounds(0, 0,  mapWidth, mapHeight);



    // Create a group for arrows
    arrows = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        defaultKey: 'arrow'
    });

    //create a group for slimes
    slimes = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        defaultKey: 'slime',
    });

    //create a group for demons
    demons = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        defaultKey: 'demon',
    });

    //create a group for docs
    docs = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        defaultKey: 'doc',
    });

    //create a group for zombies
    zombies = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        defaultKey: 'zombie',
    });

    // Collision between arrows and slimes
    let scene = this;
    this.physics.add.overlap(arrows, slimes, function(arrow, slime) {
        arrow.setActive(false);
        arrow.setVisible(false);
        arrow.destroy(); //remove the arrow

        // Damage the slime or make it disappear
        mobTakeDamage(scene, slime, arrowDamage)
    });

    this.physics.add.overlap(arrows, demons, function(arrow, demon) {
        arrow.setActive(false);
        arrow.setVisible(false);
        arrow.destroy(); //remove the arrow

        // Damage the demon or make it disappear
        mobTakeDamage(scene, demon, arrowDamage)
    });

    this.physics.add.overlap(arrows, docs, function(arrow, doc) {
        arrow.setActive(false);
        arrow.setVisible(false);
        arrow.destroy(); //remove the arrow

        // Damage the demon or make it disappear
        mobTakeDamage(scene, doc, arrowDamage)
    });

    this.physics.add.overlap(arrows, zombies, function(arrow, zombie) {
        arrow.setActive(false);
        arrow.setVisible(false);
        arrow.destroy(); //remove the arrow

        // Damage the demon or make it disappear
        mobTakeDamage(scene, zombie, arrowDamage)
    });

    this.physics.add.collider(player, slimes, function() {
        playerTakeDamage(scene, 10);
    });

    this.physics.add.collider(player, demons, function() {
        playerTakeDamage(scene, 25);
    });

    this.physics.add.collider(player, docs, function() {
        playerTakeDamage(scene, 15);
    });

    this.physics.add.collider(player, zombies, function() {
        playerTakeDamage(scene, 70);
    });

}

function update() {
    
    player.setVelocity(0);

    if (keys.left.isDown) {
        player.setVelocityX(-160);
        if (player.body.velocity.y == 0) {
            player.anims.play('player-left', true);
        }
        lastDir = 'left';
    } else if (keys.right.isDown) {
        player.setVelocityX(160);
        if (player.body.velocity.y == 0) {
            player.anims.play('player-right', true);
        }
        lastDir = 'right';
    }

    if (keys.up.isDown) {
        player.setVelocityY(-160);
        if (player.body.velocity.x == 0) {
            player.anims.play('player-up', true);
        }
        lastDir = 'up';
    } else if (keys.down.isDown) {
        player.setVelocityY(160);
        if (player.body.velocity.x == 0) {
            player.anims.play('player-down', true);
        }
        lastDir = 'down';
    }

    // Stop animations if no keys are pressed
    if (!keys.left.isDown && !keys.right.isDown && !keys.up.isDown && !keys.down.isDown) {
        player.anims.stop();

        switch (lastDir) {
            case 'down':
                player.setFrame(1);
                break;
            case 'up':
                player.setFrame(4);
                break;
            case 'left':
                player.setFrame(7);
                break;
            case 'right':
                player.setFrame(10);
                break;
        }
        
    }

    if (keys.space.isDown) {
        shootArrow(this);
    }

    // trigger arrow update function
    arrows.children.each(function(arrow) {
        if (arrow.active) {
            arrow.update();
        }
    }, this);

    slimes.children.each(function(slime) {
        if (slime.active) {
            slime.update();
        }
    }, this);

    demons.children.each(function(demon) {
        if (demon.active) {
            demon.update();
        }
    }, this);

    docs.children.each(function(doc) {
        if (doc.active) {
            doc.update();
        }
    }, this);

    zombies.children.each(function(zombie) {
        if (zombie.active) {
            zombie.update();
        }
    }, this);

    updateHealthBar(this)
    updateScore(this)

    //generate enemy if there less than max
    if (currentEnemies < maxEnemies) {
        createRandomEnemy(this)
        currentEnemies++;
    }
}

function shootArrow(scene) {

    if (!player.active) return; // Check if the player is active

    // Check if enough time has passed since the last shot
    const time = scene.time.now;
    if (time - lastShotTime < shotCooldown) return; 
    

    let arrow = arrows.get(player.x, player.y, 'arrow');
    if (!arrow) return; // Return if no arrow available in pool

    arrow.setScale(1.5)

    arrow.setActive(true);
    arrow.setVisible(true);

    // Get the mouse pointer's position relative to the game world
    const worldPoint = scene.input.activePointer.positionToCamera(scene.cameras.main);

    angle = Phaser.Math.Angle.Between(player.x, player.y, worldPoint.x, worldPoint.y)
    arrow.setRotation(angle);

    // circle hit box
    arrow.body.setCircle(arrow.width * 0.2)

    // Base arrow speed
    const arrowBaseSpeed = 500;

    // Calculate velocity components based on angle
    let velocityX = arrowBaseSpeed * Math.cos(angle);
    let velocityY = arrowBaseSpeed * Math.sin(angle);

    // Add player's velocity to arrow's velocity
    velocityX += player.body.velocity.x;
    velocityY += player.body.velocity.y;

    // Set the arrow's velocity
    arrow.setVelocity(velocityX, velocityY);

    // Maximum lifespan for the arrow 
    arrow.lifespan = 2500; // milliseconds

    // Arrow update method to handle lifespan and boundary collision
    arrow.update = function() {
        this.lifespan -= scene.game.loop.delta;
        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
        }
    };  

    // Update the lastShotTime to the current time
    lastShotTime = time;
}


// Helper function to create floor
function createTilemapFloor(floorWidth, floorHeight, tilesKey) {
    const tileWidth = 32; // The width of each tile
    const tileHeight = 32; // The height of each tile

    // Calculate how many tiles we need to fill the floor
    const numTilesX = floorWidth / tileWidth;
    const numTilesY = floorHeight / tileHeight;

    // Create a blank tilemap
    let tilemap = this.make.tilemap({ tileWidth: tileWidth, tileHeight: tileHeight, width: numTilesX, height: numTilesY });

    // Add the tileset image to the map
    let tileset = tilemap.addTilesetImage(tilesKey);

    // Create a new empty layer
    let layer = tilemap.createBlankLayer('floorLayer', tileset, 0, 0, numTilesX, numTilesY);

    for (let x = 0; x < numTilesX; x++) {
        for (let y = 0; y < numTilesY; y++) {
            let randomTileIndex = Phaser.Math.Between(0, 31);
            tilemap.putTileAt(randomTileIndex, x, y, true, 'floorLayer');
        }
    }
}

function createSlimeAnim(scene) {
    scene.anims.create({
        key: 'slime-right',
        frames: [
            { key: 'slime', frame: 0 },
            { key: 'slime', frame: 1 },
            { key: 'slime', frame: 2 },
            { key: 'slime', frame: 3 },
            { key: 'slime', frame: 4 }
        ],
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'slime-left',
        frames: [
            { key: 'slime', frame: 9 },
            { key: 'slime', frame: 8 },
            { key: 'slime', frame: 7 },
            { key: 'slime', frame: 6 },
            { key: 'slime', frame: 5 }
        ],
        frameRate: 10,
        repeat: -1
    });
}

// create an enemy slime at coords x and y
function createSlime(x, y, speed) {
    
    let slime = slimes.get(x, y, 'slime');
    if (!slime) return; // Return if no arrow available in pool

    slime.setScale(2.5);
    slime.setActive(true);
    slime.setVisible(true);
    slime.health = 100;
    slime.setCollideWorldBounds(true);

    // make hitbox smaller than sprite size and center the hitbox on the sprite
    const hitboxWidth = slime.width * 0.8;
    const hitboxHeight = slime.height * 0.7;
    slime.body.setSize(hitboxWidth, hitboxHeight);
    slime.body.setOffset((slime.width - hitboxWidth) / 2, (slime.height - hitboxHeight) / 2);

    const slimeSpeed = speed; // Adjust as needed

    slime.update = function() {
        
        // Calculate the direction from the slime to the player
        let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        // Set the slime's velocity towards the player
        this.body.velocity.x = slimeSpeed * Math.cos(angle);
        this.body.velocity.y = slimeSpeed * Math.sin(angle);

        // Update slime animation based on direction
        if (this.body.velocity.x > 0) {
            this.anims.play('slime-right', true);
        } else if (this.body.velocity.x < 0) {
            this.anims.play('slime-left', true);
        }
    }

}

function killSlime(scene, slime) {
    slime.body.velocity.x = 0
    slime.body.velocity.y =0

    slime.body.setEnable(false);

    let flashDuration = 50;
    for(let i = 0; i < 5; i++) {
        scene.time.delayedCall(flashDuration * i * 2, () => { slime.setVisible(!slime.visible); });
    }
    scene.time.delayedCall(flashDuration * 10, () => { 
        currentEnemies--;
        slime.destroy(); });

    // update score and health depending on enemy
    switch (slime.texture.key) {
        case 'slime': 
            healPlayer(5)
            score += 5
            break;
        case 'demon':
            healPlayer(15)
            score += 10
            break;
        case 'doc':
            healPlayer(10)
            score += 5
            break;
        case 'zombie':
            healPlayer(50)
            score += 15
            break;
    }

    increaseMobCount();
}

function playerTakeDamage(scene, damage) {

    if (player.isImmune) return;

    player.health -= damage;
    
    if (player.health <= 0) {
        gameOver(scene)
    }

    // Flash the player to indicate damage
    let tintDuration = 100; // Duration for each tint and clear
    for (let i = 0; i < 4; i++) {
        scene.time.delayedCall(tintDuration * i, () => {
            if (i % 2 === 0) {
                player.setTint(0xff0000); // Set red tint
            } else {
                player.clearTint(); // Clear tint
            }
        });
    }

    // Set the player to be immune for a short duration
    player.isImmune = true;
    player.setAlpha(0.7) // Tranceperncy until immunity ends
    scene.time.delayedCall(player.immunityDuration, () => {
        player.isImmune = false;
        player.setAlpha(1)
    });

    // Additional logic for player health reaching 0
    if (player.health <= 0) {
        // Handle player death (e.g., end game, restart level)
    }
}

function gameOver(scene) {
    gameMusic.stop()
    window.alert(`You Died :p \n\nScore: ${score}`)
    maxEnemies = 20;
    currentEnemies = 0;
    score = 0;
    scoreDiv = 0;
    scene.scene.start('HomeScene');
}

function updateHealthBar(scene) {

    health = player.health

    // Health bar dimensions and position
    const barWidth = 200;
    const barHeight = 20;
    const barX = scene.cameras.main.worldView.x + 20;
    const barY = scene.cameras.main.worldView.y + 20;

    // Clear the old graphics
    healthBar.clear();

    // Draw the background of the health bar
    healthBar.fillStyle(0x000000);
    healthBar.fillRect(barX, barY, barWidth, barHeight);

    // Calculate the width of the health portion of the bar
    const healthWidth = Phaser.Math.Clamp(health, 0, 100) / 100 * barWidth;

    // Draw the health portion of the bar
    healthBar.fillStyle(0xff0000);  // Red color for health
    healthBar.fillRect(barX, barY, healthWidth, barHeight);
}

function mobTakeDamage(scene, mob, damage) {

    mob.health -= damage;
        if (mob.health <= 0) {
            mob.setActive(false);
            mob.setVisible(false);
            killSlime(scene, mob) 
        } else {
            // Flash mob to indicate damage
            let tintDuration = 100; // Duration for each tint and clear
            for (let i = 0; i < 4; i++) {
                scene.time.delayedCall(tintDuration * i, () => {
                    if (i % 2 === 0) {
                        mob.setTint(0xff0000); // Set red tint
                    } else {
                        mob.clearTint(); // Clear tint
                    }
                });
            }
        }
}

function createDemonAnim(scene) {
    scene.anims.create({
        key: 'demon-right',
        frames: [
            { key: 'demon', frame: 0 },
            { key: 'demon', frame: 1 },
            { key: 'demon', frame: 2 },
            { key: 'demon', frame: 3 }
        ],
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'demon-left',
        frames: [
            { key: 'demon', frame: 7 },
            { key: 'demon', frame: 6 },
            { key: 'demon', frame: 5 },
            { key: 'demon', frame: 4 }
        ],
        frameRate: 10,
        repeat: -1
    });

}

function createDemon(x, y, speed) {

    let demon = demons.get(x, y, 'demon');
    if (!demon) return; // Return if no arrow available in pool

    demon.setScale(2.5);
    demon.setActive(true);
    demon.setVisible(true);
    demon.health = 200;
    demon.setCollideWorldBounds(true);

    // make hitbox smaller than sprite size and center the hitbox on the sprite
    const hitboxWidth = demon.width * 0.6;
    const hitboxHeight = demon.height * 0.7;
    demon.body.setSize(hitboxWidth, hitboxHeight);
    demon.body.setOffset((demon.width - hitboxWidth) / 2, (demon.height - hitboxHeight) / 1.4);

    const demonSpeed = speed; // Adjust as needed

    demon.update = function() {

        // Calculate the direction from the demon to the player
        let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        // Set the demon's velocity towards the player
        this.body.velocity.x = demonSpeed * Math.cos(angle);
        this.body.velocity.y = demonSpeed * Math.sin(angle);

        // Update demon animation based on direction
        if (this.body.velocity.x > 0) {
            this.anims.play('demon-right', true);
        } else if (this.body.velocity.x < 0) {
            this.anims.play('demon-left', true);
        }
    }
}

function createDocAnim(scene) {
    scene.anims.create({
        key: 'doc-right',
        frames: [
            { key: 'doc', frame: 0 },
            { key: 'doc', frame: 1 },
            { key: 'doc', frame: 2 },
            { key: 'doc', frame: 3 }
        ],
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'doc-left',
        frames: [
            { key: 'doc', frame: 7 },
            { key: 'doc', frame: 6 },
            { key: 'doc', frame: 5 },
            { key: 'doc', frame: 4 }
        ],
        frameRate: 10,
        repeat: -1
    });
}

function createZombieAnim(scene) {
    scene.anims.create({
        key: 'zombie-right',
        frames: [
            { key: 'zombie', frame: 0 },
            { key: 'zombie', frame: 1 },
            { key: 'zombie', frame: 2 },
            { key: 'zombie', frame: 3 }
        ],
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'zombie-left',
        frames: [
            { key: 'zombie', frame: 7 },
            { key: 'zombie', frame: 6 },
            { key: 'zombie', frame: 5 },
            { key: 'zombie', frame: 4 }
        ],
        frameRate: 10,
        repeat: -1
    });
}

function createDoc(x, y, speed) {

    let doc = docs.get(x, y, 'doc');
    if (!doc) return; // Return if no arrow available in pool

    doc.setScale(2.5);
    doc.setActive(true);
    doc.setVisible(true);
    doc.health = 1;
    doc.setCollideWorldBounds(true);

    // make hitbox smaller than sprite size and center the hitbox on the sprite
    const hitboxWidth = doc.width * 0.8;
    const hitboxHeight = doc.height * 0.8;
    doc.body.setSize(hitboxWidth, hitboxHeight);
    doc.body.setOffset((doc.width - hitboxWidth) / 2, (doc.height - hitboxHeight) / 1.5);

    const docSpeed = speed; // Adjust as needed

    doc.update = function() {

        // Calculate the direction from the doc to the player
        let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        // Set the doc's velocity towards the player
        this.body.velocity.x = docSpeed * Math.cos(angle);
        this.body.velocity.y = docSpeed * Math.sin(angle);

        // Update doc animation based on direction
        if (this.body.velocity.x > 0) {
            this.anims.play('doc-right', true);
        } else if (this.body.velocity.x < 0) {
            this.anims.play('doc-left', true);
        }
    }
}

function createZombie(x, y, speed) {

    let zombie = zombies.get(x, y, 'zombie');
    if (!zombie) return; // Return if no arrow available in pool

    zombie.setScale(2.5);
    zombie.setActive(true);
    zombie.setVisible(true);
    zombie.health = 500;
    zombie.setCollideWorldBounds(true);

    // make hitbox smaller than sprite size and center the hitbox on the sprite
    const hitboxWidth = zombie.width * 0.6;
    const hitboxHeight = zombie.height * 0.9;
    zombie.body.setSize(hitboxWidth, hitboxHeight);
    zombie.body.setOffset((zombie.width - hitboxWidth) / 2, (zombie.height - hitboxHeight) / 1.5);

    const zombieSpeed = speed; // Adjust as needed

    zombie.update = function() {

        // Calculate the direction from the zombie to the player
        let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        // Set the zombie's velocity towards the player
        this.body.velocity.x = zombieSpeed * Math.cos(angle);
        this.body.velocity.y = zombieSpeed * Math.sin(angle);

        // Update zombie animation based on direction
        if (this.body.velocity.x > 0) {
            this.anims.play('zombie-right', true);
        } else if (this.body.velocity.x < 0) {
            this.anims.play('zombie-left', true);
        }
    }
}

// creates an enemy at random 
function createRandomEnemy(scene) {
    const enemyTypes = ['slime', 'demon', 'doc', 'zombie'];
    const probabilities = [35, 30, 25, 10]; // Corresponding probabilities

    // Calculate cumulative probabilities
    const cumulativeProbabilities = probabilities.map((sum => value => sum += value)(0));

    // Get a random number between 0 and 100
    const randomNumber = Phaser.Math.Between(0, 100);

    // Determine the enemy type based on the random number
    let chosenType;
    for (let i = 0; i < cumulativeProbabilities.length; i++) {
        if (randomNumber <= cumulativeProbabilities[i]) {
            chosenType = enemyTypes[i];
            break;
        }
    }

    // Generate a random position for the enemy
    let position = generateRandomPosition(scene, player);

    // Create the enemy based on the chosen type
    switch (chosenType) {
        case 'slime': 
            createSlime(position.x, position.y, Phaser.Math.Between(50, 70));
            break;
        case 'demon':
            createDemon(position.x, position.y, Phaser.Math.Between(130, 150));
            break;
        case 'doc':
            createDoc(position.x, position.y, Phaser.Math.Between(240, 260));
            break;
        case 'zombie':
            createZombie(position.x, position.y, Phaser.Math.Between(30, 40));
            break;
    }
}

// genrates position that is not too close to player
function generateRandomPosition(scene, player) {
    let position;
    const minDistance = 250; // Minimum distance from the player
    do {
        position = {
            x: Phaser.Math.Between(0, scene.physics.world.bounds.width),
            y: Phaser.Math.Between(0, scene.physics.world.bounds.height)
        };
    } while (Phaser.Math.Distance.Between(player.x, player.y, position.x, position.y) < minDistance);

    return position;
}

// heal player by given amounts
function healPlayer(amount) {
  
    player.health += amount

    if (player.health > 100)
        player.health = 100;

}

// decides whether to increase maxEnemies depending on score, for 100 score add 2 to maxEnemies
function increaseMobCount() {

    if ((score / 100) > scoreDiv) {
        scoreDiv++;
        maxEnemies += 10
    }
}

class HomeScene extends Phaser.Scene {

    constructor() {
        super({ key: 'HomeScene' });
    }

    preload() {
        this.load.image('background', 'assets/bg.png'); 
        this.load.audio('bgMusic', 'assets/home.mp3');
    }

    music;
    create() {

        this.music = this.sound.add('bgMusic', { loop: true, volume: 0.01 });
        this.music.play()

        // Add the background
        this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);
        
        // Display instructions
        this.add.text(50, 100, 'Instructions: \n\n-use W A S D to move\n\n-use space to shoot and cursor to aim\n\n-have fun ;)', { font: '16px Arial', fill: '#ffffff' });

        // Create the Play button
        let playButton = this.add.text(0, 0, 'Play', { font: 'bold 24px Arial', fill: '#ff0000' , padding: { x: 10, y: 5 }, borderRadius: 30 })
        .setInteractive()
        .on('pointerover', () => playButton.setStyle({ fill: '#ffffff'})) // Change color on hover
        .on('pointerout', () => playButton.setStyle({ fill: '#ff0000'})) // Revert color when not hovered
        .on('pointerdown', () => this.startGame());

        // Center the button
        Phaser.Display.Align.In.Center(playButton, this.add.zone(400, 400, 800, 600));
    }

    startGame() {
        this.music.stop()
        this.scene.start('GameScene');
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        HomeScene,
        { key: 'GameScene', preload: preload, create: create, update: update }
    ]
};

function updateScore(scene) {
    const x = scene.cameras.main.worldView.x + 400;
    const y = scene.cameras.main.worldView.y + 20 ;
    scoreText.setText(`Score: ${score}`);
    scoreText.setPosition(x, y);
}

// start the game
let game = new Phaser.Game(config);


