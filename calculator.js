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
        hourlyRate = 200;
        breakdown.push(`Хоррор: 200 ₽/час`);
    } else if (gameType === 'competitive') {
        hourlyRate = 130;
        breakdown.push(`Соревновательная/Battle Royale: 130 ₽/час`);
    } else {
        switch(gameType) {
            case 'indie':
                hourlyRate = 160;
                breakdown.push(`Инди: 160 ₽/час`);
                break;
            case 'aa':
                hourlyRate = 170;
                breakdown.push(`AA-игра: 170 ₽/час`);
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
    totalPrice = Math.floor(totalPrice / 10) * 10;
    
    // --- НОВЫЙ КРИТЕРИЙ: увеличение стоимости при низкой оценке ---
    let ratingIncrease = 0;
    let rawgRating = null;
    if (lastSelectedGame && typeof lastSelectedGame.rating === 'number') {
        rawgRating = lastSelectedGame.rating;
        if (rawgRating < 2.8) {
            ratingIncrease = 0.15;
            breakdown.push('Низкая оценка (меньше 2.8): +15% к стоимости');
        } else if (rawgRating < 3.5) {
            ratingIncrease = 0.05;
            breakdown.push('Низкая оценка (меньше 3.5): +5% к стоимости');
        }
    }
    if (ratingIncrease > 0) {
        const increaseAmount = Math.round(totalPrice * ratingIncrease);
        totalPrice += increaseAmount;
        breakdown.push(`Сумма надбавки: ${increaseAmount} ₽`);
    }

    // Округляем итоговую стоимость после надбавки
    totalPrice = Math.floor(totalPrice / 10) * 10;

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
    
    // Удаляем предыдущий negotiate-text, если есть
    const existingNegotiateText = document.querySelector('.negotiate-text');
    if (existingNegotiateText) {
        existingNegotiateText.remove();
    }
    
    // Добавляем элемент в конец блока результатов
    resultElement.appendChild(negotiateText);
    
    // --- ДОБАВЛЯЕМ КНОПКУ "ЗАКАЗАТЬ" ---
    // Удаляем предыдущую кнопку, если есть
    const existingOrderButton = document.querySelector('.order-button');
    if (existingOrderButton) {
        existingOrderButton.remove();
    }
    
    const orderButton = document.createElement('a');
    orderButton.href = 'https://donatty.com/gamelxrd';
    orderButton.target = '_blank';
    orderButton.className = 'order-button negotiate-text'; // чтобы исчезала вместе с negotiate-text
    orderButton.textContent = 'ЗАКАЗАТЬ';
    // Добавляем кнопку после negotiateText
    resultElement.appendChild(orderButton);

    // Добавляем анимацию появления с задержкой
    setTimeout(() => {
        negotiateText.classList.add('visible');
        orderButton.classList.add('visible');
    }, 500);

    // Отображаем анимацию появления с задержкой
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
        // Оригинальный адрес API, куда нужно обратиться
        const apiUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`;
        
        // Новый адрес: мы обращаемся к НАШЕЙ функции и передаем ей нужный URL как параметр
        const proxyUrl = `https://gamelxrd.netlify.app/.netlify/functions/rawg?url=${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(proxyUrl);
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
        // Оригинальный адрес API
        const apiUrl = `https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}&lang=ru`;
        
        // Новый адрес: снова обращаемся к НАШЕЙ функции
        const proxyUrl = `https://gamelxrd.netlify.app/.netlify/functions/rawg?url=${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(proxyUrl);
        return await response.json();
    } catch (error)
    {
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
    
    const gameDetails = await getGameDetails(game.id);
    
    if (gameDetails) {
        lastSelectedGame = gameDetails;
        cacheGame(gameDetails);
        console.log('Данные игры RAWG:', gameDetails);
        
        const gamePriceInput = document.getElementById('game-price');
        gamePriceInput.value = 0; // Сбрасываем поле цены перед запросом

        // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Запрашиваем цену через ITAD по названию игры ---
        try {
            const proxyUrl = `https://gamelxrd.netlify.app/.netlify/functions/rawg?gameName=${encodeURIComponent(game.name)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.price > 0) {
                console.log(`Найдена цена через ITAD: ${data.price}`);
                // Округляем цену до целого числа на всякий случай
                gamePriceInput.value = Math.round(data.price);
            } else {
                console.log('Не удалось найти цену через ITAD, либо игра бесплатна.');
            }
        } catch (error) {
            console.error('Ошибка при получении цены из ITAD:', error);
        }
        
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
        hltbLink.style.display = 'inline-flex';

        // Добавляем подсказку
        if (!hltbLink.querySelector('.hltb-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.className = 'hltb-tooltip';
            tooltip.textContent = 'Проверь время здесь';
            hltbLink.appendChild(tooltip);
        }
        
        // Добавляем класс для анимации после небольшой задержки
        setTimeout(() => {
            hltbLink.classList.add('visible');
        }, 200); // Задержка больше, чем у обложки и описания для эффекта каскада

        // Добавляем обработчик клика для скрытия подсказки
        hltbLink.addEventListener('click', function() {
            const tooltip = this.querySelector('.hltb-tooltip');
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            }
        }, { once: true }); // Используем { once: true }, чтобы обработчик сработал только один раз
        
        // --- ДОБАВЛЯЕМ КНОПКУ STEAM ---
        // Создаем ссылку на Steam
        const steamLink = document.getElementById('steam-link') || document.createElement('a');
        steamLink.id = 'steam-link';
        steamLink.textContent = 'STEAM';
        steamLink.className = 'steam-link'; // Используем тот же класс для стилей
        
        // Пытаемся найти прямую ссылку на Steam из данных игры
        let steamUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(game.name)}`;
        if (gameDetails.stores && gameDetails.stores.length > 0) {
            // Ищем магазин Steam в списке магазинов
            const steamStore = gameDetails.stores.find(store => 
                store.store && (store.store.id === 1 || store.store.name.toLowerCase() === 'steam'));
            
            if (steamStore && steamStore.url) {
                steamUrl = steamStore.url;
            }
        }
        
        steamLink.href = steamUrl;
        steamLink.target = '_blank';
        steamLink.style.display = 'inline-flex';
        
        // Добавляем кнопку в контейнер поиска, если её ещё нет
        const searchContainer = document.querySelector('.search-input-container');
        if (!document.getElementById('steam-link')) {
            searchContainer.appendChild(steamLink);
        }
        
        // Добавляем класс для анимации после небольшой задержки
        setTimeout(() => {
            steamLink.classList.add('visible');
        }, 250); // Задержка чуть больше, чем у HLTB для эффекта каскада
        
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
        
        // Устанавливаем Metacritic
        const metacriticValue = gameDetails.metacritic || 'Нет данных';
        document.getElementById('game-metacritic').value = metacriticValue;

        // Устанавливаем оценку из RAWG rating
        const ratingElement = document.getElementById('game-rating');
        if (gameDetails.rating) {
            const rating = gameDetails.rating.toFixed(1);
            ratingElement.value = `${rating}`;
            
            // Добавляем цветовую градацию
            ratingElement.classList.remove('rating-low', 'rating-medium', 'rating-high');
            
            if (rating < 3.0) {
                ratingElement.classList.add('rating-low');
            } else if (rating < 4.0) {
                ratingElement.classList.add('rating-medium');
            } else {
                ratingElement.classList.add('rating-high');
            }
        } else {
            ratingElement.value = 'Нет данных';
            ratingElement.classList.remove('rating-low', 'rating-medium', 'rating-high');
        }
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
    
    // Проверяем, был ли Horror тег до отображения новых тегов
    const hadHorrorTag = lastSelectedGame && lastSelectedGame.tags && 
        lastSelectedGame.tags.some(t => t.name.toLowerCase() === 'horror' || t.name.toLowerCase() === 'ужасы');
    
    displayTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.textContent = tag.name;
        tagElement.dataset.id = tag.id;

        // Проверяем, является ли тег хоррором
        const isHorrorTag = tag.name.toLowerCase() === 'horror' || tag.name.toLowerCase() === 'ужасы';
        if (isHorrorTag) {
            tagElement.classList.add('horror-tag');
        }
        
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
                    displayNextAvailableTag();
                }
            }
        });
        
        tagsContainer.appendChild(tagElement);
    });
    
    // Проверяем, появился ли Horror тег после отображения новых тегов
    const hasHorrorTag = Array.from(document.querySelectorAll('.tag')).some(
        tag => tag.textContent.toLowerCase() === 'horror' || tag.textContent.toLowerCase() === 'ужасы'
    );
    
    // Если статус Horror тега изменился и результат уже отображается, выполняем перерасчет
    // Добавляем проверку на showAllTags, чтобы перерасчет работал в обоих режимах отображения
    if (hadHorrorTag !== hasHorrorTag && document.getElementById('result').classList.contains('visible')) {
        calculatePrice();
    }
    
    // Обновляем текст и состояние кнопки переключения тегов
    updateToggleTagsButton();
}

// Функция для отображения следующего доступного тега
function displayNextAvailableTag() {
    if (!lastSelectedGame || !lastSelectedGame.tags) return;
    
    const tagsContainer = document.getElementById('tags-list');
    const visibleTagIds = Array.from(document.querySelectorAll('.tag')).map(el => parseInt(el.dataset.id));
    
    // Находим первый тег, который еще не отображается
    const nextTag = lastSelectedGame.tags.find(t => !visibleTagIds.includes(t.id));
    
    if (nextTag) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.textContent = nextTag.name;
        tagElement.dataset.id = nextTag.id;
        
        // Проверяем, является ли тег хоррором
        const isHorrorTag = nextTag.name.toLowerCase() === 'horror' || nextTag.name.toLowerCase() === 'ужасы';
        if (isHorrorTag) {
            tagElement.classList.add('horror-tag');
        }
        
        // Добавляем обработчик клика для удаления тега
        tagElement.addEventListener('click', function() {
            // Сохраняем информацию о том, был ли это тег Horror
            const isHorrorTag = nextTag.name.toLowerCase() === 'horror' || nextTag.name.toLowerCase() === 'ужасы';
            this.remove();
            
            // Обновляем lastSelectedGame.tags, удаляя выбранный тег
            if (lastSelectedGame && lastSelectedGame.tags) {
                const tagId = parseInt(this.dataset.id);
                lastSelectedGame.tags = lastSelectedGame.tags.filter(t => t.id !== tagId);
                
                // Если был удален тег Horror и результат уже отображается, пересчитываем стоимость
                if (isHorrorTag && document.getElementById('result').classList.contains('visible')) {
                    calculatePrice();
                }
                
                // Проверяем, есть ли еще теги, которые можно показать
                if (!showAllTags && lastSelectedGame.tags.length > document.querySelectorAll('.tag').length) {
                    displayNextAvailableTag();
                }
            }
        });
        
        tagsContainer.appendChild(tagElement);
    }
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
    // Проверяем наличие тега Horror перед очисткой
    const hadHorrorTag = Array.from(document.querySelectorAll('.tag')).some(
        tag => tag.textContent.toLowerCase() === 'horror' || tag.textContent.toLowerCase() === 'ужасы'
    );
    
    // Очищаем контейнер тегов
    const tagsContainer = document.getElementById('tags-list');
    tagsContainer.innerHTML = '';
    
    // Восстанавливаем оригинальные теги
    if (lastSelectedGame && originalGameTags.length > 0) {
        lastSelectedGame.tags = [...originalGameTags];
        
        // Проверяем, появился ли тег Horror после восстановления
        const hasHorrorTag = originalGameTags.some(
            tag => tag.name.toLowerCase() === 'horror' || tag.name.toLowerCase() === 'ужасы'
        );
        
        // Отображаем восстановленные теги
        displayTags(originalGameTags);
        
        // Если статус тега Horror изменился и результат отображается, выполняем перерасчет
        if (hadHorrorTag !== hasHorrorTag && document.getElementById('result').classList.contains('visible')) {
            calculatePrice();
        }
    }
    
    // Обновляем состояние кнопки переключения тегов
    updateToggleTagsButton();
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
        
        // Устанавливаем Metacritic
        const metacriticValue = gameDetails.metacritic || 'Нет данных';
        document.getElementById('game-metacritic').value = metacriticValue;

        // Устанавливаем оценку (сохраняем текущее поведение)
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
    if (hltbLink) {
        const tooltip = hltbLink.querySelector('.hltb-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
        hltbLink.classList.remove('visible');
    }
    
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
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                resetAllFields();
            }
        });
    }
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


function resetAllFields() {
    lastSelectedGame = null;
    originalGameTags = [];

    // Скрыть обложку и описание
    const coverContainer = document.getElementById('cover-container');
    if (coverContainer) {
        coverContainer.classList.remove('visible');
        setTimeout(() => { coverContainer.style.display = 'none'; }, 300);
    }
    const descriptionElement = document.getElementById('game-description');
    if (descriptionElement) {
        descriptionElement.classList.remove('visible');
        setTimeout(() => { descriptionElement.style.display = 'none'; }, 300);
    }
    const hltbLink = document.getElementById('hltb-link');
    if (hltbLink) {
        hltbLink.classList.remove('visible');
        setTimeout(() => { hltbLink.style.display = 'none'; }, 300);
    }
    
    // Скрываем кнопку Steam
    const steamLink = document.getElementById('steam-link');
    if (steamLink) {
        steamLink.classList.remove('visible');
        setTimeout(() => { steamLink.style.display = 'none'; }, 300);
    }

    // Сбросить значения полей
    const lengthInput = document.getElementById('game-length');
    if (lengthInput) lengthInput.value = '6';
    const genresInput = document.getElementById('game-genres');
    if (genresInput) genresInput.value = '';
    const metacriticInput = document.getElementById('game-metacritic');
    if (metacriticInput) metacriticInput.value = '';
    const ratingElement = document.getElementById('game-rating');
    if (ratingElement) {
        ratingElement.value = '';
        ratingElement.classList.remove('rating-low', 'rating-medium', 'rating-high');
    }

    // Сбросить теги
    clearTags && clearTags();

    // Скрыть результат
    const resultElement = document.getElementById('result');
    if (resultElement && resultElement.classList.contains('visible')) {
        resultElement.classList.remove('visible');
    }
}

// Ключ для хранения кеша в localStorage
const RECENT_GAMES_KEY = 'recentGames';
const RECENT_GAMES_LIMIT = 4;

// Сохраняем игру в кеш
function cacheGame(game) {
    let recentGames = JSON.parse(localStorage.getItem(RECENT_GAMES_KEY)) || [];
    // Удаляем, если уже есть такая игра
    recentGames = recentGames.filter(g => g.id !== game.id);
    // Добавляем в начало
    recentGames.unshift({
        id: game.id,
        name: game.name,
        background_image: game.background_image || '',
        rating: game.rating || null
    });
    // Обрезаем до лимита
    if (recentGames.length > RECENT_GAMES_LIMIT) {
        recentGames = recentGames.slice(0, RECENT_GAMES_LIMIT);
    }
    localStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(recentGames));
}

// Получаем последние игры из кеша
function getRecentGames() {
    return JSON.parse(localStorage.getItem(RECENT_GAMES_KEY)) || [];
}

// Показываем выпадающий список последних игр
function showRecentGamesDropdown() {
    const recentGames = getRecentGames();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    if (recentGames.length === 0) return;
    recentGames.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.className = 'game-result recent-game';
        gameElement.textContent = game.name + (game.rating ? ` (${game.rating})` : '');
        gameElement.addEventListener('click', () => {
            selectGame(game);
            resultsContainer.style.display = 'none';
        });
        resultsContainer.appendChild(gameElement);
    });
    resultsContainer.style.display = 'block';
    setTimeout(() => {
        resultsContainer.classList.add('visible');
    }, 10);
}

// Показываем последние игры при фокусе на поле поиска, если оно пустое
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('game-search');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            if (this.value.trim() === '') {
                showRecentGamesDropdown();
            }
        });
        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                showRecentGamesDropdown();
            }
        });
        // Скрываем выпадающий список при потере фокуса
        searchInput.addEventListener('blur', function() {
            setTimeout(() => {
                document.getElementById('search-results').style.display = 'none';
            }, 200);
        });
    }
});