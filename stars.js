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
            // Увеличиваем размер звезд для лучшей видимости
            this.size = Math.random() * 0.2 + 0.1;
            
            // Распределяем звезды по всему экрану
            const margin = 50;
            this.x = margin + Math.random() * (window.innerWidth - margin * 2);
            this.y = margin + Math.random() * (window.innerHeight - margin * 2);
            // Начинаем с отрицательной Z для эффекта появления издалека
            this.z = -500;
            
            // Движение только вперед с небольшим разбросом
            const spread = 0.15;
            this.vx = (Math.random() - 0.5) * spread;
            this.vy = (Math.random() - 0.5) * spread;
            this.vz = 2; // Увеличиваем скорость движения
            
            this.element.style.cssText = `
                position: absolute;
                width: ${this.size}px;
                height: ${this.size}px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                box-shadow: 0 0 ${this.size * 3}px rgba(255, 255, 255, 0.9);
                opacity: 0;
                transform: translate3d(${this.x}px, ${this.y}px, ${this.z}px);
                transition: opacity 0.3s ease-in-out;
                filter: blur(${this.size * 0.05}px);
            `;
            
            starContainer.appendChild(this.element);
            setTimeout(() => this.element.style.opacity = '1', 10);
        }

        move() {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            
            // Увеличиваем масштаб для более заметного эффекта приближения
            const scale = Math.max(0.1, Math.min(1, 1 + this.z / 300));
            
            if (this.z > 1000) {
                this.fadeOut();
                return false;
            }
            
            this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, ${this.z}px) scale(${scale})`;
            return true;
        }

        fadeOut() {
            this.element.style.opacity = '0';
            setTimeout(() => this.element.remove(), 300);
        }
    }

    const stars = new Set();
    const MAX_STARS = isMobile ? 150 : 500; // Увеличиваем максимальное количество звезд
    let lastCreateTime = 0;

    function createStar() {
        const now = Date.now();
        if (now - lastCreateTime < 30) return; // Создаем ~20 звезд в секунду
        
        if (stars.size < MAX_STARS) {
            stars.add(new Star());
            lastCreateTime = now;
        }
    }

    function animate() {
        createStar();
        stars.forEach(star => {
            if (!star.move()) {
                stars.delete(star);
            }
        });
        requestAnimationFrame(animate);
    }

    // Создаем начальные звезды быстрее
    for (let i = 0; i < Math.min(100, MAX_STARS); i++) {
        setTimeout(createStar, Math.random() * 100);
    }

    animate();

    // Останавливаем анимацию, когда вкладка неактивна
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stars.forEach(star => star.fadeOut());
            stars.clear();
        }
    });
});
