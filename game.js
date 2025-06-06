const BOARD_SIZE = 8;
const TYPES = [
    'brood',
    'cracker',
    'lavendel',
    'paturain'
];

let board = [];
let score = 0;
let moves = 0;
let selectedTile = null;
let timeLeft = 60;
let timer;
let isGameOver = false;
let audioContext;
let beepSound;
let isFirstMove = true;

// Afbeeldingen voor de verschillende types
const IMAGES = {
    brood: 'brood.png',
    cracker: 'cracker.png',
    lavendel: 'lavendel.png',
    paturain: 'paturainnaturel.png'
};

// Puntenstelsel
const POINTS = {
    brood: 30,
    cracker: 30,
    lavendel: 30,
    paturain: 50,
    ruit: 40,
    vijf: 50
};

// Initialize audio
function initializeAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    beepSound = audioContext.createOscillator();
    beepSound.type = 'square';
    beepSound.frequency.value = 440;
    beepSound.connect(audioContext.destination);
}

// Start timer
function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        
        if (timeLeft <= 10) {
            document.getElementById('timer').style.color = 'red';
            if (timeLeft % 2 === 0) {
                beepSound.start();
                setTimeout(() => beepSound.stop(), 100);
            }
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            gameOver();
        }
    }, 1000);
}

// Game over
function gameOver() {
    isGameOver = true;
    alert(`Game Over!\nScore: ${score}\nMoves: ${moves}`);
    document.getElementById('new-game').textContent = 'Nieuw spel starten';
}

function initializeBoard() {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            let type = TYPES[Math.floor(Math.random() * TYPES.length)];
            board[i][j] = type;
        }
    }
    // Controleer en verwijder eventuele combinaties
    removeMatches();
}

function createBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.backgroundImage = `url(${IMAGES[board[i][j]]})`;
            tile.dataset.row = i;
            tile.dataset.col = j;
            tile.addEventListener('click', handleTileClick);
            gameBoard.appendChild(tile);
        }
    }
}

function handleTileClick(e) {
    const tile = e.target;
    const row = parseInt(tile.dataset.row);
    const col = parseInt(tile.dataset.col);
    
    if (!selectedTile) {
        selectedTile = { row, col };
        tile.classList.add('selected');
    } else {
        if (Math.abs(row - selectedTile.row) + Math.abs(col - selectedTile.col) === 1) {
            // Shuffle animation
            const tile1 = document.querySelector(`[data-row="${selectedTile.row}"][data-col="${selectedTile.col}"]`);
            const tile2 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            
            // Add shuffle animation class
            tile1.classList.add('shuffle');
            tile2.classList.add('shuffle');
            
            // Swap tiles
            const temp = board[selectedTile.row][selectedTile.col];
            board[selectedTile.row][selectedTile.col] = board[row][col];
            board[row][col] = temp;
            
            // Update UI
            createBoard();
            
            // Check for matches
            const matches = findMatches();
            if (matches.length > 0) {
                // Calculate score based on the type of matched items
                let matchScore = 0;
                const matchedTypes = new Set(matches.map(([r, c]) => board[r][c]));
                
                // Calculate points for each type
                matchedTypes.forEach(type => {
                    const count = matches.filter(([r, c]) => board[r][c] === type).length;
                    if (type === 'paturain') {
                        matchScore += count * POINTS.paturain;
                    } else {
                        matchScore += count * POINTS[type];
                    }
                });
                
                // Check for special combinations
                const matchLength = matches.length;
                if (matchLength === 4) {
                    matchScore += POINTS.ruit;
                } else if (matchLength >= 5) {
                    matchScore += POINTS.vijf;
                }
                
                // Animate matched tiles
                matches.forEach(([r, c]) => {
                    const matchedTile = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    matchedTile.classList.add('matched');
                    setTimeout(() => {
                        matchedTile.classList.remove('matched');
                    }, 500);
                });
                
                removeMatches(matches);
                score += matchScore;
                document.getElementById('score').textContent = score;
                
                // Start timer after first move
                if (isFirstMove) {
                    isFirstMove = false;
                    startTimer();
                }
            } else {
                // No matches, swap back
                const temp = board[selectedTile.row][selectedTile.col];
                board[selectedTile.row][selectedTile.col] = board[row][col];
                board[row][col] = temp;
                createBoard();
            }
            
            moves++;
            document.getElementById('moves').textContent = moves;
            selectedTile = null;
            
            // Remove shuffle animation
            setTimeout(() => {
                tile1.classList.remove('shuffle');
                tile2.classList.remove('shuffle');
            }, 500);
        } else {
            selectedTile = { row, col };
            const selectedTiles = document.querySelectorAll('.selected');
            selectedTiles.forEach(t => t.classList.remove('selected'));
            tile.classList.add('selected');
        }
    }
}

