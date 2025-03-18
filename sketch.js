const gameUI = document.getElementById('gameUI');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const retryButtonElement = document.getElementById('retryButton');
const leaderboardButtonElement = document.getElementById('leaderboardButton');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const bulletsElement = document.getElementById('bullets');
const speedElement = document.getElementById('speed');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const leaderboardList = document.getElementById('leaderboard');
const leaderboardBackButton = document.getElementById('leaderboardBack');
const playPauseButton = document.getElementById('playPauseButton');
const viewLeaderboardButton = document.getElementById('viewLeaderboardButton');

// Images
let alienImage;
let playerImage;

// Game instance
let game;

// Key state tracking
let keyState = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Add this code before anything else
// This will run immediately when the script is loaded
document.addEventListener('DOMContentLoaded', function() {
    debugScreenVisibility("DOM Content Loaded");
    
    // Force override any conflicting styles
    gameOverScreen.style.display = "none";
    leaderboardScreen.style.display = "none";
    gameOverScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
});

class Game {
    constructor() {
        this.player = null;
        this.aliens = [];
        this.fastAliens = [];
        this.bullets = [];
        this.lives = 3;
        this.score = 0;
        this.speedMultiplier = 1;
        this.bulletCount = 50;
        this.isGameOver = false;
        this.isPaused = true; // Start paused initially
        
        // Create leaderboard
        this.leaderboard = new Leaderboard();
        
        // Bind methods to preserve 'this' context
        this.reset = this.reset.bind(this);
        this.gameOver = this.gameOver.bind(this);
    }
    
    setup() {
        debugScreenVisibility("Game Setup");
        
        // Force hide screens with both class and style
        gameOverScreen.classList.add('hidden');
        leaderboardScreen.classList.add('hidden');
        gameOverScreen.style.display = "none";
        leaderboardScreen.style.display = "none";
        
        // Create player
        this.reset();
        
        // Setup game intervals
        this.spawnAliensInterval = setInterval(() => this.spawnAliens(), 5000);
        this.spawnFastAliensInterval = setInterval(() => this.spawnFastAliens(), 10000);
        this.increaseSpeedInterval = setInterval(() => this.increaseSpeed(), 10000);
        this.addBulletInterval = setInterval(() => this.addBullet(), 1000);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start in paused state
        this.setPaused(true);
        playPauseButton.textContent = "Play";
        noLoop();
    }
    
    setupEventListeners() {
        // Reset button
        retryButtonElement.onclick = this.reset;
        
        // Leaderboard button
        leaderboardButtonElement.onclick = () => {
            const playerName = prompt("Enter your name for the leaderboard:", "Player");
            if (playerName) {
                this.leaderboard.addScore(playerName, this.score);
                this.leaderboard.displayLeaderboard();
                gameOverScreen.classList.add('hidden');
                leaderboardScreen.classList.remove('hidden');
            }
        };
        
        // Play/Pause button
        playPauseButton.onclick = () => {
            this.togglePause();
        };
        
        // View Leaderboard button
        viewLeaderboardButton.onclick = () => {
            // Only show leaderboard if game is paused
            this.setPaused(true);
            this.leaderboard.displayLeaderboard();
            gameOverScreen.classList.add('hidden');
            leaderboardScreen.classList.remove('hidden');
            leaderboardScreen.style.display = "flex";
        };
        
        // Back button
        leaderboardBackButton.addEventListener('click', () => {
            leaderboardScreen.classList.add('hidden');
            leaderboardScreen.style.display = "none";
            // Don't automatically reset, just go back to paused/playing game
            if (!this.isGameOver) {
                // Resume the game if it wasn't game over
                this.setPaused(false);
            } else {
                // If it was game over, start a new game
                this.reset();
            }
        });
    }
    
    // Add new methods to handle pause state
    togglePause() {
        this.isPaused = !this.isPaused;
        playPauseButton.textContent = this.isPaused ? "Play" : "Pause";
        
        if (this.isPaused) {
            noLoop();
        } else {
            loop();
        }
    }
    
    setPaused(value) {
        this.isPaused = value;
        playPauseButton.textContent = this.isPaused ? "Play" : "Pause";
        
        if (this.isPaused) {
            noLoop();
        } else {
            loop();
        }
    }
    
