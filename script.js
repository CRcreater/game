const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let bonusInterval = 100; // Интервал для бонусных очков в секундах
let elapsedTimeSinceLastBonus = 0; // Время, прошедшее с последнего получения бонусных очков

// Загрузка сохраненного счета из localStorage при запуске игры
let savedScore = localStorage.getItem("score");
let score = savedScore ? parseInt(savedScore) : 0;

// Переменная для хранения рекордного времени
let recordTime = localStorage.getItem("recordTime") ? parseInt(localStorage.getItem("recordTime")) : 0;

// Параметры игрока
let player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30,
    height: 30,
    speed: 5,
    color: "blue" // Цвет по умолчанию
};

// Управление
const keys = {};
const leftKey = 65; // A
const rightKey = 68; // D

window.addEventListener("keydown", function(event) {
    keys[event.keyCode] = true;
});
window.addEventListener("keyup", function(event) {
    delete keys[event.keyCode];
});

// Пули
const bullets = [];
const bulletSpeed = 8;

// Параметры врага
const enemySize = 30;
const enemies = [];
let enemySpeed = 2; // Изначальная скорость врагов
const spawnRate = 1000; // миллисекунды
let lastSpawn = -1;
let lastSpeedIncrease = performance.now(); // Переменная для отслеживания времени последнего увеличения скорости
const speedIncreaseInterval = 10000; // Интервал увеличения скорости врагов в миллисекундах
const speedIncreaseAmount = 0.5; // Количество, на которое увеличивается скорость врагов каждый раз

function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - enemySize),
        y: 0,
        width: enemySize,
        height: enemySize
    });
    lastSpawn = performance.now();
}

function shoot() {
    bullets.push({
        x: player.x + player.width / 2,
        y: player.y,
        width: 5,
        height: 5
    });
}

// Проверка столкновения двух прямоугольников
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Игровой цикл
let startTime = performance.now(); // Переменная для хранения времени начала игры
let lastScoreUpdate = startTime; // Переменная для хранения времени последнего обновления очков
function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Вычисление прошедшего времени
    const elapsedTime = Math.floor((timestamp - startTime) / 1000); // в секундах

    // Добавление очков каждые 100 секунд
    if (timestamp - lastScoreUpdate >= 100000) { // 100000 миллисекунд = 100 секунд
        score += 100;
        lastScoreUpdate = timestamp;
    }

    // Перемещение игрока
    if (keys[leftKey]) { // A
        if (player.x - player.speed >= 0) { // Проверяем, не выходит ли игрок за левую границу
            player.x -= player.speed;
        }
    }
    if (keys[rightKey]) { // D
        if (player.x + player.width + player.speed <= canvas.width) { // Проверяем, не выходит ли игрок за правую границу
            player.x += player.speed;
        }
    }

    // Отрисовка игрока
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Перемещение и отрисовка пуль
    bullets.forEach((bullet, index) => {
        bullet.y -= bulletSpeed;
        ctx.fillStyle = "red";
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Удаление пуль за пределами холста
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });

    // Создание врагов
    if (timestamp - lastSpawn > spawnRate) {
        spawnEnemy();
    }

    // Увеличение скорости врагов каждые 10 секунд
    if (timestamp - lastSpeedIncrease > speedIncreaseInterval) {
        enemySpeed += speedIncreaseAmount;
        lastSpeedIncrease = timestamp;
    }

    // Перемещение и отрисовка врагов
    enemies.forEach((enemy, index) => {
        enemy.y += enemySpeed;
        ctx.fillStyle = "green";
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Проверка столкновения с игроком
        if (checkCollision(player, enemy)) {
            alert("Конец игры! Счет: " + score);
            localStorage.setItem("score", score.toString()); // Сохранение счета перед перезаходом
            location.reload(); // Перезагрузка страницы для перезапуска игры
        }

        // Проверка столкновения с пулями
        bullets.forEach((bullet, bulletIndex) => {
            if (checkCollision(bullet, enemy)) {
                enemies.splice(index, 1);
                bullets.splice(bulletIndex, 1);
                score += 10; // Увеличение счета
            }
        });

        // Удаление врагов за пределами холста
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });

    // Отображение счета
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Счет: " + score, 10, 30);

    // Отображение прошедшего времени
    ctx.fillText("Время: " + elapsedTime + "с", 10, 60);

    // Обновление рекорда времени
    if (elapsedTime > recordTime) {
        recordTime = elapsedTime;
        // Сохранение рекордного времени в localStorage
        localStorage.setItem("recordTime", recordTime);
    }

    // Отображение рекорда времени
    ctx.fillText("Рекорд: " + recordTime + "с", 10, 90);

    requestAnimationFrame(gameLoop);
}

// Стрельба при нажатии пробела
window.addEventListener("keydown", function(event) {
    if (event.keyCode === 32) { // Пробел
        shoot();
    }
});

// Обработка покупки скина
document.getElementById("shop").addEventListener("click", function(event) {
    if (event.target.tagName === "LI") {
        const skinId = event.target.id;
        const skinPrice = parseInt(event.target.textContent.split("-")[1]);
        const purchasedSkin = localStorage.getItem("skin");

        // Если скин еще не куплен, проверяем, достаточно ли очков для его покупки
        if (score >= skinPrice && purchasedSkin !== skinId) {
            alert("Вы купили скин " + skinId);
            // Применяем купленный скин к игроку
            if (skinId === "skin1") {
                player.color = "red";
            } else if (skinId === "skin2") {
                player.color = "yellow";
            } else if (skinId === "skin3") {
                player.color = "violet";
            }
            // Сохранение купленного скина
            localStorage.setItem("skin", skinId);
            // Вычет стоимости скина из очков
            score -= skinPrice;
            // Сохранение измененного количества очков
            localStorage.setItem("score", score.toString());
        } else if (purchasedSkin === skinId) {
            alert("У вас уже есть этот скин!");
        } else {
            alert("Недостаточно очков для покупки этого скина!");
        }
    }
});

// Загрузка сохраненного скина из localStorage при запуске игры
let savedSkin = localStorage.getItem("skin");
if (savedSkin) {
    if (savedSkin === "skin1") {
        player.color = "red";
    } else if (savedSkin === "skin2") {
        player.color = "yellow";
    } else if (savedSkin === "skin3") {
        player.color = "violet";
    }
}

gameLoop();