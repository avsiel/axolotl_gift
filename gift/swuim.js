// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ
// ============================================

let isNight = false;           // true = ночной режим, false = день
let isNetMode = false;         // true = активен режим сачка
let isSpongeMode = false;      // true = активен режим губки
let isPawMode = false;         // true = активен режим лапки (поглаживание)
let isMouseDown = false;       // true = ЛКМ зажата (для drag-инструментов)
let isMuted = false;           // true = звук выключен

let speechLinesQueue = [];     // Очередь строк текущей реплики (для многострочного вывода)
let currentLineTimeout = null; // ID setTimeout для автоскрытия облачка
let lastPetSpeechTime = 0;     // Время последней реплики при поглаживании (анти-спам)
let typingInterval = null;     // ID setInterval для эффекта печати текста
let blinkInterval = null;      // ID setInterval для автоматического моргания

const MAX_VOLUME = 0.15;       // Громкость фоновой музыки (15%)

// Ссылки на DOM-элементы (заполняются в init(), после загрузки страницы)
let aquarium, spriteImg, lightIconImg, characterContainer;
let btnNet, btnSponge, btnPaw;
let netCursor, spongeCursor, pawCursor;
let chatBubble, bubbleText;
let soundIconImg, ostDay, ostNight, soundBoop;

// ============================================
// ФРАЗЫ АКСОЛОТЛЯ (БЕЗ ИИ, ЛОКАЛЬНЫЕ)
// ============================================

