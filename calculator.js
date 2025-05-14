// Функция расчета цены
function calculatePrice() {
    // Получаем значения из формы
    // Тип игры определяется внутренне при выборе игры
    const gameType = determineGameType(lastSelectedGame) || 'indie';
    const gameLength = parseInt(document.getElementById('game-length').value);
    
    // Почасовые ставки по типу игры
    let hourlyRate = 0;
    let breakdown = [];
    
    // Проверяем, является ли игра хоррором или соревновательной
    if (gameType === 'horror') {
        hourlyRate = 250;
        breakdown.push(`Хоррор: 250 ₽/час`);
    } else if (gameType === 'competitive') {
        hourlyRate = 130;
        breakdown.push(`Соревновательная/Battle Royale: 130 ₽/час`);
    } else {
        switch(gameType) {
            case 'indie':
                hourlyRate = 150;
                breakdown.push(`Инди: 150 ₽/час`);
                break;
            case 'aa':
                hourlyRate = 160;
                breakdown.push(`AA-игра: 160 ₽/час`);
                break;
            case 'aaa':
                hourlyRate = 180;
                breakdown.push(`AAA-игра: 180 ₽/час`);
                break;
        }
    }
    
    // Рассчитываем базовую стоимость
    let totalPrice = hourlyRate * gameLength;
    
    // Добавляем информацию о длительности
    breakdown.push(`Длительность: ${gameLength} ч`);
    
    // Применяем скидки для длительных игр
    let discount = 0;
    if (gameLength > 48) {
        discount = 0.2; // 20% скидка
        breakdown.push(`Скидка: 20% (для игр длительностью более 48 часов)`);
    } else if (gameLength > 24) {
        discount = 0.1; // 10% скидка
        breakdown.push(`Скидка: 10% (для игр длительностью более 24 часов)`);
    }
    
    // Применяем скидку, если она есть
    if (discount > 0) {
        const discountAmount = totalPrice * discount;
        totalPrice = totalPrice - discountAmount;
        breakdown.push(`Сумма скидки: ${Math.round(discountAmount)} ₽`);
    }
    
    // Округляем итоговую стоимость
    totalPrice = Math.round(totalPrice);
    
    // Добавляем итоговую строку
    breakdown.push(`Итого: ${totalPrice} ₽`);
    
    // Отображаем результат с анимацией
    const resultElement = document.getElementById('result');
    resultElement.classList.add('visible');
    document.getElementById('total-price').innerHTML = `Примерная стоимость: <span>${totalPrice}</span> ₽`;
    
    // Отображаем разбивку цены
    const breakdownHTML = breakdown.map(item => `<div>${item}</div>`).join('');
    document.getElementById('price-breakdown').innerHTML = breakdownHTML;
    
    // Добавляем текст о договорной цене
    const negotiateText = document.createElement('div');
    negotiateText.className = 'negotiate-text';
    negotiateText.innerHTML = 'Не нравится цена? Давай договоримся 😄';
    
    // Проверяем, существует ли уже элемент с классом negotiate-text
    const existingNegotiateText = document.querySelector('.negotiate-text');
    if (existingNegotiateText) {
        existingNegotiateText.remove();
    }
    
    // Добавляем элемент в конец блока результатов
    resultElement.appendChild(negotiateText);
    
    // Добавляем анимацию появления с задержкой
    setTimeout(() => {
        negotiateText.classList.add('visible');
    }, 500);
}

