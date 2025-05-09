document.addEventListener('DOMContentLoaded', () => {
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
        'Viewer123', 'TwitchFan', 'GameLover', 'StreamEnjoyer', 'LoyalSub',
        'NightOwl', 'CoolViewer', 'ChillFan', 'StreamNinja', 'GameWatcher',
        'MoonLight', 'StarGazer', 'CosmicFan', 'GalaxyViewer', 'NebulaStar',
        'RocketMan', 'SpaceExplorer', 'AstroFan', 'StellarViewer', 'OrbitWatcher',
        'Follower42', 'SubLover', 'ChatEnjoyer', 'EmoteFan', 'StreamHopper',
        'LxrdFan', 'GameLxrd', 'TwitchStar', 'KickViewer', 'YTSubscriber'
    ];

    class Star {
        constructor() {
            // Создаем контейнер для звезды и никнейма
            this.container = document.createElement('div');
            this.element = document.createElement('div');
            this.nickname = document.createElement('div');
            
            // Выбираем случайный никнейм
            const randomNick = nicknames[Math.floor(Math.random() * nicknames.length)];
            
            // Уменьшаем размер звезд на мобильных устройствах
            this.size = Math.random() * (isMobile ? 0.15 : 0.2) + (isMobile ? 0.05 : 0.1);
            
            // Распределяем звезды по всему экрану
            const margin = isMobile ? 20 : 50;
            this.x = margin + Math.random() * (window.innerWidth - margin * 2);
            this.y = margin + Math.random() * (window.innerHeight - margin * 2);
            // Начинаем с отрицательной Z для эффекта появления издалека
            this.z = -500;
            
            // Движение только вперед с небольшим разбросом
            // Уменьшаем разброс на мобильных устройствах
            const spread = isMobile ? 0.1 : 0.15;
            this.vx = (Math.random() - 0.5) * spread;
            this.vy = (Math.random() - 0.5) * spread;
            // Уменьшаем скорость на мобильных устройствах
            this.vz = isMobile ? 1.5 : 2;
            
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
            
            // Упрощаем стили для звезды
            this.element.style.cssText = `
                width: ${this.size}px;
                height: ${this.size}px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                ${isMobile ? '' : `box-shadow: 0 0 ${this.size * 3}px rgba(255, 255, 255, 0.9);`}
                ${isMobile ? '' : `filter: blur(${this.size * 0.05}px);`}
            `;
            
            // Стили для никнейма
            this.nickname.style.cssText = `
                color: rgba(255, 255, 255, 0.7);
                font-size: ${isMobile ? '6px' : '8px'};
                margin-bottom: 3px;
                white-space: nowrap;
                text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
                font-family: 'Montserrat', sans-serif;
            `;
            
            // Устанавливаем текст никнейма
            this.nickname.textContent = randomNick;
            
            // Добавляем элементы в DOM
            this.container.appendChild(this.nickname);
            this.container.appendChild(this.element);
            starContainer.appendChild(this.container);
            
            // Важно! Используем requestAnimationFrame вместо setTimeout для более плавной анимации
            requestAnimationFrame(() => {
                this.container.style.opacity = '1';
            });
        }

        move() {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            
            if (this.z > 1000) {
                this.fadeOut();
                return false;
            }
            
            // Убираем scale из transform для лучшей производительности
            this.container.style.transform = `translate3d(${this.x}px, ${this.y}px, ${this.z}px)`;
            return true;
        }

        fadeOut() {
            // Используем requestAnimationFrame для более плавного исчезновения
            requestAnimationFrame(() => {
                this.container.style.opacity = '0';
                
                // Удаляем элемент после завершения анимации
                setTimeout(() => this.container.remove(), 800);
            });
        }
    }

    const stars = new Set();
    // Уменьшаем количество звезд для мобильных устройств
    const MAX_STARS = isMobile ? 70 : 300;
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
        // Увеличиваем интервал создания звезд 
        if (now - lastCreateTime < (isMobile ? 150 : 50)) return;
        
        if (stars.size < MAX_STARS) {
            stars.add(new Star());
            lastCreateTime = now;
        }
    }

    function animate() {
        // Не создаем новые звезды во время прокрутки на мобильных устройствах
        if (!(isMobile && isScrolling)) {
            createStar();
        }
        
        // Обновляем только каждый второй кадр на мобильных устройствах
        if (!(isMobile && isScrolling)) {
            stars.forEach(star => {
                if (!star.move()) {
                    stars.delete(star);
                }
            });
        }
        
        requestAnimationFrame(animate);
    }

    // Создаем начальные звезды с более равномерным распределением по времени
    const initialStarCount = Math.min(isMobile ? 30 : 100, MAX_STARS);
    for (let i = 0; i < initialStarCount; i++) {
        // Распределяем создание звезд более равномерно
        setTimeout(createStar, (i / initialStarCount) * (isMobile ? 1000 : 500));
    }

    animate();

    // Останавливаем анимацию, когда вкладка неактивна
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stars.forEach(star => star.fadeOut());
            stars.clear();
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
                        star.fadeOut();
                        stars.delete(star);
                    }
                });
            }, 300);
        });
    }
});