const axolotlPhrases = {
    // Реплики при нажатии кнопки «Чат»
    chat: [
        "Привет, хозяин! Я соскучился!",
        "В воде сегодня так уютно...",
        "Знаешь секрет? Жабры — это антенны для милоты!",
        "Я нашёл блестящий камешек! Держи!",
        "Буль-буль! Это значит 'я тебя люблю'!",
        "Хозяин, а можно ещё креветок?",
        "Я тут подумал... ты самый лучший!",
        "Видел рыбку? Она мне подмигнула!",
        "Мои жабры шевелятся от счастья!",
        "Пластилиновые объятия тебе!",
        "Я нарисовал пузырьками сердечко!",
        "Ты пришёл! Я так рад!",
        "Вода тёплая, как твоя улыбка!",
        "Я спрятал сокровище под камнем!",
        "Булькаю мелодию для тебя!",
        "Хозяин, обними меня лапкой!",
        "Я аксолотль, я мокрый и счастливый!",
        "Сегодня отличный день для плавания!",
        "Ты заметил, как я красиво поплыл?",
        "Пузыри, пузыри, везде пузыри!"
    ],
    // Реплики после кормления
    feed: [
        "Очень вкусно! Ещё!",
        "Креветка — это любовь!",
        "Ням-ням, спасибо, хозяин!",
        "Мой животик доволен!",
        "Вкуснятина! Ты лучший!",
        "Я бы съел ещё десяток!",
        "Облизываю усики!",
        "Это было объедение!",
        "Корми меня ещё, пожалуйста!",
        "Я счастливый аксолотль!"
    ],
    // Реплики после уборки грязи
    clean: [
        "Какая чистота! Люблю!",
        "Вода снова прозрачная!",
        "Спасибо за уборку, хозяин!",
        "Теперь видно мои жабры!",
        "Чистый дом — счастливый аксолотль!",
        "Можно теперь красиво поплавать!",
        "Ты мой герой уборки!",
        "Блестит! Как мои глазки!",
        "Уютно теперь!",
        "Чистота — здоровье, булька!"
    ],
    // Реплики при поглаживании
    pet: [
        "М-м-м, приятно!",
        "Ещё погладь, пожалуйста!",
        "Твоя лапка такая тёплая!",
        "Я таю от нежности!",
        "Это лучший массаж!",
        "Мурлычу... булькаю...",
        "Не останавливайся!",
        "Я счастливый пластилин!",
        "Ты меня балуешь!",
        "Люблю, когда меня гладят!"
    ]
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ (ЗАПУСКАЕТСЯ ПОСЛЕ ЗАГРУЗКИ DOM)
// ============================================

/**
 * init() — главная функция инициализации.
 * Вызывается после полной загрузки DOM (window.onload).
 * Получает ссылки на все DOM-элементы, навешивает обработчики событий,
 * запускает музыку, таймеры и моргание.
 */
function init() {
    // Получаем ссылки на элементы (теперь DOM точно загружен)
    aquarium = document.getElementById("aquarium");
    spriteImg = document.getElementById("sprite-img");
    lightIconImg = document.getElementById("light-icon-img");
    characterContainer = document.getElementById("axolotl-character");
    btnNet = document.getElementById("btn-net");
    btnSponge = document.getElementById("btn-sponge");
    btnPaw = document.getElementById("btn-paw");
    netCursor = document.getElementById("custom-net-cursor");
    spongeCursor = document.getElementById("custom-sponge-cursor");
    pawCursor = document.getElementById("custom-paw-cursor");
    chatBubble = document.getElementById("chat-bubble-container");
    bubbleText = document.getElementById("bubble-text");
    soundIconImg = document.getElementById("sound-icon-img");
    ostDay = document.getElementById("ost-day");
    ostNight = document.getElementById("ost-night");
    soundBoop = document.getElementById("sound-boop");

    // Устанавливаем громкость музыки
    if (ostDay) ostDay.volume = MAX_VOLUME;
    if (ostNight) ostNight.volume = MAX_VOLUME;

    // Настраиваем бесшовный луп для обоих треков
    setupSeamlessLoop(ostDay);
    setupSeamlessLoop(ostNight);

    // Навешиваем обработчики событий мыши
    setupMouseEvents();

    // Запускаем автоматическое моргание аксолотля
    startBlinking();
}

/**
 * setupSeamlessLoop(audio) — убирает паузу между повторами музыки.
 * Браузер делает микро-паузу при loop, поэтому за 0.3 сек до конца
 * трека принудительно сбрасываем currentTime в 0.
 * @param {HTMLAudioElement} audio — аудио-элемент для зацикливания
 */
function setupSeamlessLoop(audio) {
    if (!audio) return;
    audio.addEventListener("timeupdate", function() {
        if (isMuted || audio.paused) return;
        const timeLeft = audio.duration - audio.currentTime;
        if (timeLeft <= 0.3 && !audio.dataset.looping) {
            audio.dataset.looping = "true";
            audio.currentTime = 0;
            setTimeout(() => { audio.dataset.looping = ""; }, 500);
        }
    });
}

/**
 * setupMouseEvents() — навешивает все обработчики мыши:
 * - mousedown на aquarium: включает музыку, запоминает зажатие ЛКМ
 * - mouseup на window: сбрасывает зажатие, возвращает спрайт
 * - mousemove на aquarium: двигает кастомные курсоры
 * - mouseleave/mouseenter: показывает/скрывает курсоры
 * - mousemove на characterContainer: поглаживание (смена спрайта + речь)
 */
function setupMouseEvents() {
    // Зажатие ЛКМ — включаем музыку (требуется пользовательское действие)
    aquarium.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
            isMouseDown = true;
            if (!isMuted) manageMusic();
            if (isNetMode || isSpongeMode || isPawMode) e.preventDefault();
        }
    });

    // Отпускание ЛКМ — сброс состояния поглаживания
    window.addEventListener("mouseup", () => {
        isMouseDown = false;
        if (isPawMode) {
            setSprite("normal");
            characterContainer.classList.remove("wobbling");
        }
    });

    // Движение мыши — перемещаем активный кастомный курсор
    aquarium.addEventListener("mousemove", (e) => {
        const rect = aquarium.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (isNetMode) { netCursor.style.left = `${x}px`; netCursor.style.top = `${y}px`; }
        if (isSpongeMode) { spongeCursor.style.left = `${x}px`; spongeCursor.style.top = `${y}px`; }
        if (isPawMode) { pawCursor.style.left = `${x}px`; pawCursor.style.top = `${y}px`; }
    });

    // Уход мыши из аквариума — скрываем курсоры, сбрасываем поглаживание
    aquarium.addEventListener("mouseleave", () => {
        netCursor.style.display = "none";
        spongeCursor.style.display = "none";
        pawCursor.style.display = "none";
        isMouseDown = false;
        if (isPawMode) {
            setSprite("normal");
            characterContainer.classList.remove("wobbling");
        }
    });

    // Возвращение мыши — показываем активный курсор
    aquarium.addEventListener("mouseenter", () => {
        if (isNetMode) netCursor.style.display = "block";
        if (isSpongeMode) spongeCursor.style.display = "block";
        if (isPawMode) pawCursor.style.display = "block";
    });

    // Поглаживание: при зажатой лапке и движении над персонажем
    characterContainer.addEventListener("mousemove", () => {
        if (isPawMode && isMouseDown) {
            setSprite("happy"); // Закрытые глаза (радость)
            characterContainer.classList.add("wobbling");

            // Речь при поглаживании — не чаще раз в 8 секунд, 3% шанс
            const now = Date.now();
            if (now - lastPetSpeechTime > 8000 && Math.random() < 0.03) {
                lastPetSpeechTime = now;
                generateAxolotlSpeech('pet');
            }
        }
    });

    // Уход мыши с персонажа — возвращаем обычный спрайт
    characterContainer.addEventListener("mouseleave", () => {
        if (isPawMode) {
            setSprite("normal");
            characterContainer.classList.remove("wobbling");
        }
    });
}