// Функция для определения типа игры (используется внутренне для расчета цены)
function determineGameType(game) {
    if (!game || !game.genres) {
        return 'indie'; // По умолчанию, если данные отсутствуют
    }
    
    // Проверяем жанры и теги для хорроров
    const genres = game.genres.map(g => g.name.toLowerCase());
    
    // Проверяем теги, если они есть
    let isHorror = genres.includes('horror') || genres.includes('ужасы');
    let isCompetitive = false;
    
    // Дополнительно проверяем теги из RAWG
    if (game.tags && game.tags.length > 0) {
        const tags = game.tags.map(t => t.name.toLowerCase());
        
        if (!isHorror) {
            isHorror = tags.includes('horror') || tags.includes('ужасы');
        }
        
        isCompetitive = tags.includes('competitive') || tags.includes('соревновательный') || 
                        tags.includes('battle royale') || tags.includes('королевская битва');
    }
    
    if (isHorror) {
        return 'horror';
    }
    
    if (isCompetitive) {
        return 'competitive';
    }
    
    // Списки крупных издателей и разработчиков
    const aaaPublishers = [
        'activision', 'blizzard', 'activision blizzard', 
        'electronic arts', 'ea', 'ea sports',
        'ubisoft', 
        'sony', 'sony interactive entertainment', 'sie', 
        'microsoft', 'xbox game studios', 'xbox',
        'take-two', 'take two', 'take 2', 'rockstar', '2k', '2k games',
        'bethesda', 'zenimax', 
        'capcom', 
        'square enix', 
        'warner bros', 'warner brothers', 'wb games',
        'cd projekt', 'cd projekt red', 
        'fromsoftware', 'from software',
        'nintendo'
    ];
    
    const aaPublishers = [
        'focus entertainment', 'focus home', 
        'saber interactive', 
        'techland', 
        'thq nordic', 'thq', 
        'devolver', 'devolver digital', 
        'paradox', 'paradox interactive', 
        'sega', 
        'bandai namco', 'bandai', 'namco', 
        'koei tecmo', 'koei', 'tecmo', 
        'private division', 
        'humble games', 'humble bundle', 
        'annapurna', 'annapurna interactive',
        '505 games', '505',
        'deep silver'
    ];
    
    // Проверяем издателей и разработчиков
    let isAAAPublisher = false;
    let isAAPublisher = false;
    
    // Проверяем разработчиков
    if (game.developers && game.developers.length > 0) {
        const developers = game.developers.map(d => d.name.toLowerCase());
        isAAAPublisher = developers.some(dev => aaaPublishers.some(p => dev.includes(p)));
        
        if (!isAAAPublisher) {
            isAAPublisher = developers.some(dev => aaPublishers.some(p => dev.includes(p)));
        }
    }
    
    // Проверяем издателей, если разработчики не определены
    if (!isAAAPublisher && !isAAPublisher && game.publishers && game.publishers.length > 0) {
        const publishers = game.publishers.map(p => p.name.toLowerCase());
        isAAAPublisher = publishers.some(pub => aaaPublishers.some(p => pub.includes(p)));
        
        if (!isAAAPublisher) {
            isAAPublisher = publishers.some(pub => aaPublishers.some(p => pub.includes(p)));
        }
    }
    
    // Определяем тип игры на основе всех критериев
    // AAA-игры: >5000 оценок или Metacritic ≥85 или крупный издатель
    if (isAAAPublisher || game.ratings_count > 5000 || (game.metacritic && game.metacritic >= 85)) {
        return 'aaa';
    }
    
    // AA-игры: >1000 оценок или Metacritic ≥75 или средний издатель
    if (isAAPublisher || game.ratings_count > 1000 || (game.metacritic && game.metacritic >= 75)) {
        return 'aa';
    }
    
    // Все остальные игры считаются инди
    return 'indie';
}

// Ваш API ключ RAWG
const RAWG_API_KEY = '683af2661f5b4c07b15a04877441a673'; 

// Функция для поиска игр
async function searchGames(query) {
    if (query.length < 3) return [];
    
    try {
        // Используем corsproxy.io как прокси для обхода CORS
        const proxyUrl = 'https://corsproxy.io/?';
        const apiUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
        const data = await response.json();
        
        return data.results || [];
    } catch (error) {
        console.error('Ошибка при поиске игр:', error);
        return [];
    }
}

// Функция для получения детальной информации об игре
async function getGameDetails(gameId) {
    try {
        // Добавляем параметр lang=ru для получения данных на русском языке
        const apiUrl = `https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}&lang=ru`;
        
        // Используем прокси для обхода CORS
        const proxyUrl = 'https://corsproxy.io/?';
        
        const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
        return await response.json();
    } catch (error) {
        console.error('Ошибка при получении деталей игры:', error);
        return null;
    }
}

// Функция для отображения результатов поиска
function displaySearchResults(games) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('visible');
    
    if (games.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Игры не найдены</div>';
        resultsContainer.style.display = 'block';
        setTimeout(() => {
            resultsContainer.classList.add('visible');
        }, 10);
        return;
    }
    
    games.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.className = 'game-result';
        gameElement.textContent = game.name;
        gameElement.addEventListener('click', () => selectGame(game));
        resultsContainer.appendChild(gameElement);
    });
    
    resultsContainer.style.display = 'block';
    setTimeout(() => {
        resultsContainer.classList.add('visible');
    }, 10);
}

