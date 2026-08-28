const game = document.getElementById("game");
const road = document.getElementById("road");
const player = document.getElementById("player");
const line1 = document.querySelector(".line1");
const line2 = document.querySelector(".line2");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const finalHighScore = document.getElementById("final-high-score");
const restartButton = document.getElementById("restart");
const leftButton = document.getElementById("left-button");
const rightButton = document.getElementById("right-button");
const joystick = document.getElementById("joystick");
const joystickStick = document.getElementById("joystick-stick");
const moveControls = document.getElementById("move-controls");
const settingsButton = document.getElementById("settings-button");
const settingsPanel = document.getElementById("settings-panel");
const closeSettings = document.getElementById("close-settings");
const joystickOption = document.getElementById("joystick-option");
const moveOption = document.getElementById("move-option");
const joystickCheck = document.getElementById("joystick-check");
const moveCheck = document.getElementById("move-check");
const currentControl = document.getElementById("current-control");

let score = 0;
let highScore = Number(localStorage.getItem("endlessCarHighScore")) || 0;
let speed = 6;
let playerX = 0;
let gameRunning = true;
let enemies = [];
let lastEnemySpawn = 0;
let roadLineY = -100;
let leftPressed = false;
let rightPressed = false;
let leftButtonPressed = false;
let rightButtonPressed = false;
let joystickDirection = 0;
let controlMode = localStorage.getItem("endlessCarControl") || "move";

highScoreElement.textContent = highScore;

autoResetPlayer();

function autoResetPlayer() {
    playerX = (road.clientWidth - player.offsetWidth) / 2;
    player.style.left = playerX + "px";
}

function setKeyState(event, pressed) {
    const key = event.key.toLowerCase();
    if (event.key === "ArrowLeft" || key === "a") {
        leftPressed = pressed;
        event.preventDefault();
    }
    if (event.key === "ArrowRight" || key === "d") {
        rightPressed = pressed;
        event.preventDefault();
    }
}

document.addEventListener("keydown", (event) => setKeyState(event, true));
document.addEventListener("keyup", (event) => setKeyState(event, false));

function bindMovementButton(button, direction) {
    const setPressed = (pressed, event) => {
        event?.preventDefault();
        if (direction < 0) leftButtonPressed = pressed;
        if (direction > 0) rightButtonPressed = pressed;
    };
    button.addEventListener("pointerdown", (event) => setPressed(true, event));
    button.addEventListener("pointerup", (event) => setPressed(false, event));
    button.addEventListener("pointercancel", (event) => setPressed(false, event));
    button.addEventListener("pointerleave", (event) => setPressed(false, event));
}

bindMovementButton(leftButton, -1);
bindMovementButton(rightButton, 1);

function moveJoystick(event) {
    const rect = joystick.getBoundingClientRect();
    let x = event.clientX - (rect.left + rect.width / 2);
    let y = event.clientY - (rect.top + rect.height / 2);
    const limit = 31;
    const distance = Math.sqrt(x * x + y * y);
    if (distance > limit) {
        x = (x / distance) * limit;
        y = (y / distance) * limit;
    }
    joystickStick.style.left = `calc(50% + ${x}px)`;
    joystickStick.style.top = `calc(50% + ${y}px)`;
    joystickDirection = x / limit;
}

function stopJoystick() {
    joystickDirection = 0;
    joystickStick.style.left = "50%";
    joystickStick.style.top = "50%";
}

joystick.addEventListener("pointerdown", (event) => {
    joystick.setPointerCapture(event.pointerId);
    moveJoystick(event);
});
joystick.addEventListener("pointermove", moveJoystick);
joystick.addEventListener("pointerup", stopJoystick);
joystick.addEventListener("pointercancel", stopJoystick);
joystick.addEventListener("lostpointercapture", stopJoystick);

function setControlMode(mode) {
    controlMode = mode;
    localStorage.setItem("endlessCarControl", mode);
    const joystickActive = mode === "joystick";
    joystick.hidden = !joystickActive;
    moveControls.hidden = joystickActive;
    joystickOption.classList.toggle("active", joystickActive);
    moveOption.classList.toggle("active", !joystickActive);
    joystickCheck.textContent = joystickActive ? "✓" : "";
    moveCheck.textContent = joystickActive ? "" : "✓";
    currentControl.textContent = joystickActive ? "Joystick" : "Move < >";
}