// ============================================
// УПРАВЛЕНИЕ СПРАЙТАМИ И МОРГАНИЕ
// ============================================

/**
 * setSprite(state) — централизованная смена спрайта аксолотля.
 * В зависимости от времени суток (isNight) и состояния выбирает нужный файл.
 * @param {string} state — "normal" (обычный), "happy" (закрытые глаза), "blink" (моргание)
 */
function setSprite(state) {
    if (!spriteImg) return;
    
    let src;
    if (isNight) {
        // Ночные спрайты
        if (state === "happy") src = "tex/night_spriteclosedboth.png";
        else if (state === "blink") src = "tex/night_spriteclosedboth.png";
        else src = "tex/night_sprite.png";
    } else {
        // Дневные спрайты
        if (state === "happy") src = "tex/spriteclosedboth.png";
        else if (state === "blink") src = "tex/spriteclosedboth.png";
        else src = "tex/sprite.png";
    }
    spriteImg.src = src;
}

/**
 * startBlinking() — запускает автоматическое случайное моргание.
 * Каждые 3-8 секунд аксолотль моргает (меняет спрайт на закрытые глаза на 150 мс),
 * если он не в режиме поглаживания (там уже закрытые глаза от радости).
 */
function startBlinking() {
    if (blinkInterval) clearInterval(blinkInterval);
    
    function doBlink() {
        // Не моргаем, если сейчас поглаживают (уже закрытые глаза)
        if (isPawMode && isMouseDown) {
            scheduleNextBlink();
            return;
        }
        
        // Моргаем: закрываем глаза на 150 мс
        setSprite("blink");
        setTimeout(() => {
            // Возвращаем обычный только если не начали поглаживать
            if (!(isPawMode && isMouseDown)) {
                setSprite("normal");
            }
        }, 150);
        
        scheduleNextBlink();
    }
    
    function scheduleNextBlink() {
        // Случайный интервал: от 3 до 8 секунд
        const delay = 3000 + Math.random() * 5000;
        blinkInterval = setTimeout(doBlink, delay);
    }
    
    scheduleNextBlink();
}

// ============================================
// МУЗЫКА И ЗВУК
// ============================================

/**
 * manageMusic() — управляет фоновой музыкой.
 * Включает дневной или ночной трек в зависимости от isNight.
 * Требует пользовательского клика для первого запуска (политика браузеров).
 */
function manageMusic() {
    if (isMuted || !ostDay || !ostNight) {
        if (ostDay) ostDay.pause();
        if (ostNight) ostNight.pause();
        return;
    }
    if (isNight) {
        ostDay.pause();
        if (ostNight.paused) {
            ostNight.volume = MAX_VOLUME;
            ostNight.play().catch(() => {});
        }
    } else {
        ostNight.pause();
        if (ostDay.paused) {
            ostDay.volume = MAX_VOLUME;
            ostDay.play().catch(() => {});
        }
    }
}

/**
 * toggleSound() — переключает звук вкл/выкл.
 * Меняет иконку, ставит/снимает паузу с музыки.
 */
function toggleSound() {
    isMuted = !isMuted;
    if (isMuted) {
        soundIconImg.src = "tex/zvuk_off.png";
        if (ostDay) ostDay.pause();
        if (ostNight) ostNight.pause();
    } else {
        soundIconImg.src = "tex/zvuk_on.png";
        manageMusic();
    }
}

// ============================================
// СМЕНА ВРЕМЕНИ СУТОК
// ============================================

/**
 * toggleTimeOfDay() — переключает день ↔ ночь.
 * Меняет CSS-класс (фон), иконку кнопки, спрайт персонажа, музыку.
 */
