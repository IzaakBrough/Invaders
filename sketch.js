const gameUI = document.getElementById('gameUI');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const retryButtonElement = document.getElementById('retryButton');
const leaderboardButtonElement = document.getElementById('leaderboardButton');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const bulletsElement = document.getElementById('bullets');
const speedElement = document.getElementById('speed');

let player;
let e = 2.71828;
let aliens = [];
let fastAliens = [];
let bullets = [];
let lives = 3;
let score = 0;
let speedMultiplier = 1;
let alienImage;
let playerImage;
let bulletCount = 50;
// Add key state tracking
let keyState = {
    w: false,
    a: false,
    s: false,
    d: false
};

function preload() {
    alienImage = loadImage('./alien.png');
    playerImage = loadImage('./player.png');
}

function setup() {
    let canvas = createCanvas(900, 600);
    canvas.parent('gameCanvas');
    resetGame();
    setInterval(spawnAliens, 5000);
    setInterval(spawnFastAliens, 10000);
    setInterval(increaseSpeed, 10000); // Increase speed every 10 seconds
    setInterval(addBullet, 1000); // Add a bullet every second
}

function draw() {
    background(173, 216, 230);
    updateGameUI(); // Replace displayScore with updateGameUI
    player.show();
    player.move();

    for (let bullet of bullets) {
        bullet.show();
        bullet.move();
    }

    for (let alien of aliens) {
        alien.show();
        alien.move();
    }

    for (let fastAlien of fastAliens) {
        fastAlien.show();
        fastAlien.move();
    }

    checkCollisions();
    checkPlayerHit();
}

function resetGame() {
    player = new Player();
    aliens = [];
    fastAliens = [];
    bullets = [];
    lives = 3;
    bulletCount = 50;
    speedMultiplier = 1;
    spawnAliens();
    spawnFastAliens();
    loop();
    
    // Hide the game over screen
    gameOverScreen.classList.add('hidden');
}

function spawnAliens() {
    for (let i = 0; i < 5; i++) {
        aliens.push(new Alien(i * 80 + 80, 60));
    }
}

function spawnFastAliens() {
    for (let i = 0; i < 5; i++) {
        fastAliens.push(new FastAlien(i * 80 + 80, 120));
    }
}

function increaseSpeed() {
    speedMultiplier *= 2; // Increase speed multiplier by 100% every 10 seconds
}

// Replace the displayScore function with updateGameUI
function updateGameUI() {
    scoreElement.innerHTML = `Score: ${score}`;
    livesElement.innerHTML = `Lives: ${lives}`;
    bulletsElement.innerHTML = `Bullets: ${bulletCount}`;
    speedElement.innerHTML = `Speed: ${speedMultiplier.toFixed(2)}x`;
}

// Remove or comment out the old displayScore function
// function displayScore() {
//     fill(255);
//     textSize(24);
//     text(`Score: ${score}`, 10, 30);
//     text(`Lives: ${lives}`, 10, 60);
//     text(`Bullets: ${bulletCount}`, 10, 90);
//     text(`Speed Multiplier: ${speedMultiplier.toFixed(2)}`, 10, 120);
// }

function keyPressed() {
    if (key === ' ' && bulletCount > 0) {
        bullets.push(new Bullet(player.x + 30, player.y));
        bulletCount--;
    }
    
    // Update key state
    if (key === 'a' || key === 'A') keyState.a = true;
    if (key === 'd' || key === 'D') keyState.d = true;
    if (key === 'w' || key === 'W') keyState.w = true;
    if (key === 's' || key === 'S') keyState.s = true;
    
    updatePlayerDirection();
}

function keyReleased() {
    // Update key state when keys are released
    if (key === 'a' || key === 'A') keyState.a = false;
    if (key === 'd' || key === 'D') keyState.d = false;
    if (key === 'w' || key === 'W') keyState.w = false;
    if (key === 's' || key === 'S') keyState.s = false;
    
    updatePlayerDirection();
}

