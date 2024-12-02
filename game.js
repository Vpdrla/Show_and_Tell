const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 화면 크기 설정
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 게임 환경 설정
const gravity = 0.6;
const groundHeight = 100;
const groundStartX = 0;
const groundEndX = canvas.width; // 포탈 전까지만 땅 길이 설정
let obstacles = [];
let stars = [];
let cameraOffsetX = 0;
let isGameOver = false;
let isLevelTransition = false;
let score = 0;

// 포탈 설정
const portal = {
  x: groundEndX - 100,
  y: canvas.height - groundHeight - 80, // 포탈을 위로 이동
  width: 80,
  height: 100,
  color: "purple"
};

// 플레이어 설정
let player = {
  x: 200, // 플레이어 시작 위치
  y: canvas.height - groundHeight - 50,
  width: 50,
  height: 50,
  color: "blue",
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumpStrength: 18,
  isJumping: false
};

// 키 입력 상태
let keys = {};

// 키보드 이벤트 처리
document.addEventListener("keydown", (event) => {
  keys[event.code] = true;
});
document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

// 충돌 검사 함수
function checkCollision(x, y, width, height, excludeObjects = []) {
  const allObjects = [...obstacles, ...stars, portal];
  return allObjects.filter(obj => !excludeObjects.includes(obj)).some((obj) => {
    return (
      x < obj.x + obj.width &&
      x + width > obj.x &&
      y < obj.y + obj.height &&
      y + height > obj.y
    );
  });
}

// 장애물 생성
function createObstacle() {
  const maxAttempts = 10;
  let attempt = 0;

  // 장애물 간의 최소 및 최대 간격 설정 (캐릭터의 가로 사이즈 3배~6배)
  const minGap = player.width * 3;
  const maxGap = player.width * 6;

  while (attempt < maxAttempts) {
    const obstacleWidth = Math.random() * 50 + 30;
    const obstacleHeight = Math.random() * 50 + 30;
    const obstacleX = obstacles.length === 0 ? player.x + 300 : obstacles[obstacles.length - 1].x + Math.random() * (maxGap - minGap) + minGap; // 이전 장애물과의 간격을 고려한 위치
    const obstacleY = canvas.height - groundHeight - obstacleHeight;

    const isFarEnough = !checkCollision(obstacleX, obstacleY, obstacleWidth, obstacleHeight);

    // 최소 및 최대 간격을 유지하고, 화면 밖으로 나가지 않도록 함
    if (obstacleX < portal.x && isFarEnough) {
      obstacles.push({
        x: obstacleX,
        y: obstacleY,
        width: obstacleWidth,
        height: obstacleHeight,
        color: "red"
      });
      break;
    }

    attempt++;
  }
}

// 별 생성
function createStar() {
  const maxAttempts = 20; // 시도 횟수를 늘려 별 생성 확률 증가
  let attempt = 0;

  while (attempt < maxAttempts) {
    const starX = player.x + 300 + Math.random() * 600; // 플레이어로부터 일정 거리 이후에 생성
    const starY = canvas.height - groundHeight - 70 - Math.random() * 150; // 땅 위에서 랜덤 높이 설정
    const starSize = 15; // 별 크기

    const isFarEnough = !checkCollision(starX, starY, starSize, starSize, stars);

    if (isFarEnough && starX < portal.x) {
      stars.push({
        x: starX,
        y: starY,
        size: starSize,
        color: "#FFD700"
      });
      break;
    }

    attempt++;
  }
}

// 초기 장애물과 별 생성
function initializeGameObjects() {
  for (let i = 0; i < 5; i++) {
    createStar();
  }

  // 장애물 생성, 포탈 전까지만 생성
  while (true) {
    const lastObstacle = obstacles[obstacles.length - 1];
    if (!lastObstacle || lastObstacle.x < portal.x - player.width * 2) {
      createObstacle();
    } else {
      break;
    }
  }
}

// 레벨 전환 처리
function levelTransition() {
  isLevelTransition = true;
  // 화면을 검정색으로 바꾸고 "LEVEL 2" 표시
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = "white";
  ctx.font = "50px Arial";
  ctx.fillText("LEVEL 2", canvas.width / 2 - 100, canvas.height / 2);

  // 3초 후 게임 초기화
  setTimeout(() => {
    resetGame();
  }, 3000);
}

// 게임 상태 업데이트
function update() {
  if (isGameOver || isLevelTransition) return;

  // 중력 적용
  player.velocityY += gravity;
  player.y += player.velocityY;

  // 바닥 충돌 처리
  if (player.y + player.height >= canvas.height - groundHeight) {
    player.y = canvas.height - groundHeight - player.height;
    player.velocityY = 0;
    player.isJumping = false;
  }

  // 플레이어 이동
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
  if (keys["Space"] && !player.isJumping) {
    player.velocityY = -player.jumpStrength;
    player.isJumping = true;
  }

  // 장애물 충돌 처리
  obstacles.forEach((obstacle) => {
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      isGameOver = true;
      alert("Game Over! Your score: " + score);
    }
  });

  // 게임 오버 조건: 화면 아래로 떨어지면 종료
  if (player.y > canvas.height) {
    isGameOver = true;
    alert("Game Over! Your score: " + score);
  }

  // 포탈 충돌 처리
  if (
    player.x + player.width > portal.x &&
    player.x < portal.x + portal.width &&
    player.y + player.height > portal.y &&
    player.y < portal.y + portal.height
  ) {
    levelTransition();
  }

  // 별 충돌 처리
  stars = stars.filter((star) => {
    if (
      player.x < star.x + star.size &&
      player.x + player.width > star.x &&
      player.y < star.y + star.size &&
      player.y + player.height > star.y
    ) {
      score += 100;
      return false; // 별을 수집하면 제거
    }
    return true;
  });

  // 화면 밖으로 나간 장애물 및 별 제거
  obstacles = obstacles.filter((obstacle) => obstacle.x > 0);
  stars = stars.filter((star) => star.x > 0);
}

// 화면 그리기
function draw() {
  if (isLevelTransition) return; // 레벨 전환 중에는 그리지 않음

  ctx.clearRect(0, 0, canvas.width, canvas.height); // 화면을 매 프레임마다 초기화

  // 배경
  ctx.fillStyle = "#87CEEB"; // 하늘색 배경
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 땅 (고정)
  ctx.fillStyle = "#228B22";
  ctx.fillRect(groundStartX, canvas.height - groundHeight, canvas.width, groundHeight); // 땅은 화면 전체 너비로

  // 포탈
  ctx.fillStyle = portal.color;
  ctx.fillRect(portal.x, portal.y, portal.width, portal.height);

  // 장애물 그리기
  obstacles.forEach((obstacle) => {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x - cameraOffsetX, obstacle.y, obstacle.width, obstacle.height);
  });

  // 별 그리기
  stars.forEach((star) => {
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(star.x - cameraOffsetX, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // 플레이어 그리기
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x - cameraOffsetX, player.y, player.width, player.height);

  // 점수 표시
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);
}

// 게임 초기화
function resetGame() {
  obstacles = [];
  stars = [];
  score = 0;
  isGameOver = false;
  isLevelTransition = false;
  player.x = 200;
  player.y = canvas.height - groundHeight - 50;
  player.velocityX = 0;
  player.velocityY = 0;
  player.isJumping = false;
  cameraOffsetX = 0;

  initializeGameObjects(); // 게임 오브젝트 초기화
}

// 게임 루프
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// 게임 시작
initializeGameObjects();
gameLoop();
