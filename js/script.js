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

let dropSpeed = 1000; // 自然落下の初期スピード（ミリ秒単位）
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
  document.getElementById("score").innerText = `スコア: ${score}`;
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        drawCharacter({ ...cell, x, y });
      }
    });
  });

  // 次に落ちるキャラクターの描画
  if (nextCharacter) {
    drawCharacter({ ...nextCharacter, y: -1 });
  }

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

// 連鎖処理
function handleChainReaction() {
  let matched = false;

  // 3つ以上の連続したキャラクターを探して削除
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const cell = grid[y][x];
      if (!cell) continue;

      const directions = [
        { dx: 1, dy: 0 }, // 横
        { dx: 0, dy: 1 }, // 縦
      ];

      directions.forEach(({ dx, dy }) => {
        const matches = [];
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
          matches.push({ x: nx, y: ny });
          nx += dx;
          ny += dy;
        }

        if (matches.length >= 3) {
          matched = true;
          matches.forEach(({ x, y }) => {
            grid[y][x] = null;
          });
        }
      });
    }
  }

  // 空いたスペースに積み上げを再配置
  if (matched) {
    for (let x = 0; x < columns; x++) {
      const column = grid.map(row => row[x]).filter(cell => cell !== null);
      for (let y = rows - 1; y >= 0; y--) {
        grid[y][x] = column.pop() || null;
      }
    }
    handleChainReaction(); // 再帰的に連鎖を処理
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
    drawGrid();
  }
}

// 自然落下の開始
function startNaturalDrop() {
  if (dropInterval) clearInterval(dropInterval); // 既存のタイマーをクリア

  const speed = isSoftDropping ? softDropSpeed : dropSpeed;
  dropInterval = setInterval(dropCharacter, speed); // 現在の速度で再スタート
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
    startNaturalDrop(); // ソフトドロップの速度で落下
  }
});

// スペースキーを離した時の処理
document.addEventListener("keyup", e => {
  if (e.key === " ") {
    isSoftDropping = false;
    startNaturalDrop(); // 通常の自然落下速度に戻す
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
  drawGrid();
  startNaturalDrop(); // 自然落下を開始
}