function toggleTimeOfDay() {
    isNight = !isNight;
    if (isNight) {
        aquarium.classList.add("night-mode");
        lightIconImg.src = "tex/night.png";
    } else {
        aquarium.classList.remove("night-mode");
        lightIconImg.src = "tex/day.png";
    }
    // Обновляем спрайт с учётом текущего состояния
    if (isPawMode && isMouseDown) setSprite("happy");
    else setSprite("normal");
    
    manageMusic();
}

// ============================================
// ИНСТРУМЕНТЫ (САЧОК, ГУБКА, ЛАПКА)
// ============================================

/**
 * resetTools() — сбрасывает все режимы инструментов.
 * Убирает CSS-классы, скрывает курсоры, возвращает обычный спрайт.
 * Вызывается перед активацией нового инструмента или кормлением.
 */
function resetTools() {
    isNetMode = false;
    isSpongeMode = false;
    isPawMode = false;
    
    aquarium.className = ""; 
    if (isNight) aquarium.classList.add("night-mode");

    if (btnNet) btnNet.classList.remove("active-tool");
    if (btnSponge) btnSponge.classList.remove("active-tool");
    if (btnPaw) btnPaw.classList.remove("active-tool");
    
    netCursor.style.display = "none";
    spongeCursor.style.display = "none";
    pawCursor.style.display = "none";

    setSprite("normal");
    characterContainer.classList.remove("wobbling");
}

/**
 * toggleNetMode() — вкл/выкл режим сачка.
 * При активации: сбрасывает другие инструменты, показывает курсор-сачок.
 * При повторном нажатии: выключает.
 */
function toggleNetMode() {
    if (isNetMode) {
        resetTools();
    } else {
        resetTools();
        isNetMode = true;
        aquarium.classList.add("net-mode");
        btnNet.classList.add("active-tool");
        netCursor.style.display = "block";
    }
}

/**
 * toggleSpongeMode() — вкл/выкл режим губки.
 * При активации: сбрасывает другие инструменты, показывает курсор-губку.
 * Губкой можно убирать грязь (mud-spot) — зажать ЛКМ и водить.
 */
function toggleSpongeMode() {
    if (isSpongeMode) {
        resetTools();
    } else {
        resetTools();
        isSpongeMode = true;
        aquarium.classList.add("sponge-mode");
        btnSponge.classList.add("active-tool");
        spongeCursor.style.display = "block";
    }
}

/**
 * togglePawMode() — вкл/выкл режим лапки (поглаживание).
 * При активации: сбрасывает другие инструменты, показывает курсор-лапку.
 * При зажатой ЛКМ над персонажем — поглаживание с анимацией и речью.
 */
function togglePawMode() {
    if (isPawMode) {
        resetTools();
    } else {
        resetTools();
        isPawMode = true;
        aquarium.classList.add("paw-mode");
        btnPaw.classList.add("active-tool");
        pawCursor.style.display = "block";
    }
}

// ============================================
// ТАМАГОЧИ-МЕХАНИКИ (ЕДА, ГРЯЗЬ)
// ============================================

/**
 * spawnMud() — создаёт случайное пятно грязи в аквариуме.
 * Грязь появляется: случайно после кормления (5%), при испорченной еде (25%).
 * Убирается губкой (SpongeMode) — уменьшается scale до 0.
 * С 20% шансом аксолотль говорит благодарность за уборку.
 */
function spawnMud() {
    const mud = document.createElement("img");
    mud.src = "tex/mad.png"; 
    mud.className = "mud-spot";
    mud.setAttribute("draggable", "false");
    
    // Случайная позиция внутри аквариума
    const randomX = Math.floor(Math.random() * (1550 - 120)) + 20;
    const randomY = Math.floor(Math.random() * (850 - 180)) + 60;
    mud.style.left = `${randomX}px`;
    mud.style.top = `${randomY}px`;
    
    // Случайный поворот
    const randomRotate = Math.floor(Math.random() * 360);
    mud.style.transform = `rotate(${randomRotate}deg) scale(1)`;

    let mudHp = 100; // Здоровье грязи (уменьшается при мытье)

    // Блокируем стандартное поведение при использовании губки
    mud.addEventListener("mousedown", (e) => { if (isSpongeMode) e.preventDefault(); });

    // При движении мыши с зажатой губкой — убираем грязь
    mud.onmousemove = function() {
        if (isSpongeMode && isMouseDown) {
            mudHp -= 15;
            let currentScale = mudHp / 100;
            mud.style.transform = `rotate(${randomRotate}deg) scale(${currentScale})`;
            mud.style.opacity = currentScale;

            if (mudHp <= 0) {
                mud.remove();
                if (Math.random() < 0.20) generateAxolotlSpeech('clean');
            }
        }
    };

    aquarium.appendChild(mud);
}

