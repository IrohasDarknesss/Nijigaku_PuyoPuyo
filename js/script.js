// 初期設定
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const columns = 13; // 横マス数
const rows = 20; // 縦マス数
const tileSize = 40; // マスのサイズ（ピクセル単位）
canvas.width = columns * tileSize;
canvas.height = rows * tileSize;

let score = 0;
let nextCharacter;
let currentCharacter;
let grid = Array.from({ length: rows }, () => Array(columns).fill(null));
let isGameOver = false;

let dropSpeed = 700; // 自然落下の初期スピード（ミリ秒単位）
let softDropSpeed = 50; // ソフトドロップの速度
let dropInterval = null; // 落下用タイマー
let isSoftDropping = false; // ソフトドロップ中かどうか

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
    x: Math.floor(columns / 2), // 中央スタート
    y: 0,
  };
}

// スコア表示
function updateScore() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.clearRect(canvas.width - 200, 0, 200, 40); // スコアエリアをクリア
  ctx.fillText(`Score: ${score}`, canvas.width - 180, 30);
}

// 次のキャラクター描画
function drawNextCharacter() {
  ctx.clearRect(0, 0, 160, 40); // 次のキャラクター表示エリアをクリア
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Next:", 10, 30);

  if (nextCharacter) {
    ctx.drawImage(
      nextCharacter.img,
      80, 10, // 描画位置
      tileSize, tileSize
    );
  }
}

// キャラクター描画
function drawCharacter(character) {
  ctx.drawImage(
    character.img,
    character.x * tileSize,
    character.y * tileSize,
    tileSize,
    tileSize
  );
}

// グリッド全体を描画
function drawGrid() {
  ctx.clearRect(0, 40, canvas.width, canvas.height); // ゲーム領域をクリア
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        drawCharacter({ ...cell, x, y });
      }
    });
  });

  // 現在の落下キャラクターを描画
  if (currentCharacter) {
    drawCharacter(currentCharacter);
  }
}

// 衝突判定
function checkCollision(x, y) {
  return y >= rows || (y >= 0 && grid[y][x] !== null);
}

// キャラクターを固定する
function fixCharacter() {
  grid[currentCharacter.y][currentCharacter.x] = { ...currentCharacter };
}

// アニメーション付きの連鎖処理
function handleChainReaction() {
  const matches = findMatches(); // マッチを取得
  if (matches.length === 0) return;

  // 一つずつ消す処理
  let delay = 0;
  matches.forEach((match, idx) => {
    setTimeout(() => {
      match.forEach(({ x, y }) => {
        grid[y][x] = null;
      });
      score += match.length; // スコアを加算
      updateScore();
      applyGravity(); // 重力を適用
      drawGrid();
    }, delay);
    delay += 300; // 次のマッチを消すまでの遅延
  });
}

// マッチを探す
function findMatches() {
  const matches = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const cell = grid[y][x];
      if (!cell) continue;

      const directions = [
        { dx: 1, dy: 0 }, // 横
        { dx: 0, dy: 1 }, // 縦
      ];

      directions.forEach(({ dx, dy }) => {
        const match = [];
        let nx = x;
        let ny = y;

        while (
          nx >= 0 &&
          ny >= 0 &&
          nx < columns &&
          ny < rows &&
          grid[ny][nx] &&
          grid[ny][nx].id === cell.id
        ) {
          match.push({ x: nx, y: ny });
          nx += dx;
          ny += dy;
        }

        if (match.length >= 3) {
          matches.push(match);
        }
      });
    }
  }
  return matches;
}

// 重力の適用
function applyGravity() {
  for (let x = 0; x < columns; x++) {
    const column = grid.map(row => row[x]).filter(cell => cell !== null);
    for (let y = rows - 1; y >= 0; y--) {
      grid[y][x] = column.pop() || null;
    }
  }
}

// 自然落下処理
function dropCharacter() {
  if (!checkCollision(currentCharacter.x, currentCharacter.y + 1)) {
    currentCharacter.y++;
    drawGrid();
  } else {
    fixCharacter();
    handleChainReaction();

    if (grid[0].some(cell => cell !== null)) {
      isGameOver = true;
      alert("ゲームオーバー");
      resetGame();
      return;
    }

    currentCharacter = nextCharacter;
    nextCharacter = getRandomCharacter();
    drawNextCharacter();
    drawGrid();
  }
}

// 自然落下の開始
function startNaturalDrop() {
  if (dropInterval) clearInterval(dropInterval); // 既存のタイマーをクリア
  const speed = isSoftDropping ? softDropSpeed : dropSpeed;
  dropInterval = setInterval(dropCharacter, speed);
}

// 入力処理
document.addEventListener("keydown", e => {
  if (!currentCharacter) return;

  if (e.key === "ArrowLeft" && !checkCollision(currentCharacter.x - 1, currentCharacter.y)) {
    currentCharacter.x--;
    drawGrid();
  }
  if (e.key === "ArrowRight" && !checkCollision(currentCharacter.x + 1, currentCharacter.y)) {
    currentCharacter.x++;
    drawGrid();
  }
  if (e.key === " ") {
    isSoftDropping = true;
    startNaturalDrop();
  }
});

document.addEventListener("keyup", e => {
  if (e.key === " ") {
    isSoftDropping = false;
    startNaturalDrop();
  }
});

// ゲームリセット
function resetGame() {
  score = 0;
  grid = Array.from({ length: rows }, () => Array(columns).fill(null));
  isGameOver = false;
  clearInterval(dropInterval);
  startGame();
}

// ゲーム開始
function startGame() {
  score = 0;
  grid = Array.from({ length: rows }, () => Array(columns).fill(null));
  isGameOver = false;

  nextCharacter = getRandomCharacter();
  currentCharacter = getRandomCharacter();
  drawNextCharacter();
  updateScore(); // 初期スコアを表示
  drawGrid();
  startNaturalDrop();
}