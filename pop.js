// Game State Variables
let score = 0;
let lives = 3;
let bubbles = [];
let gameActive = false;
let highestScore = localStorage.getItem('bubbleHighScore') || 0;
let lastPopPosition = { x: 0, y: 0 };

// Create a new bubble
function createBubble() {
    const minSize = 45;
    const maxSize = 90;
    const size = Math.random() * (maxSize - minSize) + minSize;

    const margin = 100;
    let x, y;
    do {
        x = margin + Math.random() * (window.innerWidth - size - 2 * margin);
        y = margin + Math.random() * (window.innerHeight - size - 2 * margin);
    } while (Math.abs(x - lastPopPosition.x) < 200 && Math.abs(y - lastPopPosition.y) < 200);

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;

    bubble.addEventListener('click', () => popBubble(bubble));
    document.getElementById('gameContainer').appendChild(bubble);
    bubbles.push(bubble);
}

// Pop a bubble
function popBubble(bubble) {
    bubble.classList.add('popped');
    score++;
    updateScore();
    lastPopPosition = { x: bubble.offsetLeft, y: bubble.offsetTop };

    setTimeout(() => {
        bubble.remove();
        bubbles = bubbles.filter(b => b !== bubble);
    }, 100);
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Start the game
function startGame() {
    gameActive = true;
    score = 0;
    lives = 3;
    updateScore();

    document.getElementById('gameOverScreen').style.display = 'none';
}

// Toggle Theme
function toggleTheme() {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
}

// Initialize Game
document.getElementById('popButton').addEventListener('click', startGame);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