// Функция для выбора игры из результатов поиска
// Добавляем переменную для хранения последней выбранной игры
let lastSelectedGame = null;
// Глобальная переменная для хранения оригинальных тегов игры
let originalGameTags = [];

// Функция для выбора игры из результатов поиска
async function selectGame(game) {
    document.getElementById('game-search').value = game.name;
    document.getElementById('search-results').style.display = 'none';
    
    // Получаем детальную информацию об игре из RAWG на русском языке
    const gameDetails = await getGameDetails(game.id);
    
    if (gameDetails) {
        // Сохраняем данные игры для использования при расчете цены
        lastSelectedGame = gameDetails;
        
        // Добавляем отладочные сообщения
        console.log('Данные игры RAWG:', gameDetails);
        
        // Устанавливаем обложку игры и показываем контейнер
        const coverContainer = document.getElementById('cover-container');
        const gameCover = document.getElementById('game-cover');
        
        gameCover.src = gameDetails.background_image || 'placeholder.png';
        // Добавляем обработчик ошибки загрузки изображения
        gameCover.onerror = function() {
            this.src = 'placeholder.png';
        };
        coverContainer.style.display = 'block';
        
        // Добавляем класс для анимации после небольшой задержки
        setTimeout(() => {
            coverContainer.classList.add('visible');
        }, 50);
        
        // Добавляем описание игры на русском языке
        const descriptionElement = document.getElementById('game-description');
        const description = gameDetails.description_raw || 'Описание отсутствует';
        
        // Определяем максимальную длину описания в зависимости от устройства
        const maxLength = isMobileDevice() ? 100 : 280;
        
        const shortDescription = description.length > maxLength 
            ? description.substring(0, maxLength) + '...' 
            : description;
        
        descriptionElement.innerHTML = shortDescription;
        descriptionElement.style.display = 'block';
        
        // Добавляем класс для анимации после небольшой задержки
        setTimeout(() => {
            descriptionElement.classList.add('visible');
        }, 150);
        
        // Определяем тип игры на основе рейтингов и жанров (скрыто от пользователя)
        const gameType = determineGameType(gameDetails);
        
        // Устанавливаем примерную длительность из RAWG
        let playtime = 6; // Значение по умолчанию
        
        if (gameDetails.playtime && gameDetails.playtime > 0) {
            playtime = gameDetails.playtime;
            console.log('Время прохождения из RAWG:', playtime);
        }
        
        document.getElementById('game-length').value = playtime;
        
        // Добавляем ссылку на HowLongToBeat
        const hltbLink = document.getElementById('hltb-link');
        const hltbSearchUrl = `https://howlongtobeat.com/?q=${encodeURIComponent(game.name)}`;
        hltbLink.href = hltbSearchUrl;
        hltbLink.style.display = 'inline-block';
        
        // Добавляем класс для анимации после небольшой задержки
        setTimeout(() => {
            hltbLink.classList.add('visible');
        }, 200); // Задержка больше, чем у обложки и описания для эффекта каскада
        
        // Устанавливаем жанры
        const genres = gameDetails.genres.map(g => g.name).join(', ');
        document.getElementById('game-genres').value = genres;

        // Устанавливаем теги
        if (gameDetails.tags && gameDetails.tags.length > 0) {
            // Сохраняем оригинальные теги
            originalGameTags = [...gameDetails.tags];
            // Отображаем теги
            displayTags(gameDetails.tags);
        } else {
            // Очищаем теги, если их нет
            clearTags();
        }
        
        // Устанавливаем оценку
        const rating = gameDetails.metacritic ? `${gameDetails.metacritic}/100` : 'Нет данных';
        document.getElementById('game-rating').value = rating;
    }
}

// Глобальная переменная для отслеживания состояния отображения тегов
let showAllTags = false;

