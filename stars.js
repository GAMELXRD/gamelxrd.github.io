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

    class Star {
        constructor() {
            this.element = document.createElement('div');
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
            
            // Упрощаем стили для мобильных устройств
            this.element.style.cssText = `
                position: absolute;
                width: ${this.size}px;
                height: ${this.size}px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                ${isMobile ? '' : `box-shadow: 0 0 ${this.size * 3}px rgba(255, 255, 255, 0.9);`}
                opacity: 0;
                transform: translate3d(${this.x}px, ${this.y}px, ${this.z}px);
                transition: opacity 3s ease-in-out;
                ${isMobile ? '' : `filter: blur(${this.size * 0.05}px);`}
            `;
            
            starContainer.appendChild(this.element);
            
            // Важно! Используем requestAnimationFrame вместо setTimeout для более плавной анимации
            requestAnimationFrame(() => {
                this.element.style.opacity = '1';
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
            this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, ${this.z}px)`;
            return true;
        }

        fadeOut() {
            // Используем requestAnimationFrame для более плавного исчезновения
            requestAnimationFrame(() => {
                this.element.style.opacity = '0';
                
                // Удаляем элемент после завершения анимации
                setTimeout(() => this.element.remove(), 300);
            });
        }
    }

    const stars = new Set();
    // Уменьшаем количество звезд для мобильных устройств
    const MAX_STARS = isMobile ? 70 : 500;
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
        // Увеличиваем интервал создания звезд для мобильных устройств
        if (now - lastCreateTime < (isMobile ? 80 : 30)) return;
        
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

    // Создаем меньше начальных звезд на мобильных устройствах
    for (let i = 0; i < Math.min(isMobile ? 30 : 100, MAX_STARS); i++) {
        setTimeout(createStar, Math.random() * (isMobile ? 300 : 100));
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