    reset() {
        debugScreenVisibility("Game Reset");
        
        this.player = new Player();
        this.aliens = [];
        this.fastAliens = [];
        this.bullets = [];
        this.lives = 3;
        this.score = 0;
        this.speedMultiplier = 1;
        this.bulletCount = 50;
        this.isGameOver = false;
        this.isPaused = true; // Start paused on reset too
        playPauseButton.textContent = "Play";
        
        this.spawnAliens();
        this.spawnFastAliens();
        
        // Hide screens with both class and style
        gameOverScreen.classList.add('hidden');
        leaderboardScreen.classList.add('hidden');
        gameOverScreen.style.display = "none";
        leaderboardScreen.style.display = "none";
        
        // Stop the game loop since we're starting paused
        noLoop();
    }
    
    update() {
        // Don't update if game is over
        if (this.isGameOver) return;
        
        this.updateGameUI();
        this.player.show();
        this.player.move();
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].show();
            this.bullets[i].move();
            
            // Remove bullets that go off screen
            if (this.bullets[i].y < 0) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Update aliens
        for (let alien of this.aliens) {
            alien.show();
            alien.move();
        }
        
        for (let fastAlien of this.fastAliens) {
            fastAlien.show();
            fastAlien.move();
        }
        
        this.checkCollisions();
        this.checkPlayerHit();
    }
    
    updateGameUI() {
        scoreElement.innerHTML = `Score: ${this.score}`;
        livesElement.innerHTML = `Lives: ${this.lives}`;
        bulletsElement.innerHTML = `Bullets: ${this.bulletCount}`;
        speedElement.innerHTML = `Speed: ${this.speedMultiplier.toFixed(2)}x`;
    }
    
    spawnAliens() {
        for (let i = 0; i < 5; i++) {
            this.aliens.push(new Alien(i * 80 + 80, 60, this.speedMultiplier));
        }
    }
    
    spawnFastAliens() {
        for (let i = 0; i < 5; i++) {
            this.fastAliens.push(new FastAlien(i * 80 + 80, 120, this.speedMultiplier));
        }
    }
    
    increaseSpeed() {
        this.speedMultiplier *= 2;
    }
    
    addBullet() {
        this.bulletCount++;
    }
    
    fireBullet() {
        if (this.bulletCount > 0) {
            this.bullets.push(new Bullet(this.player.x + 30, this.player.y));
            this.bulletCount--;
        }
    }
    
    updatePlayerDirection(xdir, ydir) {
        this.player.setDir(xdir, ydir);
    }
    
    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.aliens.length - 1; j >= 0; j--) {
                if (this.bullets[i] && this.bullets[i].hits(this.aliens[j])) {
                    this.score += 10;
                    this.aliens.splice(j, 1);
                    this.bullets.splice(i, 1);
                    break;
                }
            }
            
            if (!this.bullets[i]) continue; // Bullet was removed in the previous loop
            
            for (let k = this.fastAliens.length - 1; k >= 0; k--) {
                if (this.bullets[i] && this.bullets[i].hits(this.fastAliens[k])) {
                    this.score += 20;
                    this.fastAliens.splice(k, 1);
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    checkPlayerHit() {
        for (let i = this.aliens.length - 1; i >= 0; i--) {
            if (this.aliens[i].hits(this.player)) {
                this.lives -= 1;
                this.aliens.splice(i, 1);
                console.log("Player hit! Lives:", this.lives);
                if (this.lives <= 0) {
                    console.log("Player died! Game over!");
                    this.gameOver();
                }
            }
        }
        
        for (let i = this.fastAliens.length - 1; i >= 0; i--) {
            if (this.fastAliens[i].hits(this.player)) {
                this.lives -= 1;
                this.fastAliens.splice(i, 1);
                console.log("Player hit by fast alien! Lives:", this.lives);
                if (this.lives <= 0) {
                    console.log("Player died! Game over!");
                    this.gameOver();
                }
            }
        }
    }
    
    gameOver() {
        debugScreenVisibility("Game Over Called");
        
        this.isGameOver = true;
        this.isPaused = true; // Consider game paused when it's over
        playPauseButton.textContent = "Play"; // Update button text
        noLoop();
        
        // Update final score
        finalScoreElement.textContent = `Your final score: ${this.score}`;
        
        // Show game over screen - use both class and style
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.style.display = "flex";
        
        // Double check after a slight delay to ensure it's visible
        setTimeout(() => {
            debugScreenVisibility("Game Over - After Timeout");
            if (gameOverScreen.classList.contains('hidden')) {
                console.log("Forcing game over screen visible again");
                gameOverScreen.classList.remove('hidden');
                gameOverScreen.style.display = "flex";
            }
        }, 100);
    }
}

class Leaderboard {
    constructor() {
        // Load existing scores from localStorage
        const savedScores = localStorage.getItem('spaceInvadersScores');
        this.scores = savedScores ? JSON.parse(savedScores) : [];
    }
    
    addScore(name, score) {
        this.scores.push({name, score, date: new Date().toLocaleDateString()});
        this.scores.sort((a, b) => b.score - a.score);
        // Keep only top 10 scores
        this.scores = this.scores.slice(0, 10);
        // Save to localStorage
        localStorage.setItem('spaceInvadersScores', JSON.stringify(this.scores));
    }
    
    getTopScores(count = 10) {
        return this.scores.slice(0, count);
    }
    
    displayLeaderboard() {
        // Clear current list
        leaderboardList.innerHTML = '';
        
        // Get top scores
        const topScores = this.getTopScores();
        
        if (topScores.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'No scores yet. Be the first!';
            leaderboardList.appendChild(emptyItem);
            return;
        }
        
        // Add scores to leaderboard
        topScores.forEach((scoreData, index) => {
            const scoreItem = document.createElement('li');
            scoreItem.innerHTML = `<span class="rank">#${index + 1}</span> <span class="name">${scoreData.name}</span> <span class="score">${scoreData.score}</span> <span class="date">${scoreData.date}</span>`;
            leaderboardList.appendChild(scoreItem);
        });
    }
}

function preload() {
    alienImage = loadImage('./alien.png');
    playerImage = loadImage('./player.png');
}

function setup() {
    debugScreenVisibility("Setup Function");
    
    // Immediately hide both screens
    gameOverScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
    gameOverScreen.style.display = "none";
    leaderboardScreen.style.display = "none";
    
    // Create responsive canvas based on container size
    const gameContainer = document.getElementById('gameCanvas');
    const containerWidth = gameContainer.offsetWidth;
    const canvasHeight = Math.min(600, window.innerHeight * 0.7);
    
    let canvas = createCanvas(containerWidth, canvasHeight);
    canvas.parent('gameCanvas');
    
    // Create and setup the game
    game = new Game();
    game.setup();
    
    // Make sure the game starts paused
    noLoop();
    
    // Setup window resize handler
    window.addEventListener('resize', windowResized);
}

function windowResized() {
    // Resize canvas when window size changes
    const gameContainer = document.getElementById('gameCanvas');
    const containerWidth = gameContainer.offsetWidth;
    const canvasHeight = Math.min(600, window.innerHeight * 0.7);
    
    resizeCanvas(containerWidth, canvasHeight);
    
    // If we have a player, make sure it stays in bounds
    if (game && game.player) {
        game.player.x = constrain(game.player.x, 0, width - 60);
        game.player.y = constrain(game.player.y, 0, height - 60);
    }
}

function draw() {
    background(173, 216, 230);
    game.update();
}

function keyPressed() {
    // Add Escape key for pausing/unpausing
    if (keyCode === ESCAPE) {
        game.togglePause();
        return false; // Prevent default browser behavior
    }
    
    if (key === ' ') {
        game.fireBullet();
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

function updatePlayerDirection() {
    // Calculate x direction
    let xdir = 0;
    if (keyState.a) xdir -= 1;
    if (keyState.d) xdir += 1;
    
    // Calculate y direction
    let ydir = 0;
    if (keyState.w) ydir -= 1;
    if (keyState.s) ydir += 1;
    
    // Update player direction
    if (game && game.player) {
        game.updatePlayerDirection(xdir, ydir);
    }
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
    constructor(x, y, speedMultiplier) {
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
    constructor(x, y, speedMultiplier) {
        super(x, y, speedMultiplier);
        this.xdir = 5 * speedMultiplier;
        this.ydir = 1 * speedMultiplier;
    }
}

// Add this function to help with debugging screen visibility
function debugScreenVisibility(message) {
    console.log(message);
    console.log("Game Over Screen hidden?", gameOverScreen.classList.contains('hidden'));
    console.log("Leaderboard Screen hidden?", leaderboardScreen.classList.contains('hidden'));
}