// Функция для отображения тегов
function displayTags(tags) {
    const tagsContainer = document.getElementById('tags-list');
    tagsContainer.innerHTML = '';
    
    // Определяем, сколько тегов показывать
    const maxVisibleTags = showAllTags ? tags.length : 5;
    const displayTags = tags.slice(0, maxVisibleTags);
    
    displayTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.textContent = tag.name;
        tagElement.dataset.id = tag.id;
        
        // Добавляем обработчик клика для удаления тега
        tagElement.addEventListener('click', function() {
            // Сохраняем информацию о том, был ли это тег Horror
            const isHorrorTag = tag.name.toLowerCase() === 'horror' || tag.name.toLowerCase() === 'ужасы';
            this.remove();
            // Обновляем lastSelectedGame.tags, удаляя выбранный тег
            if (lastSelectedGame && lastSelectedGame.tags) {
                const tagId = parseInt(this.dataset.id);
                lastSelectedGame.tags = lastSelectedGame.tags.filter(t => t.id !== tagId);

                // Если был удален тег Horror и результат уже отображается, пересчитываем стоимость
                if (isHorrorTag && document.getElementById('result').classList.contains('visible')) {
                    calculatePrice();
                }
                
                // Проверяем, есть ли еще теги, которые можно показать (только в режиме сокращенного отображения)
                if (!showAllTags && lastSelectedGame.tags.length > document.querySelectorAll('.tag').length) {
                    // Показываем следующий тег из списка
                    const visibleTagIds = Array.from(document.querySelectorAll('.tag')).map(el => parseInt(el.dataset.id));
                    const nextTag = lastSelectedGame.tags.find(t => !visibleTagIds.includes(t.id));
                    
                    if (nextTag) {
                        displayNextTag(nextTag);
                    }
                }
            }
        });
        
        tagsContainer.appendChild(tagElement);
    });
    
    // Обновляем текст и состояние кнопки переключения тегов
    updateToggleTagsButton();
}

// Функция для обновления текста и состояния кнопки переключения тегов
function updateToggleTagsButton() {
    const toggleButton = document.getElementById('toggle-tags');
    if (toggleButton) {
        if (showAllTags) {
            toggleButton.title = "Скрыть теги";
            toggleButton.textContent = "−";
            toggleButton.classList.add('active');
        } else {
            toggleButton.title = "Показать все теги";
            toggleButton.textContent = "⋯";
            toggleButton.classList.remove('active');
        }
    }
}

// Функция для переключения отображения всех тегов
function toggleAllTags() {
    showAllTags = !showAllTags;
    
    // Если у нас есть выбранная игра с тегами, обновляем отображение
    if (lastSelectedGame && lastSelectedGame.tags) {
        displayTags(lastSelectedGame.tags);
    }
}

// Функция для очистки тегов
function clearTags() {
    const tagsContainer = document.getElementById('tags-list');
    tagsContainer.innerHTML = '';
}

// Функция для сброса тегов к оригинальным
function resetTags() {
    if (originalGameTags.length > 0) {
        // Восстанавливаем оригинальные теги в lastSelectedGame
        if (lastSelectedGame) {
            lastSelectedGame.tags = [...originalGameTags];
        }
        // Отображаем оригинальные теги
        displayTags(originalGameTags);
    }
}

// Функция для ограничения частоты вызовов (debounce)
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Функция для отображения деталей игры
async function displayGameDetails(gameId) {
    // Заменяем fetchGameDetails на getGameDetails
    const gameDetails = await getGameDetails(gameId);
    
    if (gameDetails) {
        // Сохраняем выбранную игру для расчета цены
        lastSelectedGame = gameDetails;
        
        // Отображаем обложку игры
        const coverContainer = document.getElementById('cover-container');
        const gameCover = document.getElementById('game-cover');
        
        if (gameDetails.background_image) {
            gameCover.src = gameDetails.background_image;
            coverContainer.style.display = 'block';
            
            // Добавляем класс для анимации после небольшой задержки
            setTimeout(() => {
                coverContainer.classList.add('visible');
            }, 50);
        } else {
            gameCover.src = 'placeholder.png';
            coverContainer.style.display = 'block';
            
            // Добавляем класс для анимации после небольшой задержки
            setTimeout(() => {
                coverContainer.classList.add('visible');
            }, 50);
        }
        
        // Отображаем описание игры
        const descriptionElement = document.getElementById('game-description');
        if (gameDetails.description_raw) {
            // Ограничиваем длину описания
            const maxLength = 300;
            let description = gameDetails.description_raw;
            
            if (description.length > maxLength) {
                description = description.substring(0, maxLength) + '...';
            }
            
            descriptionElement.textContent = description;
            descriptionElement.style.display = 'block';
            
            // Добавляем класс для анимации после небольшой задержки
            setTimeout(() => {
                descriptionElement.classList.add('visible');
            }, 150); // Задержка больше, чем у обложки для эффекта каскада
        } else {
            descriptionElement.textContent = 'Описание отсутствует';
            descriptionElement.style.display = 'block';
            
            // Добавляем класс для анимации после небольшой задержки
            setTimeout(() => {
                descriptionElement.classList.add('visible');
            }, 150);
        }
        
        // Устанавливаем жанры
        const genres = gameDetails.genres.map(g => g.name).join(', ');
        document.getElementById('game-genres').value = genres;
        
        // Устанавливаем оценку
        const rating = gameDetails.metacritic ? `${gameDetails.metacritic}/100` : 'Нет данных';
        document.getElementById('game-rating').value = rating;
    }
}