/**
 * spawnFood() — создаёт падающую креветку (кормление).
 * Процесс:
 * 1. Сбрасывает инструменты, создаёт еду сверху.
 * 2. Через 50 мс — еда падает вниз (CSS transition).
 * 3. Через 700 мс — 50% шанс, что аксолотль съест еду (реплика + анимация).
 * 4. Через 1250 мс — если не съедена, еда портится (становится dirty-food).
 *    Испорченную еду можно убрать сачком (NetMode).
 */
function spawnFood() {
    resetTools();
    
    const food = document.createElement("img");
    food.src = "tex/foodliz.png";
    food.className = "falling-food";
    food.setAttribute("draggable", "false");
    
    // Случайная позиция по X (центр аквариума ±150px)
    const randomX = Math.floor(Math.random() * 300) + 625;
    food.style.left = `${randomX}px`;
    food.style.top = "-90px"; // Начинаем за верхней границей
    
    aquarium.appendChild(food);

    // Фаза 1: Падение (CSS transition top 1.2s)
    setTimeout(() => {
        const bottomY = 850 - 95 - (Math.random() * 20); 
        food.style.top = `${bottomY}px`;
    }, 50);

    // Фаза 2: Проверка — съедена ли?
    setTimeout(() => {
        const isEaten = Math.random() > 0.5;
        if (isEaten) {
            food.remove();
            animateAxolotl(); // Пружинка персонажа

            if (Math.random() < 0.25) generateAxolotlSpeech('feed');
            if (Math.random() < 0.05) spawnMud(); // 5% шанс испачкаться
        }
    }, 700);

    // Фаза 3: Еда портится (если не съедена)
    setTimeout(() => {
        if (food.parentNode) {
            food.className = "dirty-food";
            
            // 25% шанс появления грязи рядом
            if (Math.random() < 0.25) spawnMud();

            // Убираем сачком
            food.addEventListener("mousedown", (e) => { if (isNetMode) e.preventDefault(); });
            food.onmousemove = function() {
                if (isNetMode && isMouseDown) {
                    food.style.transform = "scale(0)";
                    food.style.opacity = "0";
                    setTimeout(() => food.remove(), 100);
                }
            };
            food.onclick = function() {
                if (isNetMode) {
                    food.style.transform = "scale(0)";
                    food.style.opacity = "0";
                    setTimeout(() => food.remove(), 100);
                }
            };
        }
    }, 1250);
}

/**
 * animateAxolotl() — пружинящая анимация персонажа.
 * Используется при кормлении и нажатии кнопки «Чат».
 * Меняет scale на 1.04 и возвращает обратно через 150 мс.
 */
function animateAxolotl() {
    characterContainer.style.transform = "translateX(-50%) scale(1.04)";
    setTimeout(() => { characterContainer.style.transform = "translateX(-50%) scale(1)"; }, 150);
}

/**
 * handleInteraction(type) — обработчик кнопки «Чат».
 * Сбрасывает инструменты, анимирует персонажа, запускает речь.
 * @param {string} type — тип взаимодействия ('chat', 'feed', 'clean', 'pet')
 */
function handleInteraction(type) {
    resetTools();
    animateAxolotl(); 
    if (type === 'chat') generateAxolotlSpeech('chat');
}

// ============================================
// СИСТЕМА РЕЧИ (ЛОКАЛЬНЫЕ ФРАЗЫ + ПЕЧАТЬ)
// ============================================

/**
 * getRandomPhrase(actionType) — выбирает случайную фразу из набора.
 * @param {string} actionType — ключ набора фраз ('chat', 'feed', 'clean', 'pet')
 * @returns {string} случайная фраза
 */
function getRandomPhrase(actionType) {
    const phrases = axolotlPhrases[actionType] || axolotlPhrases.chat;
    return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * generateAxolotlSpeech(actionType) — главная функция диалога.
 * 1. Сбрасывает предыдущую речь (очищает таймеры).
 * 2. Показывает «⭐...» на 300 мс (имитация «думания»).
 * 3. Выбирает случайную фразу, разбивает на строки по словам.
 * 4. Запускает побуквенную печать с звуком «буп».
 * @param {string} actionType — тип события, определяет набор фраз
 */
function generateAxolotlSpeech(actionType = 'chat') {
    // Сброс всех активных таймеров и интервалов
    if (currentLineTimeout) clearTimeout(currentLineTimeout);
    if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }
    speechLinesQueue = [];

    // Показываем индикатор «думает»
    bubbleText.style.opacity = "1";
    bubbleText.innerText = "⭐...";
    chatBubble.style.display = "block";

    // Небольшая задержка перед речью
    setTimeout(() => {
        const phrase = getRandomPhrase(actionType);
        
        // Разбиваем фразу на строки по словам (не ломаем слова!)
        speechLinesQueue = splitIntoLines(phrase, 30);

        displayNextSpeechLine();
    }, 300);
}

