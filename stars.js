// Используем глобальный объект THREE
const { CSS2DRenderer, CSS2DObject } = THREE;

document.addEventListener('DOMContentLoaded', () => {
    const showNicknames = Math.random() < 0.1;

    // --- НАСТРОЙКИ АНИМАЦИИ ---
    const spawnRange = 300;          // Ширина/высота области появления звёзд
    const spawnDepth = -1000;        // Как далеко сзади появляются звёзды
    const fadeInSpeed = 1.5;         // Скорость плавного появления (больше = быстрее)
    const nicknameSizeFactor = 1250;  // Коэффициент размера никнеймов
    const minSpeed = 50;             // Минимальная скорость полёта
    const speedRandomness = 50;      // Добавочная случайная скорость (скорость = minSpeed + random(0, speedRandomness))
    // -------------------------

    const nicknames = [
        'Хагрид', 'miitchull', 'DEDFEAR', 'Evil4el', '⎛⎝>⏝⏝<⎛⎝', 'capJ', 'zaxerisimus', 'AlexanderGo77', 'RastaOwl', 'showsalmon', 'sofkabrovka', 'HallLeon', 'sanek_ludik', 'meowgreyy', 'shinobee_4sv', 'mercurrry', 'BE7HA', 'Inngvarr', 'vrednaya_zhopa', 'Глянец', 'ESC', 'zaruinili', 'PiKaq7', 'crystalsoncher', 'ELF0V', 'Dzeem', 'InCrit', 'Ferazelz', 'Toopenya', 'HUBIBICH', 'Gaucheboy', 'solo_mogby_bit', 'lisadess', 'wercop83', 'wladizlaw', 'eriooook', 'flur0x', 'Krizzz', 'gogomorgort', 'Lrost', 'v4nec', 'j0anans', 'Da__Co', 'showsalmon', 'laketoki', 'Кич', 'Basila', 'hpuv', 'Anonimcat', 'yournihao', 'dizzzyboy_', 'сиська папича', 'mrsody', 'Квили', 'alex_exz', '13hellsangel', 'kinder82'
    ];

    const specialColors = {
        'mercurrry': new THREE.Color('rgba(204, 0, 255, 1)'),
        'Хагрид': new THREE.Color('rgb(255, 166, 0)'),
        'DEDFEAR': new THREE.Color('rgba(255, 224, 86, 0.85)'),
        'Evil4el': new THREE.Color('rgba(143, 119, 252, 0.85)'),
        '⎛⎝>⏝⏝<⎛⎝': new THREE.Color('rgba(202, 122, 255, 0.85)'),
        'dizzzyboy_': new THREE.Color('rgba(245, 84, 35, 0.85)'),
        'yournihao': new THREE.Color('rgba(246, 123, 250, 0.85)'),
    };
    const defaultColor = new THREE.Color('rgba(255, 255, 255, 0.95)');

    let scene, camera, renderer, labelRenderer, stars;
    const starParticles = [];

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 0;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = 0;
        renderer.domElement.style.left = 0;
        renderer.domElement.style.zIndex = -1;
        document.body.appendChild(renderer.domElement);
        
        if (showNicknames) {
            labelRenderer = new CSS2DRenderer();
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.domElement.style.position = 'fixed';
            labelRenderer.domElement.style.top = 0;
            labelRenderer.domElement.style.left = 0;
            labelRenderer.domElement.style.pointerEvents = 'none';
            labelRenderer.domElement.style.zIndex = -1;
            document.body.appendChild(labelRenderer.domElement);
        }
        
        createStars();
        window.addEventListener('resize', onWindowResize, false);
        animate();
    }

    function createStars() {
        const starGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];

        const starCount = nicknames.length;
        const specialColorsArray = Object.values(specialColors);

        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * spawnRange;
            const y = (Math.random() - 0.5) * spawnRange;
            const z = Math.random() * spawnDepth;
            positions.push(x, y, z);
            sizes.push(Math.random() * 0.5 + 0.2);

            let color;
            if (showNicknames) {
                const nickText = nicknames[i];
                color = specialColors[nickText] || defaultColor;
            } else {
                if (Math.random() < 0.15) {
                    color = specialColorsArray[Math.floor(Math.random() * specialColorsArray.length)];
                } else {
                    color = defaultColor;
                }
            }
            colors.push(color.r, color.g, color.b, 1.0);
            
            let nicknameLabel = null;
            if (showNicknames) {
                const nickText = nicknames[i];
                const nicknameDiv = document.createElement('div');
                nicknameDiv.className = 'star-nickname';
                nicknameDiv.textContent = nickText;
                nicknameDiv.style.color = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
                nicknameDiv.style.textShadow = `0 0 5px ${nicknameDiv.style.color}`;
                nicknameDiv.style.fontSize = '1px';
                
                nicknameLabel = new CSS2DObject(nicknameDiv);
                nicknameLabel.position.set(x, y, z);
                scene.add(nicknameLabel);
            }

            starParticles.push({
                position: new THREE.Vector3(x, y, z),
                // --- ИЗМЕНЕНИЕ: Используем новые константы для скорости ---
                velocity: new THREE.Vector3(0, 0, minSpeed + Math.random() * speedRandomness),
                label: nicknameLabel,
                opacity: 1.0
            });
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
        starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            vertexColors: true,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            map: !showNicknames ? createStarTexture() : null,
        });

        if (showNicknames) {
            starMaterial.visible = false;
        }

        stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
    }

    function createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (showNicknames) {
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const positions = stars.geometry.attributes.position.array;
        const colors = stars.geometry.attributes.color.array;

        for (let i = 0; i < starParticles.length; i++) {
            const particle = starParticles[i];
            
            particle.position.z += particle.velocity.z * delta;
            
            if (particle.position.z > 0) {
                particle.position.z = spawnDepth; 
                particle.position.x = (Math.random() - 0.5) * spawnRange;
                particle.position.y = (Math.random() - 0.5) * spawnRange;
                particle.opacity = 0.0;
            }

            if (particle.opacity < 1.0) {
                particle.opacity += fadeInSpeed * delta;
                particle.opacity = Math.min(particle.opacity, 1.0);
            }
            
            if (particle.label) {
                particle.label.position.copy(particle.position);

                const fontSize = nicknameSizeFactor / -particle.position.z;
                particle.label.element.style.fontSize = `${fontSize}px`;
                
                particle.label.element.style.opacity = particle.opacity;
            }

            const posIndex = i * 3;
            positions[posIndex] = particle.position.x;
            positions[posIndex + 1] = particle.position.y;
            positions[posIndex + 2] = particle.position.z;

            const colorIndex = i * 4;
            colors[colorIndex + 3] = particle.opacity;
        }

        stars.geometry.attributes.position.needsUpdate = true;
        stars.geometry.attributes.color.needsUpdate = true;
        
        renderer.render(scene, camera);
        
        if (showNicknames) {
            labelRenderer.render(scene, camera);
        }
    }

    init();
});