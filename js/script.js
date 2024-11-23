// 初期設定
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;

let score = 0;
let nextCharacter;
let currentCharacter;
let characters = []; // 落下したキャラのリスト
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
let imagesLoaded = 0; // ロード済み画像カウント

// キャラクター画像の読み込み
characterPaths.forEach(path => {
  const img = new Image();
  img.src = path;
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === characterPaths.length) {
      startGame(); // 全ての画像がロードされたらゲーム開始
    }
  };
  characterImages.push(img);
});

// ランダムキャラクター取得
function getRandomCharacter() {
  const idx = Math.floor(Math.random() * characterImages.length);
  return { img: characterImages[idx], id: idx };
}

// スコア表示
function updateScore() {
  document.getElementById("score").innerText = `スコア: ${score}`;
}

// キャラクター描画
function drawCharacter(character) {
  const radius = 20; // 円形の半径
  ctx.drawImage(character.img, character.x - radius, character.y - radius, radius * 2, radius * 2);
}

// 衝突判定
function checkCollision(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < 40; // 半径 * 2
}

// キャラの連鎖処理
function handleChainReaction() {
  const toRemove = [];
  characters.forEach((c1, i) => {
    const cluster = characters.filter(c2 => c1.id === c2.id && checkCollision(c1, c2));
    if (cluster.length >= 3) {
      toRemove.push(...cluster);
    }
  });

  toRemove.forEach(c => {
    const idx = characters.indexOf(c);
    if (idx > -1) characters.splice(idx, 1);
  });

  score += toRemove.length;
  updateScore();
}

// ゲームループ
function gameLoop() {
    if (isGameOver) return;
  
    ctx.clearRect(0, 0, width, height);
  
    // 次に落下するキャラの表示
    drawCharacter({ x: width / 2, y: 30, img: nextCharacter.img }); // 次のキャラは画面上部に表示
  
    // 現在のキャラの描画
    currentCharacter.y += 2; // 落下速度を制御
    drawCharacter(currentCharacter);
  
    // 衝突または画面下端到達判定
    if (
      currentCharacter.y + 20 >= height || // 画面下端
      characters.some(c => checkCollision(currentCharacter, c)) // 他キャラクターとの衝突
    ) {
      // 現在のキャラクターを固定
      currentCharacter.y = Math.min(currentCharacter.y, height - 20); // 下端の位置に調整
      characters.push({ ...currentCharacter }); // キャラリストに追加
      handleChainReaction(); // 連鎖処理
  
      // ゲームオーバー判定
      if (currentCharacter.y <= 20) {
        isGameOver = true;
        alert("ゲームオーバー");
        return;
      }
  
      // 次のキャラクターを準備
      currentCharacter = { x: width / 2, y: 0, img: nextCharacter.img };
      nextCharacter = getRandomCharacter();
    }
  
    // 落下したキャラクターの描画
    characters.forEach(c => drawCharacter(c));
  
    requestAnimationFrame(gameLoop);
  }

// 入力処理
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" && currentCharacter.x > 20) currentCharacter.x -= 20;
  if (e.key === "ArrowRight" && currentCharacter.x < width - 20) currentCharacter.x += 20;
  if (e.key === " ") currentCharacter.y += 10; // 強制落下
});

// ゲーム開始関数
function startGame() {
  nextCharacter = getRandomCharacter();
  currentCharacter = { x: width / 2, y: 0, img: nextCharacter.img };
  gameLoop();
}