/**
 * splitIntoLines(text, maxLength) — разбивает текст на строки по словам.
 * Гарантирует, что слово не будет разорвано посередине.
 * @param {string} text — исходный текст
 * @param {number} maxLength — максимальная длина строки в символах
 * @returns {string[]} массив строк
 */
function splitIntoLines(text, maxLength) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        // Если слово само по себе длиннее maxLength — добавляем отдельно
        if (word.length > maxLength) {
            if (currentLine) {
                lines.push(currentLine.trim());
                currentLine = '';
            }
            lines.push(word);
            continue;
        }

        // Проверяем, влезет ли слово в текущую строку
        if ((currentLine + ' ' + word).trim().length <= maxLength) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }

    // Добавляем остаток
    if (currentLine) lines.push(currentLine);
    
    return lines.length > 0 ? lines : [text];
}

/**
 * displayNextSpeechLine() — выводит следующую строку из очереди speechLinesQueue.
 * Если очередь пуста — плавно скрывает облачко.
 * После полной печати строки ждёт время на чтение и переходит к следующей.
 */
function displayNextSpeechLine() {
    if (speechLinesQueue.length === 0) {
        bubbleText.style.opacity = "0";
        currentLineTimeout = setTimeout(() => { chatBubble.style.display = "none"; }, 300);
        return;
    }

    const currentLine = speechLinesQueue.shift().trim();

    // Сброс предыдущих таймеров
    if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }
    if (currentLineTimeout) clearTimeout(currentLineTimeout);

    bubbleText.style.opacity = "1";
    bubbleText.innerText = "";

    // Запускаем побуквенную печать
    typeText(currentLine, () => {
        // После полной печати — время на чтение (минимум 2 сек)
        const readingTime = Math.max(2000, currentLine.length * 65);
        currentLineTimeout = setTimeout(() => { displayNextSpeechLine(); }, readingTime);
    });
}

/**
 * typeText(text, callback) — эффект «печатной машинки» с звуком.
 * Выводит текст по одной букве с интервалом 42 мс.
 * На каждую букву (кроме пробелов) клонирует soundBoop и воспроизводит.
 * Клонирование позволяет звукам накладываться без обрывов — эффект как в Undertale.
 * @param {string} text — строка для печати
 * @param {function} callback — вызывается после полной печати
 */
function typeText(text, callback) {
    if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }

    let index = 0;
    const speed = 42; // Миллисекунды между буквами

    typingInterval = setInterval(() => {
        if (index < text.length) {
            const char = text[index];
            bubbleText.innerText += char;

            // === ЗВУК «БУП» НА КАЖДУЮ БУКВУ ===
            // Клонируем аудио, чтобы каждый звук был независимым
            if (!isMuted && soundBoop && char !== " " && char !== "\xa0" && char !== "\n") {
                try {
                    const boopClone = soundBoop.cloneNode();
                    boopClone.volume = 0.12; // Тихо, чтобы не резало уши
                    
                    // Вариативность тона: 0.92–1.08x — звучит «живее»
                    boopClone.playbackRate = 0.92 + Math.random() * 0.16;
                    
                    boopClone.play().catch(() => {}); // Игнорируем ошибки автовоспроизведения
                    
                    // Удаляем клон из памяти после окончания
                    boopClone.onended = () => { 
                        if(boopClone.remove) boopClone.remove(); 
                    };
                    // Fallback: принудительная очистка через 1 сек
                    setTimeout(() => { 
                        if(boopClone.remove) boopClone.remove(); 
                    }, 1000);
                } catch (err) {
                    console.error("Ошибка boop:", err);
                }
            }

            index++;
        } else {
            // Вся строка напечатана
            clearInterval(typingInterval);
            typingInterval = null;
            if (callback) callback();
        }
    }, speed);
}

// ============================================
// ЗАПУСК (ждём полной загрузки DOM)
// ============================================

window.onload = init;