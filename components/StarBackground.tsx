import React, { useEffect, useRef } from 'react';

// === НАСТРОЙКИ ЗВЕЗД ===
const STAR_COUNT = 800;       // Увеличили количество звезд для лучшего эффекта скорости
const NORMAL_SPEED = 0.5;     // Обычная спокойная скорость
const WARP_SPEED = 60.0;      // Скорость гиперпрыжка
const ACCELERATION = 1.5;     // Как быстро разгоняемся
const DECELERATION = 0.92;    // Коэффициент торможения (0.9 - быстро, 0.99 - медленно)
const STAR_SIZE = 1.0;        // Базовый размер
const DEPTH = 1000;           // Глубина сцены

interface Star {
  x: number;
  y: number;
  z: number;
  o: number; // opacity seed
}

interface StarBackgroundProps {
  isWarpSpeed?: boolean;
}

const StarBackground: React.FC<StarBackgroundProps> = ({ isWarpSpeed = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Используем рефы для хранения состояния анимации, чтобы не прерывать цикл рендера
  const warpRef = useRef(isWarpSpeed);
  const speedRef = useRef(NORMAL_SPEED);

  // Синхронизируем проп с рефом
  useEffect(() => {
    warpRef.current = isWarpSpeed;
  }, [isWarpSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Инициализация звезд
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * DEPTH,
        o: Math.random(),
      });
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    let animationFrameId: number;

    const render = () => {
      // Плавный клир (можно добавить шлейф, если использовать fillRect с низкой прозрачностью)
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // === ФИЗИКА СКОРОСТИ ===
      const targetSpeed = warpRef.current ? WARP_SPEED : NORMAL_SPEED;
      
      if (warpRef.current) {
        // Разгон (линейный)
        if (speedRef.current < targetSpeed) {
          speedRef.current += ACCELERATION;
        }
      } else {
        // Торможение (экспоненциальное для плавности в конце)
        if (speedRef.current > targetSpeed) {
          speedRef.current = Math.max(targetSpeed, speedRef.current * DECELERATION);
        }
      }

      const currentSpeed = speedRef.current;
      // Определяем, рисуем ли мы линии (варп) или точки
      const isWarping = currentSpeed > NORMAL_SPEED * 2;

      stars.forEach((star) => {
        // Двигаем звезду
        star.z -= currentSpeed;

        // Респаун звезд
        if (star.z <= 0) {
          star.z = DEPTH;
          star.x = (Math.random() - 0.5) * width * 1.5; // Разброс чуть шире экрана
          star.y = (Math.random() - 0.5) * height * 1.5;
        }

        // Проекция текущей позиции
        const k = DEPTH / star.z;
        const x2d = star.x * (1 / star.z) * (DEPTH / 2) + cx;
        const y2d = star.y * (1 / star.z) * (DEPTH / 2) + cy;

        // Размер и прозрачность
        // На скорости звезды становятся тоньше и прозрачнее
        const sizeBase = (1 - star.z / DEPTH) * STAR_SIZE * 2;
        const size = isWarping ? sizeBase * 0.5 : sizeBase;
        const opacity = (1 - star.z / DEPTH) * star.o * (isWarping ? 0.7 : 1.0);

        if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

          if (isWarping) {
            // === РИСУЕМ ЛУЧИ (WARP) ===
            // Вычисляем "хвост" звезды. Чем быстрее скорость, тем длиннее хвост.
            // Эмулируем позицию, где звезда была бы чуть раньше (z + длина хвоста)
            const tailLength = (currentSpeed) * 2; 
            const prevZ = star.z + tailLength;
            
            // Проекция хвоста
            const x2dPrev = star.x * (1 / prevZ) * (DEPTH / 2) + cx;
            const y2dPrev = star.y * (1 / prevZ) * (DEPTH / 2) + cy;

            ctx.lineWidth = size;
            ctx.lineCap = 'round';
            ctx.moveTo(x2dPrev, y2dPrev);
            ctx.lineTo(x2d, y2d);
            ctx.stroke();
          } else {
            // === РИСУЕМ ТОЧКИ (IDLE) ===
            ctx.arc(x2d, y2d, size > 0 ? size : 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Пустой массив зависимостей, так как мы используем refs внутри

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
    />
  );
};

export default StarBackground;