// New function to update player direction based on current key state
function updatePlayerDirection() {
    // Calculate x direction: -1 for left, 1 for right, 0 for neither or both
    let xdir = 0;
    if (keyState.a) xdir -= 1;
    if (keyState.d) xdir += 1;
    
    // Calculate y direction: -1 for up, 1 for down, 0 for neither or both
    let ydir = 0;
    if (keyState.w) ydir -= 1;
    if (keyState.s) ydir += 1;
    
    // Update player direction
    player.setDir(xdir, ydir);
}

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = aliens.length - 1; j >= 0; j--) {
            if (bullets[i] && bullets[i].hits(aliens[j])) {
                score += 10;
                aliens.splice(j, 1);
                bullets.splice(i, 1);
                break;
            }
        }
        for (let k = fastAliens.length - 1; k >= 0; k--) {
            if (bullets[i] && bullets[i].hits(fastAliens[k])) {
                score += 20;
                fastAliens.splice(k, 1);
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

function checkPlayerHit() {
    for (let i = aliens.length - 1; i >= 0; i--) {
        if (aliens[i] instanceof Alien && aliens[i].hits(player)) {
            lives -= 1;
            aliens.splice(i, 1);
            if (lives <= 0) {
                gameOver();
            }
        }
    }
    for (let i = fastAliens.length - 1; i >= 0; i--) {
        if (fastAliens[i] instanceof FastAlien && fastAliens[i].hits(player)) {
            lives -= 1;
            fastAliens.splice(i, 1);
            if (lives <= 0) {
                gameOver();
            }
        }
    }
}

function gameOver() {
    noLoop();
    
    // Update final score
    finalScoreElement.textContent = `Your final score: ${score}`;
    
    // Show game over screen
    gameOverScreen.classList.remove('hidden');
    
    // Setup event handlers (only need to do this once in setup, but doing it again won't hurt)
    retryButtonElement.onclick = function() {
        lives = 3;
        score = 0;
        resetGame();
    };
    
    leaderboardButtonElement.onclick = function() {
        // Implement leaderboard functionality here
        console.log("Leaderboard button clicked");
    };
}

// Delete or comment out the drawGameOverBox function as it's no longer needed
// function drawGameOverBox() {
//     fill(255, 0, 0);
//     rect(width / 2 - 100, height / 2 - 50, 200, 150, 20);
//     fill(255);
//     textSize(32);
//     textAlign(CENTER, CENTER);
//     text("Game Over", width / 2, height / 2 - 20);
// }

function addBullet() {
    bulletCount++;
}

class Player {
    constructor() {
        this.x = width / 2;
        this.y = height - 60;
        this.xdir = 0;
        this.ydir = 0;
        this.speed = 5;
    }

    show() {
        image(playerImage, this.x, this.y, 60, 60);
    }

    setDir(xdir, ydir) {
        this.xdir = xdir;
        this.ydir = ydir;
    }

    move() {
        // Check if moving diagonally
        if (this.xdir !== 0 && this.ydir !== 0) {
            // Normalize diagonal movement
            const diagSpeed = this.speed / Math.sqrt(2);
            this.x += this.xdir * diagSpeed;
            this.y += this.ydir * diagSpeed;
        } else {
            // Regular cardinal movement
            this.x += this.xdir * this.speed;
            this.y += this.ydir * this.speed;
        }
        
        // Constrain to canvas
        this.x = constrain(this.x, 0, width - 60);
        this.y = constrain(this.y, 0, height - 60);
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 8;
    }

    show() {
        fill(50, 205, 50);
        ellipse(this.x, this.y, this.r * 2);
    }

    move() {
        this.y = this.y - 5;
    }

    hits(alien) {
        let d = dist(this.x, this.y, alien.x + 30, alien.y + 30);
        return d < this.r + alien.r;
    }
}

class Alien {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 30;
        this.xdir = 1 * -speedMultiplier;
    }

    show() {
        image(alienImage, this.x, this.y, 60, 60);
    }

    move() {
        this.x += this.xdir;
        if (this.x > width || this.x < 0) {
            this.xdir *= -1;
            this.y += this.r;
        }
    }

    hits(player) {
        let d = dist(this.x + 30, this.y + 30, player.x + 30, player.y + 30);
        return d < 30 + 30;
    }
}

class FastAlien extends Alien {
    constructor(x, y) {
        super(x, y);
        this.xdir = 5 * speedMultiplier;
        this.ydir = 1 * speedMultiplier;
    }
}