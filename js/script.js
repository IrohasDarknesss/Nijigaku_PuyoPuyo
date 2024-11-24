// 初期設定
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;

let score = 0;
let nextCharacter;
let currentCharacter;
let characters = [];
let isGameOver = false;

const characterPaths = [
  './img/yu.jpeg',
  './img/ai.jpeg',
  './img/ayumu.jpeg',
  './img/emma.jpeg',
  './img/kanata.jpeg',
  './img/karin.jpeg',
  './img/kasumi.jpg',
  './img/mia.jpeg',
  './img/ranju.jpeg',
  './img/rina.jpeg',
  './img/setuna.jpeg',
  './img/shioriko.jpeg',
  './img/shizuku.jpg'
];

const characterImages = [];
let imagesLoaded = 0;

// キャラクター画像の読み込み
characterPaths.forEach((path, idx) => {
  const img = new Image();
  img.src = path;
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === characterPaths.length) {
      startGame();
    }
  };
  characterImages.push({ img, id: idx });
});

// ランダムキャラクター取得
function getRandomCharacter() {
  const idx = Math.floor(Math.random() * characterImages.length);
  return {
    img: characterImages[idx].img,
    id: characterImages[idx].id,
    x: Math.floor(width / 2 / 40) * 40 + 20,
    y: 0,
  };
}

// スコア表示
function updateScore() {
  document.getElementById("score").innerText = `スコア: ${score}`;
}

// キャラクター描画
function drawCharacter(character) {
  const radius = 20;
  ctx.drawImage(character.img, character.x - radius, character.y - radius, radius * 2, radius * 2);
}

// 衝突判定
function checkCollision(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < 40;
}

// グリッドにスナップ
function snapToGrid(character) {
  character.x = Math.round((character.x - 20) / 40) * 40 + 20; // x座標を40ピクセル単位にスナップ
  character.y = Math.round(character.y / 40) * 40; // y座標を40ピクセル単位にスナップ
}

// 連鎖処理
function handleChainReaction() {
  const toRemove = new Set();
  const grid = Array.from({ length: Math.ceil(height / 40) }, () => Array(Math.ceil(width / 40)).fill(null));

  // グリッド構造にキャラクターを登録
  characters.forEach(c => {
    const gridX = Math.floor((c.x - 20) / 40);
    const gridY = Math.floor(c.y / 40);
    grid[gridY][gridX] = c;
  });

  const directions = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 }
  ];

  function findMatches(x, y, dx, dy) {
    const matches = [];
    const startCell = grid[y]?.[x];
    if (!startCell) return matches;

    let currX = x;
    let currY = y;

    while (
      grid[currY]?.[currX] &&
      grid[currY][currX].id === startCell.id
    ) {
      matches.push(grid[currY][currX]);
      currX += dx;
      currY += dy;
    }

    return matches;
  }

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!grid[y][x]) continue;

      directions.forEach(({ dx, dy }) => {
        const matches = findMatches(x, y, dx, dy);
        if (matches.length >= 3) {
          matches.forEach(c => toRemove.add(c));
        }
      });
    }
  }

  if (toRemove.size > 0) {
    toRemove.forEach(c => {
      const idx = characters.indexOf(c);
      if (idx > -1) characters.splice(idx, 1);
    });

    score += toRemove.size;
    updateScore();
    recalculateCharacterPositions(grid);
    handleChainReaction();
  }
}

// キャラクターの再配置
function recalculateCharacterPositions(grid) {
  for (let x = 0; x < grid[0].length; x++) {
    const column = [];
    for (let y = grid.length - 1; y >= 0; y--) {
      if (grid[y][x]) {
        column.push(grid[y][x]);
        grid[y][x] = null;
      }
    }

    let emptyRow = grid.length - 1;
    column.forEach(character => {
      character.y = emptyRow * 40;
      character.x = x * 40 + 20;
      grid[emptyRow][x] = character;
      emptyRow--;
    });
  }
}

// ゲームループ
function gameLoop() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, width, height);

  drawCharacter({ x: width / 2, y: 30, img: nextCharacter.img });

  currentCharacter.y += 2;
  drawCharacter(currentCharacter);

  if (
    currentCharacter.y + 20 >= height ||
    characters.some(c => checkCollision(currentCharacter, c))
  ) {
    snapToGrid(currentCharacter);
    characters.push({ ...currentCharacter });
    handleChainReaction();

    if (characters.some(c => c.y <= 20)) {
      isGameOver = true;
      alert("ゲームオーバー");
      resetGame();
      return;
    }

    currentCharacter = { ...nextCharacter };
    nextCharacter = getRandomCharacter();
  }

  characters.forEach(c => drawCharacter(c));

  requestAnimationFrame(gameLoop);
}

// ゲームリセット
function resetGame() {
  score = 0;
  characters = [];
  isGameOver = false;
  updateScore();
  startGame();
}

// 入力処理
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" && currentCharacter.x > 20) {
    currentCharacter.x -= 40;
    snapToGrid(currentCharacter);
  }
  if (e.key === "ArrowRight" && currentCharacter.x < width - 20) {
    currentCharacter.x += 40;
    snapToGrid(currentCharacter);
  }
  if (e.key === " ") {
    currentCharacter.y += 10;
  }
});

// ゲーム開始
function startGame() {
  score = 0;
  characters = [];
  isGameOver = false;

  nextCharacter = getRandomCharacter();
  currentCharacter = { ...nextCharacter };
  nextCharacter = getRandomCharacter();
  updateScore();
  gameLoop();
}