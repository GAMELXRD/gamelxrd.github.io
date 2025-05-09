document.addEventListener('DOMContentLoaded', () => {
    // Переменные для управления отображением
    let showStars = true; // Звезды всегда отображаются
    let showNicknames = Math.random() < 0.25; // 25% шанс отображения никнеймов
    const starSizeMultiplier = 3.0; // Множитель размера звезд (1.0 - стандартный размер)
    
    // Специальные цвета для определенных никнеймов
    const specialColors = {
        'Хагрид': 'rgb(255, 166, 0)', // оранжевый
        'DEDFEAR': 'rgba(255, 224, 86, 0.85)', // красный
        'Evil4el': 'rgba(143, 119, 252, 0.85)', // фиолетовый
        'TVPE': 'rgba(202, 122, 255, 0.85)', // зеленый
    };
    
    const starContainer = document.createElement('div');
    starContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
        perspective: 1000px;
    `;
    document.body.appendChild(starContainer);

    // Определяем, является ли устройство мобильным
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Список случайных никнеймов для звезд
    const nicknames = [
        '🔥 Хагрид 🔥', 'miitchull', 'DEDFEAR', 'Evil4el', 'TVPE', 'capJ', 'zaxerisimus', 'AlexanderGo77', 'RastaOwl', 'showsalmon', 'sofkabrovka', 'HallLeon', 'sanek_ludik', 'meowgreyy', 'shinobee_4sv', 'mercurrry', 'BE7HA', 'Inngvarr', 'vrednaya_zhopa', 'Глянец', 'ESC', 'zaruinili', 'PiKaq7', 'crystalsoncher', 'ELF0V', 'Dzeem', 'InCrit', 'Ferazelz', 'Toopenya', 'HUBIBICH', 'Gaucheboy', 'solo_mogby_bit', 'lisadess', 'wercop83', 'wladizlaw', 'eriooook', 'flur0x', 'Krizzz', 'gogomorgort', 'Lrost', 'v4nec', 'j0anans', 'Da__Co', 'showsalmon', 'laketoki', 'Кич', 'Basila', 'hpuv', 'Anonimcat', 'yournihao'
    ];

    // Отслеживаем активные никнеймы на экране
    const activeNicknames = new Set();

    class Star {
        constructor() {
            // Создаем контейнер для звезды и никнейма
            this.container = document.createElement('div');
            this.element = document.createElement('div');
            this.nickname = document.createElement('div');
            
            // Добавляем классы для элементов (для управления видимостью)
            this.element.classList.add('star-element');
            this.nickname.classList.add('star-nickname');
            
            // Выбираем случайный никнейм, который еще не используется
            this.nickText = getAvailableNickname();
            
            // Уменьшаем размер звезд на мобильных устройствах
            this.size = (Math.random() * (isMobile ? 0.15 : 0.2) + (isMobile ? 0.05 : 0.1)) * starSizeMultiplier;
            
            // Распределяем звезды по всему экрану
            const margin = isMobile ? 20 : 50;
            this.x = margin + Math.random() * (window.innerWidth - margin * 2);
            this.y = margin + Math.random() * (window.innerHeight - margin * 2);
            
            // Начинаем с разных Z-координат для более равномерного распределения
            this.z = -500 + Math.random() * 300;
            
            // Движение только вперед с небольшим разбросом
            // Уменьшаем разброс на мобильных устройствах
            const spread = isMobile ? 0.1 : 0.15;
            this.vx = (Math.random() - 0.5) * spread;
            this.vy = (Math.random() - 0.5) * spread;
            // Уменьшаем скорость на мобильных устройствах
            // Скорость теперь в единицах в секунду, а не в кадр
            this.vz = isMobile ? 90 : 120;
            this.vx *= 60; // Умножаем на 60, чтобы перевести в единицы в секунду
            this.vy *= 60; // Умножаем на 60, чтобы перевести в единицы в секунду
            
            // Стили для контейнера
            this.container.style.cssText = `
                position: absolute;
                transform: translate3d(${this.x}px, ${this.y}px, ${this.z}px);
                display: flex;
                flex-direction: column;
                align-items: center;
                opacity: 0;
                transition: opacity 0.8s ease-in-out;
            `;
            
            // Проверяем, есть ли специальный цвет для данного никнейма
            const nicknameColor = specialColors[this.nickText] || 'rgba(255, 255, 255, 0.85)';
            
            // Получаем цвет для свечения (без альфа-канала)
            // Если это RGB цвет, используем его, иначе извлекаем RGB из RGBA
            let glowColor;
            if (nicknameColor.startsWith('rgb(')) {
                glowColor = nicknameColor;
            } else if (nicknameColor.startsWith('rgba(')) {
                // Извлекаем RGB часть из RGBA
                glowColor = 'rgb(' + nicknameColor.substring(5, nicknameColor.lastIndexOf(',')) + ')';
            } else {
                // Если формат неизвестен, используем белый цвет
                glowColor = 'rgb(255, 255, 255)';
            }
            
            // Упрощаем стили для звезды
            this.element.style.cssText = `
                width: ${this.size}px;
                height: ${this.size}px;
                background: ${glowColor.replace('rgb', 'rgba').replace(')', ', 0.95)')};
                border-radius: 50%;
                ${isMobile ? '' : `box-shadow: 0 0 ${this.size * 5}px ${glowColor};`}
                ${isMobile ? '' : `filter: blur(${this.size * 0.03}px);`}
                display: block; // Звезды всегда отображаются
            `;
            
            // Стили для никнейма
            this.nickname.style.cssText = `
                color: ${nicknameColor};
                font-size: ${isMobile ? '4px' : '5px'};
                font-weight: 600;
                margin-bottom: 3px;
                white-space: nowrap;
                text-shadow: 0 0 3px ${glowColor};
                font-family: 'Montserrat', sans-serif;
                display: ${showNicknames ? 'block' : 'none'};
            `;
            
            // Устанавливаем текст никнейма
            this.nickname.textContent = this.nickText;
            
            // Добавляем элементы в DOM
            this.container.appendChild(this.nickname);
            this.container.appendChild(this.element);
            starContainer.appendChild(this.container);
            
            // Важно! Используем requestAnimationFrame вместо setTimeout для более плавной анимации
            requestAnimationFrame(() => {
                this.container.style.opacity = '1';
            });
        }

        move(deltaTime) {
            // Используем deltaTime для расчета перемещения
            // deltaTime в секундах, поэтому умножаем скорость на deltaTime
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            this.z += this.vz * deltaTime;
            
            if (this.z > 1000) {
                this.fadeOut();
                return false;
            }
            
            // Убираем scale из transform для лучшей производительности
            this.container.style.transform = `translate3d(${this.x}px, ${this.y}px, ${this.z}px)`;
            return true;
        }

        fadeOut() {
            // Освобождаем никнейм для повторного использования
            activeNicknames.delete(this.nickText);
            
            // Используем requestAnimationFrame для более плавного исчезновения
            requestAnimationFrame(() => {
                this.container.style.opacity = '0';
                
                // Удаляем элемент после завершения анимации
                setTimeout(() => this.container.remove(), 400);
            });
        }
    }

    // Функция для получения доступного никнейма
    function getAvailableNickname() {
        // Создаем массив доступных никнеймов (тех, которые не используются)
        const availableNicknames = nicknames.filter(nick => !activeNicknames.has(nick));
        
        // Если все никнеймы используются, возвращаем случайный из всего списка
        if (availableNicknames.length === 0) {
            return nicknames[Math.floor(Math.random() * nicknames.length)];
        }
        
        // Выбираем случайный никнейм из доступных
        const selectedNick = availableNicknames[Math.floor(Math.random() * availableNicknames.length)];
        
        // Добавляем его в список активных
        activeNicknames.add(selectedNick);
        
        return selectedNick;
    }

    const stars = new Set();
    // Устанавливаем максимальное количество звезд равным количеству никнеймов
    // Но ограничиваем для мобильных устройств
    const MAX_STARS = isMobile ? Math.min(30, nicknames.length) : nicknames.length;
    let lastCreateTime = 0;

    // Добавляем переменную для отслеживания прокрутки
    let isScrolling = false;
    let scrollTimeout;

    // Обработчик прокрутки
    window.addEventListener('scroll', () => {
        isScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 200);
    });

    function createStar() {
        const now = Date.now();
        // Уменьшаем интервал создания звезд для более равномерного появления
        if (now - lastCreateTime < (isMobile ? 100 : 30)) return;
        
        if (stars.size < MAX_STARS) {
            stars.add(new Star());
            lastCreateTime = now;
        }
    }

    // Переменные для расчета deltaTime
    let lastTime = 0;

    function animate(currentTime) {
        // Расчет deltaTime в секундах
        if (!lastTime) lastTime = currentTime;
        const deltaTime = (currentTime - lastTime) / 1000; // Переводим в секунды
        lastTime = currentTime;
        
        // Ограничиваем deltaTime, чтобы избежать больших скачков
        // при переключении вкладок или низком FPS
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        
        // Не создаем новые звезды во время прокрутки на мобильных устройствах
        if (!(isMobile && isScrolling)) {
            createStar();
        }
        
        // Обновляем только каждый второй кадр на мобильных устройствах
        if (!(isMobile && isScrolling)) {
            stars.forEach(star => {
                if (!star.move(clampedDeltaTime)) {
                    stars.delete(star);
                }
            });
        }
        
        requestAnimationFrame(animate);
    }

    // Создаем начальные звезды с более равномерным распределением по времени и пространству
    // Ограничиваем количество начальных звезд количеством никнеймов
    const initialStarCount = Math.min(isMobile ? 30 : 60, MAX_STARS);
    
    // Создаем начальные звезды с разными Z-координатами для равномерного распределения
    for (let i = 0; i < initialStarCount; i++) {
        // Создаем звезды сразу, но с разными начальными позициями
        setTimeout(() => {
            const star = new Star();
            // Устанавливаем разные Z-координаты для начальных звезд
            star.z = -500 + (i / initialStarCount) * 1500;
            stars.add(star);
        }, Math.random() * 500); // Небольшая случайная задержка для более естественного появления
    }

    // Запускаем анимацию с передачей текущего времени
    requestAnimationFrame(animate);

    // Останавливаем анимацию, когда вкладка неактивна
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stars.forEach(star => {
                // Освобождаем все никнеймы
                activeNicknames.delete(star.nickText);
                star.fadeOut();
            });
            stars.clear();
            // Сбрасываем lastTime при возвращении на вкладку
            lastTime = 0;
        }
    });

    // Добавляем обработчик изменения ориентации для мобильных устройств
    if (isMobile) {
        window.addEventListener('orientationchange', () => {
            // Даем время на перерисовку после изменения ориентации
            setTimeout(() => {
                // Удаляем звезды, которые могут оказаться за пределами экрана
                stars.forEach(star => {
                    if (star.x < 0 || star.x > window.innerWidth || 
                        star.y < 0 || star.y > window.innerHeight) {
                        // Освобождаем никнейм
                        activeNicknames.delete(star.nickText);
                        star.fadeOut();
                        stars.delete(star);
                    }
                });
            }, 100);
        });
    }
});