// Также добавим функцию для очистки деталей игры при новом поиске
function clearGameDetails() {
    // Проверяем существование элементов перед обращением к ним
    const coverContainer = document.getElementById('cover-container');
    const gameDescription = document.getElementById('game-description');
    const hltbLink = document.getElementById('hltb-link');
    
    if (coverContainer) coverContainer.classList.remove('visible');
    if (gameDescription) gameDescription.classList.remove('visible');
    if (hltbLink) hltbLink.classList.remove('visible');
    
    // Скрываем элементы после завершения анимации
    setTimeout(() => {
        if (coverContainer) coverContainer.style.display = 'none';
        if (gameDescription) gameDescription.style.display = 'none';
        if (hltbLink) hltbLink.style.display = 'none';
    }, 300);
    
    // Сбрасываем другие поля
    const gameGenres = document.getElementById('game-genres');
    const gameRating = document.getElementById('game-rating');
    
    if (gameGenres) gameGenres.value = '';
    if (gameRating) gameRating.value = '';

    // Очищаем теги
    clearTags();
    // Сбрасываем оригинальные теги
    originalGameTags = [];
}

// Обновляем обработчик события для поля поиска
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('game-search');
    const gameLengthInput = document.getElementById('game-length');
    const resetTagsButton = document.getElementById('reset-tags');
    const toggleTagsButton = document.getElementById('toggle-tags');
    
    // Добавляем обработчик события для кнопки сброса тегов
    if (resetTagsButton) {
        resetTagsButton.addEventListener('click', resetTags);
    }
    
    // Добавляем обработчик события для кнопки переключения тегов
    if (toggleTagsButton) {
        toggleTagsButton.addEventListener('click', toggleAllTags);
    }
    
    // Добавляем обработчик события для поля длительности
    if (gameLengthInput) {
        gameLengthInput.addEventListener('input', function() {
            // Если игра выбрана и результат уже отображается, пересчитываем стоимость
            if (lastSelectedGame && document.getElementById('result').classList.contains('visible')) {
                calculatePrice();
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async function(e) {
            const query = e.target.value.trim();
            
            // Скрываем результат расчета при вводе нового названия игры
            document.getElementById('result').classList.remove('visible');
            
            // Очищаем детали игры при новом поиске
            clearGameDetails();
            
            if (query.length < 3) {
                document.getElementById('search-results').style.display = 'none';
                document.getElementById('loader-container').style.display = 'none';
                return;
            }
            
            // Показываем индикатор загрузки
            document.getElementById('search-results').style.display = 'none';
            document.getElementById('loader-container').style.display = 'block';
            
            const games = await searchGames(query);
            
            // Скрываем индикатор загрузки
            document.getElementById('loader-container').style.display = 'none';
            
            displaySearchResults(games);
        }, 200));
        
        // Скрываем результаты при клике вне поля поиска
        document.addEventListener('click', function(e) {
            if (e.target !== searchInput && !e.target.closest('.search-results')) {
                document.getElementById('search-results').style.display = 'none';
                document.getElementById('search-results').classList.remove('visible');
            }
        });
    }
});

// Функция для определения, является ли устройство мобильным
function isMobileDevice() {
    // Проверяем ширину экрана (менее 768px обычно считается мобильным)
    const isMobileWidth = window.innerWidth < 768;
    
    // Дополнительно проверяем User-Agent для более точного определения
    const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Устройство считается мобильным, если выполняется хотя бы одно из условий
    return isMobileWidth || isMobileAgent;
}

// Добавляем обработчик изменения размера окна
window.addEventListener('resize', function() {
    // Если есть выбранная игра, обновляем описание
    if (lastSelectedGame && lastSelectedGame.description_raw) {
        const descriptionElement = document.getElementById('game-description');
        const description = lastSelectedGame.description_raw || 'Описание отсутствует';
        
        // Определяем максимальную длину описания в зависимости от устройства
        const maxLength = isMobileDevice() ? 100 : 280;
        
        const shortDescription = description.length > maxLength 
            ? description.substring(0, maxLength) + '...' 
            : description;
        
        descriptionElement.innerHTML = shortDescription;
    }
});