function findMatches() {
    const matches = [];
    
    // Check horizontal matches
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE - 2; j++) {
            if (board[i][j] === board[i][j + 1] && board[i][j] === board[i][j + 2]) {
                matches.push([i, j], [i, j + 1], [i, j + 2]);
                // Check for 4 in a row
                if (j < BOARD_SIZE - 3 && board[i][j] === board[i][j + 3]) {
                    matches.push([i, j + 3]);
                }
                // Check for 5 in a row
                if (j < BOARD_SIZE - 4 && board[i][j] === board[i][j + 4]) {
                    matches.push([i, j + 4]);
                }
            }
        }
    }
    
    // Check vertical matches
    for (let j = 0; j < BOARD_SIZE; j++) {
        for (let i = 0; i < BOARD_SIZE - 2; i++) {
            if (board[i][j] === board[i + 1][j] && board[i][j] === board[i + 2][j]) {
                matches.push([i, j], [i + 1, j], [i + 2, j]);
                // Check for 4 in a column
                if (i < BOARD_SIZE - 3 && board[i][j] === board[i + 3][j]) {
                    matches.push([i + 3, j]);
                }
                // Check for 5 in a column
                if (i < BOARD_SIZE - 4 && board[i][j] === board[i + 4][j]) {
                    matches.push([i + 4, j]);
                }
            }
        }
    }
    
    return matches;
}

function removeMatches(matches = findMatches()) {
    if (matches.length === 0) return;
    
    // Remove matched tiles
    matches.forEach(([row, col]) => {
        board[row][col] = null;
    });
    
    // Drop tiles from above
    for (let j = 0; j < BOARD_SIZE; j++) {
        let emptySpaces = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (board[i][j] === null) {
                emptySpaces.push(i);
            }
        }
        
        if (emptySpaces.length > 0) {
            for (let i = BOARD_SIZE - 1; i >= 0; i--) {
                if (board[i][j] !== null) {
                    const emptyIndex = emptySpaces.pop();
                    board[emptyIndex][j] = board[i][j];
                    board[i][j] = null;
                    if (emptySpaces.length === 0) break;
                }
            }
        }
    }
    
    // Fill empty spaces at top
    for (let j = 0; j < BOARD_SIZE; j++) {
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (board[i][j] === null) {
                board[i][j] = TYPES[Math.floor(Math.random() * TYPES.length)];
            }
        }
    }
    
    createBoard();
    
    // Check for new matches
    const newMatches = findMatches();
    if (newMatches.length > 0) {
        removeMatches(newMatches);
    }
}

function newGame() {
    if (timer) clearInterval(timer);
    score = 0;
    moves = 0;
    timeLeft = 60;
    isGameOver = false;
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = moves;
    document.getElementById('timer').textContent = timeLeft;
    document.getElementById('timer').style.color = '';
    document.getElementById('new-game').textContent = 'Nieuw spel';
    initializeBoard();
    createBoard();
    startTimer();
    initializeAudio();
}

// Event listeners
const newGameButton = document.getElementById('new-game');
newGameButton.addEventListener('click', newGame);

// Start game
initializeBoard();
createBoard();