settingsButton.addEventListener("click", () => { settingsPanel.hidden = false; });
closeSettings.addEventListener("click", () => { settingsPanel.hidden = true; });
joystickOption.addEventListener("click", () => { setControlMode("joystick"); settingsPanel.hidden = true; });
moveOption.addEventListener("click", () => { setControlMode("move"); settingsPanel.hidden = true; });
setControlMode(controlMode);

function movePlayer() {
    if (!gameRunning) return;
    let movement = 0;
    if (leftPressed || leftButtonPressed) movement -= 8;
    if (rightPressed || rightButtonPressed) movement += 8;
    if (controlMode === "joystick" && Math.abs(joystickDirection) > 0.05) movement += joystickDirection * 10;
    playerX += movement;
    const minX = 8;
    const maxX = road.clientWidth - player.offsetWidth - 8;
    playerX = Math.max(minX, Math.min(maxX, playerX));
    player.style.left = playerX + "px";
}

function moveRoad() {
    if (!gameRunning) return;
    roadLineY += speed;
    if (roadLineY > window.innerHeight) roadLineY = -120;
    line1.style.top = roadLineY + "px";
    line2.style.top = roadLineY + "px";
}

function createEnemy() {
    if (!gameRunning) return;
    const enemy = document.createElement("div");
    enemy.className = "enemy";
    enemy.innerHTML = '<div class="enemy-window"></div><div class="enemy-light"></div>';

    const lanes = [16.5, 50, 83.5];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    enemy.style.left = `calc(${lane}% - 29px)`;
    enemy.style.top = "-130px";
    road.appendChild(enemy);
    enemies.push(enemy);
}

function moveEnemies() {
    if (!gameRunning) return;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const top = parseFloat(enemy.style.top) + speed;
        enemy.style.top = top + "px";

        if (checkCollision(player, enemy)) {
            endGame();
            return;
        }

        if (top > window.innerHeight + 150) {
            enemy.remove();
            enemies.splice(i, 1);
            score++;
            scoreElement.textContent = score;
            if (score % 10 === 0) speed += 0.7;
        }
    }
}

function checkCollision(first, second) {
    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();
    const padding = 8;
    return !(a.right - padding < b.left + padding || a.left + padding > b.right - padding || a.bottom - padding < b.top + padding || a.top + padding > b.bottom - padding);
}

function endGame() {
    if (!gameRunning) return;
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("endlessCarHighScore", highScore);
    }

    finalScore.textContent = score;
    finalHighScore.textContent = highScore;
    highScoreElement.textContent = highScore;
    leftButtonPressed = false;
    rightButtonPressed = false;
    gameOverScreen.hidden = false;
    gameOverScreen.style.display = "flex";
}

restartButton.addEventListener("click", () => {
    enemies.forEach((enemy) => enemy.remove());
    enemies = [];
    score = 0;
    speed = 6;
    roadLineY = -100;
    lastEnemySpawn = 0;
    scoreElement.textContent = "0";
    gameOverScreen.hidden = true;
    gameOverScreen.style.display = "none";
    autoResetPlayer();
    leftButtonPressed = false;
    rightButtonPressed = false;
    gameRunning = true;
});

function spawnEnemies(time) {
    if (gameRunning) {
        const spawnDelay = Math.max(500, 1100 - score * 5);
        if (time - lastEnemySpawn > spawnDelay) {
            if (enemies.length < 4) createEnemy();
            lastEnemySpawn = time;
        }
    }
    requestAnimationFrame(spawnEnemies);
}

function gameLoop() {
    movePlayer();
    moveRoad();
    moveEnemies();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(spawnEnemies);
requestAnimationFrame(gameLoop);

window.addEventListener("resize", () => {
    const maxX = road.clientWidth - player.offsetWidth - 8;
    if (playerX > maxX) {
        playerX = maxX;
        player.style.left = playerX + "px";
    }
});
