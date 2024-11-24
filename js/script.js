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
    x: width / 2,
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

// 連鎖処理
function handleChainReaction() {
  const toRemove = new Set();
  const grid = Array.from({ length: Math.ceil(height / 40) }, () => Array(Math.ceil(width / 40)).fill(null));

  // グリッド構造にキャラクターを登録
  characters.forEach(c => {
    const gridX = Math.floor(c.x / 40);
    const gridY = Math.floor(c.y / 40);
    grid[gridY][gridX] = c;
  });

  const directions = [
    { dx: 1, dy: 0 },  // 横方向
    { dx: 0, dy: 1 },  // 縦方向
    { dx: 1, dy: 1 },  // 右下斜め
    { dx: 1, dy: -1 }  // 右上斜め
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
    handleChainReaction(); // 再帰的に連鎖処理
  }
}

// キャラクターの再配置
function recalculateCharacterPositions(grid) {
  for (let x = 0; x < grid[0].length; x++) {
    let emptyRow = null;
    for (let y = grid.length - 1; y >= 0; y--) {
      if (grid[y][x] === null) {
        emptyRow = y;
      } else if (emptyRow !== null) {
        const character = grid[y][x];
        character.y += (emptyRow - y) * 40;
        grid[emptyRow][x] = character;
        grid[y][x] = null;
        emptyRow--;
      }
    }
  }
}

// ゲームループ
function gameLoop() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, width, height);

  // 次に落ちるキャラクターの描画
  drawCharacter({ x: width / 2, y: 30, img: nextCharacter.img });

  // 現在のキャラクターの移動と描画
  currentCharacter.y += 2;
  drawCharacter(currentCharacter);

  // キャラクターが地面または他のキャラクターに衝突した場合
  if (
    currentCharacter.y + 20 >= height ||
    characters.some(c => checkCollision(currentCharacter, c))
  ) {
    // キャラクターの最終位置を調整し、リストに追加
    currentCharacter.y = Math.min(currentCharacter.y, height - 20);
    characters.push({ ...currentCharacter });

    // 連鎖処理の実行
    handleChainReaction();

    // ゲームオーバー判定
    if (characters.some(c => c.y <= 20)) {
      isGameOver = true;
      alert("ゲームオーバー");
      resetGame();
      return;
    }

    // 次のキャラクターを現在のキャラクターに設定し、新しいキャラクターを生成
    currentCharacter = { ...nextCharacter };
    nextCharacter = getRandomCharacter();
  }

  // 全てのキャラクターを描画
  characters.forEach(c => drawCharacter(c));

  // 次のフレームをリクエスト
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
  if (e.key === "ArrowLeft" && currentCharacter.x > 20) currentCharacter.x -= 20;
  if (e.key === "ArrowRight" && currentCharacter.x < width - 20) currentCharacter.x += 20;
  if (e.key === " ") currentCharacter.y += 10;
});

// ゲーム開始
function startGame() {
  score = 0;
  characters = [];
  isGameOver = false;

  nextCharacter = getRandomCharacter();
  currentCharacter = { ...nextCharacter }; // 最初のキャラクターを設定
  nextCharacter = getRandomCharacter();    // 次のキャラクターを生成
  updateScore();
  gameLoop();
}