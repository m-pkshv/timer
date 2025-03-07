import i18n from './i18n.js';

// Определяем функцию initApp глобально, до её использования
function initApp() {
    "use strict";

    // Объявляем все переменные и объекты
    let elements = {};
    let state = {};
    let progressElements = {};
    let utils = {};
    let soundManager = {};
    let progressManager = {};
    let menuManager = {};
    let themeManager = {};
    let timer = {};
    let timerManager = {};
    let stopwatch = {};
    let tabManager = {};
    let languageManager = {};
    
    // Инициализация элементов DOM
    function initDOMElements() {

        elements = {
            // Общие элементы
            lightThemeBtn: document.getElementById('lightThemeBtn'),
            darkThemeBtn: document.getElementById('darkThemeBtn'),
            systemThemeBtn: document.getElementById('systemThemeBtn'),
            menuBtn: document.getElementById('menuBtn'),
            menuDropdown: document.getElementById('menuDropdown'),
            overlay: document.getElementById('overlay'),
            
            // Элементы вкладок
            timerTabBtn: document.getElementById('timerTabBtn'),
            stopwatchTabBtn: document.getElementById('stopwatchTabBtn'),
            timerTab: document.getElementById('timerTab'),
            stopwatchTab: document.getElementById('stopwatchTab'),
            
            // Элементы таймера
            timerList: document.getElementById('timerList'),
            addTimerBtn: document.getElementById('addTimerBtn'),
            display: document.getElementById('display'),
            progressInfo: document.getElementById('progressInfo'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            cyclesInput: document.getElementById('cyclesInput'),
            cyclesMinusBtn: document.getElementById('cyclesMinusBtn'),
            cyclesPlusBtn: document.getElementById('cyclesPlusBtn'),
            totalTimeDisplay: document.getElementById('totalTimeDisplay'),
            currentTimerProgress: document.getElementById('currentTimerProgress'),
            totalTimeProgress: document.getElementById('totalTimeProgress'),
            
            // Элементы секундомера
            stopwatchDisplay: document.getElementById('stopwatchDisplay'),
            startStopwatchBtn: document.getElementById('startStopwatchBtn'),
            pauseStopwatchBtn: document.getElementById('pauseStopwatchBtn'),
            resetStopwatchBtn: document.getElementById('resetStopwatchBtn'),
            lapStopwatchBtn: document.getElementById('lapStopwatchBtn'),
            lapsList: document.getElementById('lapsList'),
            stopwatchProgress: document.getElementById('stopwatchProgress'),

            // Элементы локализации
            languageSelector: document.getElementById('languageSelector')
        };
        
        // Инициализируем элементы прогресс-бара (с проверками на существование)
        progressElements = {
            currentCircle: elements.currentTimerProgress ? elements.currentTimerProgress.querySelector('.progress-circle-current') : null,
            totalCircle: elements.totalTimeProgress ? elements.totalTimeProgress.querySelector('.progress-circle-total') : null,
            stopwatchCircle: elements.stopwatchProgress ? elements.stopwatchProgress.querySelector('.progress-circle-stopwatch') : null,
            currentCircumference: elements.currentTimerProgress && elements.currentTimerProgress.querySelector('.progress-circle-current') ? 
                parseFloat(elements.currentTimerProgress.querySelector('.progress-circle-current').getAttribute('stroke-dasharray')) : 0,
            totalCircumference: elements.totalTimeProgress && elements.totalTimeProgress.querySelector('.progress-circle-total') ? 
                parseFloat(elements.totalTimeProgress.querySelector('.progress-circle-total').getAttribute('stroke-dasharray')) : 0,
            stopwatchCircumference: elements.stopwatchProgress && elements.stopwatchProgress.querySelector('.progress-circle-stopwatch') ? 
                parseFloat(elements.stopwatchProgress.querySelector('.progress-circle-stopwatch').getAttribute('stroke-dasharray')) : 0
        };
    }


    // Инициализация управления языком
    function initLanguageManager() {
        languageManager = {
            init: function() {
                // Получаем все доступные языки
                const languages = i18n.getAvailableLanguages();
                const currentLang = i18n.getCurrentLanguage();
                
                // Очищаем контейнер выбора языка
                if (elements.languageSelector) {
                    elements.languageSelector.innerHTML = '';
                    
                    // Создаем кнопки для каждого языка
                    for (const [langCode, langName] of Object.entries(languages)) {
                        const langButton = document.createElement('button');
                        langButton.className = 'lang-btn';
                        langButton.dataset.lang = langCode;
                        
                        // Создаем изображение флага
                        const flagImg = document.createElement('img');
                        flagImg.src = `icons/flags/${langCode}.png`;
                        flagImg.alt = langName;
                        flagImg.className = 'flag-icon';

                        flagImg.onerror = function() {
                            // Если изображение не загружается, отображаем код языка
                            this.parentNode.textContent = langCode.toUpperCase();
                        };
                        
                        // Добавляем изображение в кнопку
                        langButton.appendChild(flagImg);
                        
                        // Добавляем название языка в качестве подсказки
                        langButton.title = langName;
                        
                        // Добавляем класс active для текущего языка
                        if (langCode === currentLang) {
                            langButton.classList.add('active');
                        }
                        
                        // Добавляем обработчик клика
                        langButton.addEventListener('click', () => {
                            this.changeLanguage(langCode);
                        });
                        
                        elements.languageSelector.appendChild(langButton);
                    }
                }
                
            },
            
            changeLanguage: function(langCode) {
                // Переключаем язык
                i18n.changeLanguage(langCode)
                    .then(() => {
                        // Обновляем HTML
                        i18n.translatePage();
                        
                        // Обновляем активную кнопку языка
                        const langButtons = document.querySelectorAll('.lang-btn');
                        langButtons.forEach(btn => {
                            btn.classList.toggle('active', btn.dataset.lang === langCode);
                        });
                        
                        // Обновляем атрибут lang на html
                        document.documentElement.lang = langCode;
                        
                        // Закрываем меню
                        menuManager.close();
                        
                        // Обновляем динамические тексты в приложении
                        this.updateDynamicTexts();
                    })
                    .catch(error => {
                        console.error('Ошибка при смене языка:', error);
                    });
            },
            
            updateDynamicTexts: function() {
                // Обновляем тексты, которые не обновляются автоматически через data-i18n
                
                // Обновляем прогресс-инфо, если таймер запущен
                if (state.timers.length > 0) {
                    timer.updateDisplay();
                }
                
                // Обновляем тексты кнопок звука
                const soundButtons = document.querySelectorAll('.btn-sound');
                soundButtons.forEach((button, index) => {
                    const isSoundEnabled = state.timers[index] && state.timers[index].soundEnabled;
                    button.title = i18n.translate(isSoundEnabled ? 'SOUND_ENABLED' : 'SOUND_DISABLED');
                });
                
                // Обновляем тексты в списке кругов
                if (state.laps && state.laps.length > 0) {
                    stopwatch.updateLaps();
                }
            }
        };
    }


    
    // Инициализация состояния приложения
    function initState() {
        state = {
            // Общее состояние
            isDarkTheme: false,
            audioContext: null,
            themeMode: 'system', // По умолчанию используем системную тему
            
            // Состояние таймера
            timers: [],
            currentTimerIndex: 0,
            currentCycle: 0,
            totalCycles: 1,
            remainingSeconds: 0,
            totalTimeSeconds: 0,
            elapsedTimeSeconds: 0,
            remainingTotalSeconds: 0,
            initialTimerDuration: 0, // Начальная длительность текущего таймера
            timerInterval: null,
            isTimerPaused: false,
            useMultipleSounds: false,
            
            // Состояние секундомера
            stopwatchStartTime: 0,
            stopwatchElapsedTime: 0,
            stopwatchInterval: null,
            isStopwatchRunning: false,
            laps: [],
            lastLapTime: 0
        };
    }
    
    // Вспомогательные функции
    function initUtils() {
        utils = {
            // Функция для интерполяции между двумя цветами
            interpolateColor: function(color1, color2, factor) {
                try {
                    // Проверяем, что цвета начинаются с #
                    if (color1.startsWith('rgb')) {
                        // Упрощенная обработка RGB строк для примера
                        return color2; // Возвращаем второй цвет как запасной вариант
                    }
                    
                    // Конвертируем hex цвета в RGB
                    const r1 = parseInt(color1.substring(1, 3), 16);
                    const g1 = parseInt(color1.substring(3, 5), 16);
                    const b1 = parseInt(color1.substring(5, 7), 16);
                    
                    const r2 = parseInt(color2.substring(1, 3), 16);
                    const g2 = parseInt(color2.substring(3, 5), 16);
                    const b2 = parseInt(color2.substring(5, 7), 16);
                    
                    // Интерполяция
                    const r = Math.round(r1 + factor * (r2 - r1));
                    const g = Math.round(g1 + factor * (g2 - g1));
                    const b = Math.round(b1 + factor * (b2 - b1));
                    
                    // Конвертируем обратно в формат rgb
                    return `rgb(${r}, ${g}, ${b})`;
                } catch (e) {
                    console.error('Ошибка интерполяции цвета:', e, color1, color2);
                    return color2; // Возвращаем второй цвет в случае ошибки
                }
            },
            
            // Конвертирует общее количество секунд в объект с часами, минутами и секундами
            secondsToTimeObject: function(totalSeconds) {
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                
                return {
                    hours,
                    minutes,
                    seconds
                };
            },
    
            // Форматирует объект времени в строку формата чч:мм:сс
            formatTimeObject: function(timeObj) {
                return `${timeObj.hours.toString().padStart(2, '0')}:${timeObj.minutes.toString().padStart(2, '0')}:${timeObj.seconds.toString().padStart(2, '0')}`;
            },
    
            // Конвертирует строку времени формата чч:мм:сс в секунды
            timeStringToSeconds: function(timeString) {
                // Разделяем строку на компоненты
                const parts = timeString.split(':');
                
                // Проверяем, сколько компонентов у нас есть
                let hours = 0, minutes = 0, seconds = 0;
                
                if (parts.length === 3) {
                    // Формат чч:мм:сс
                    hours = parseInt(parts[0]) || 0;
                    minutes = parseInt(parts[1]) || 0;
                    seconds = parseInt(parts[2]) || 0;
                } else if (parts.length === 2) {
                    // Формат мм:сс
                    minutes = parseInt(parts[0]) || 0;
                    seconds = parseInt(parts[1]) || 0;
                } else if (parts.length === 1) {
                    // Только секунды
                    seconds = parseInt(parts[0]) || 0;
                }
                
                // Переводим всё в секунды
                return hours * 3600 + minutes * 60 + seconds;
            },
    
            // Обработка события изменения поля ввода времени
            handleTimeInputChange: function(input, onChangeCallback) {
                // Получаем текущее значение
                let timeString = input.value;
                
                // Проверяем соответствие формату чч:мм:сс или мм:сс или сс
                const timePattern = /^(\d{0,2}:)?(\d{0,2}:)?(\d{0,2})$/;
                
                if (!timePattern.test(timeString)) {
                    // Если формат неверный, восстанавливаем предыдущее корректное значение
                    input.value = input.dataset.lastValidValue || '00:00:00';
                    return;
                }
                
                // Если строка неполная (например, '5:'), дополняем нулями
                const parts = timeString.split(':');
                if (parts.length < 3) {
                    // Добавляем недостающие части
                    while (parts.length < 3) {
                        parts.unshift('00');
                    }
                    timeString = parts.join(':');
                }
                
                // Приводим компоненты к двузначному формату
                const formattedParts = parts.map(part => part.padStart(2, '0'));
                const formattedTime = formattedParts.join(':');
                
                // Обновляем значение в поле
                input.value = formattedTime;
                
                // Сохраняем последнее корректное значение
                input.dataset.lastValidValue = formattedTime;
                
                // Конвертируем в секунды и вызываем колбэк
                const seconds = this.timeStringToSeconds(formattedTime);
                if (onChangeCallback) {
                    onChangeCallback(seconds);
                }
            }
        };
    }
    
    // Инициализация функций управления звуком
    function initSoundManager() {
        soundManager = {
            updateButtonState: function(button, isEnabled) {
                if (!button) return;
                
                if (isEnabled) {
                    button.textContent = '🔔'; // Bell emoji
                    button.title = i18n.translate('SOUND_ENABLED');
                } else {
                    button.textContent = '🔕'; // Bell with slash emoji
                    button.title = i18n.translate('SOUND_DISABLED');
                }
            },
            
            playBeep: function(type = "end") {
                // Проверяем, включен ли звук для текущего таймера
                if (!state.timers[state.currentTimerIndex] || !state.timers[state.currentTimerIndex].soundEnabled) {
                    return;
                }
                
                try {
                    // Инициализация аудио-контекста при первом звуке
                    if (!state.audioContext) {
                        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    }
                    
                    // Создание осциллятора для звукового сигнала
                    const oscillator = state.audioContext.createOscillator();
                    const gainNode = state.audioContext.createGain();
                    
                    // Настройка звука в зависимости от типа
                    switch(type) {
                        case "warning": // Первый предупреждающий сигнал (за 2 секунды)
                            oscillator.type = 'sine';
                            oscillator.frequency.setValueAtTime(660, state.audioContext.currentTime);
                            gainNode.gain.setValueAtTime(0.3, state.audioContext.currentTime); // Тише
                            oscillator.start();
                            oscillator.stop(state.audioContext.currentTime + 0.15); // Короче
                            break;
                            
                        case "warning2": // Второй предупреждающий сигнал (за 1 секунду)
                            oscillator.type = 'sine';
                            oscillator.frequency.setValueAtTime(770, state.audioContext.currentTime);
                            gainNode.gain.setValueAtTime(0.4, state.audioContext.currentTime); // Громче
                            oscillator.start();
                            oscillator.stop(state.audioContext.currentTime + 0.2); // Длиннее
                            break;
                            
                        case "end": // Финальный сигнал
                        default:
                            oscillator.type = 'sine';
                            oscillator.frequency.setValueAtTime(880, state.audioContext.currentTime);
                            gainNode.gain.setValueAtTime(0.5, state.audioContext.currentTime);
                            oscillator.start();
                            oscillator.stop(state.audioContext.currentTime + 0.3); // Самый длинный
                            break;
                    }
                    
                    // Подключение узлов
                    oscillator.connect(gainNode);
                    gainNode.connect(state.audioContext.destination);
                    
                } catch (e) {
                    console.error('Ошибка воспроизведения звука:', e);
                }
            },

            // Функция для сохранения настройки звука в localStorage
            saveAudioSettings: function() {
                try {
                    localStorage.setItem('useMultipleSounds', JSON.stringify(state.useMultipleSounds));
                } catch (e) {
                    console.error('Ошибка сохранения настройки звука:', e);
                }
            },

            // Функция для загрузки настройки звука из localStorage
            loadAudioSettings: function() {
                try {
                    const savedSetting = localStorage.getItem('useMultipleSounds');
                    if (savedSetting !== null) {
                        state.useMultipleSounds = JSON.parse(savedSetting);
                        // Обновляем отображение кнопки
                        this.updateSoundModeButton();
                    }
                } catch (e) {
                    console.error('Ошибка загрузки настройки звука:', e);
                }
            },

            // Функция для переключения режима звука
            toggleSoundMode: function() {
                state.useMultipleSounds = !state.useMultipleSounds;
                this.updateSoundModeButton();
                this.saveAudioSettings();
            },

            // Функция для обновления состояния кнопки режима звука
            updateSoundModeButton: function() {
                const soundModeBtn = document.getElementById('soundModeBtn');
                if (soundModeBtn) {
                    if (state.useMultipleSounds) {
                        soundModeBtn.textContent = '🔔 🔔 🔔';
                        soundModeBtn.title = i18n.translate('MULTIPLE_SOUND_ENABLED');
                        soundModeBtn.classList.add('active');
                    } else {
                        soundModeBtn.textContent = '🔔';
                        soundModeBtn.title = i18n.translate('SINGLE_SOUND_ENABLED');
                        soundModeBtn.classList.remove('active');
                    }
                }
            }
        };
    }
    
    // Инициализация функций для управления прогресс-барами
    function initProgressManager() {
        progressManager = {
            updateCurrentTimer: function(percentage) {
                if (!progressElements.currentCircle) return;
                
                // Обновление положения прогресс-бара
                const offset = progressElements.currentCircumference * (1 - percentage);
                progressElements.currentCircle.style.strokeDashoffset = offset;
                
                // Обновление цвета в зависимости от процента завершения
                // Изменяем цвет от зеленого к оранжевому, а затем к красному
                let color;
                
                if (percentage > 0.66) {
                    // От 100% до 66% - зеленый
                    color = getComputedStyle(document.documentElement).getPropertyValue('--progress-green');
                } else if (percentage > 0.33) {
                    // От 66% до 33% - постепенно от зеленого к оранжевому
                    const greenColor = getComputedStyle(document.documentElement).getPropertyValue('--progress-green').trim();
                    const orangeColor = getComputedStyle(document.documentElement).getPropertyValue('--progress-orange').trim();
                    const normalizedPercentage = (percentage - 0.33) / 0.33; // от 0 до 1
                    color = utils.interpolateColor(orangeColor, greenColor, normalizedPercentage);
                } else if (percentage > 0) {
                    // От 33% до 0% - постепенно от оранжевого к красному
                    const orangeColor = getComputedStyle(document.documentElement).getPropertyValue('--progress-orange').trim();
                    const redColor = getComputedStyle(document.documentElement).getPropertyValue('--progress-red').trim();
                    const normalizedPercentage = percentage / 0.33; // от 0 до 1
                    color = utils.interpolateColor(redColor, orangeColor, normalizedPercentage);
                } else {
                    // 0% - красный
                    color = getComputedStyle(document.documentElement).getPropertyValue('--progress-red');
                }
                
                progressElements.currentCircle.style.stroke = color;
            },
            
            updateStopwatchProgress: function(seconds) {
                if (!progressElements.stopwatchCircle) return;
                
                // Для секундомера мы используем циклический прогресс, каждый круг = 60 секунд
                const minute = seconds % 60;
                const percentage = minute / 60;
                
                const offset = progressElements.stopwatchCircumference * (1 - percentage);
                progressElements.stopwatchCircle.style.strokeDashoffset = offset;
            },
            
            updateTotalTime: function(percentage) {
                if (!progressElements.totalCircle) return;
                
                const offset = progressElements.totalCircumference * (1 - percentage);
                progressElements.totalCircle.style.strokeDashoffset = offset;
            },
            
            reset: function() {
                if (progressElements.currentCircle) {
                    progressElements.currentCircle.style.strokeDashoffset = 0;
                }
                if (progressElements.totalCircle) {
                    progressElements.totalCircle.style.strokeDashoffset = 0;
                }
                // Сбрасываем цвет внешнего прогресс-бара на зеленый
                if (progressElements.currentCircle) {
                    progressElements.currentCircle.style.stroke = getComputedStyle(document.documentElement).getPropertyValue('--progress-green');
                }
            }
        };
    }
    
    // Инициализация управления меню
    function initMenuManager() {
        menuManager = {
            isOpen: false,
            
            toggle: function() {
                this.isOpen = !this.isOpen;
                
                if (this.isOpen) {
                    elements.menuBtn.classList.add('active');
                    elements.menuDropdown.classList.add('visible');
                    elements.overlay.classList.add('visible');
                } else {
                    elements.menuBtn.classList.remove('active');
                    elements.menuDropdown.classList.remove('visible');
                    elements.overlay.classList.remove('visible');
                }
            },
            
            close: function() {
                if (this.isOpen) {
                    this.isOpen = false;
                    elements.menuBtn.classList.remove('active');
                    elements.menuDropdown.classList.remove('visible');
                    elements.overlay.classList.remove('visible');
                }
            }
        };
    }
    
    // Инициализация управления темой
    function initThemeManager() {
        themeManager = {
            init: function() {
                // Проверяем сохраненную тему в localStorage
                const savedTheme = localStorage.getItem('theme');
                const themeMode = localStorage.getItem('theme-mode');
                
                // Если режим не указан, устанавливаем системную тему по умолчанию
                if (!themeMode) {
                    localStorage.setItem('theme-mode', 'system');
                    this.setSystemTheme(false);
                } else if (themeMode === 'system') {
                    // Если выбрана системная тема
                    this.setSystemTheme(false);
                } else if (savedTheme) {
                    // Если в localStorage есть сохраненная тема (ручной режим)
                    if (savedTheme === 'dark') {
                        document.body.classList.add('dark-theme');
                        state.isDarkTheme = true;
                    } else {
                        document.body.classList.remove('dark-theme');
                        state.isDarkTheme = false;
                    }
                    document.documentElement.setAttribute('data-theme', state.isDarkTheme ? 'dark' : 'light');
                }
                
                // Добавляем слушатель изменений системной темы
                try {
                    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                        // Изменяем тему только если выбран системный режим
                        if (localStorage.getItem('theme-mode') === 'system') {
                            this.applySystemTheme();
                            console.log('Системная тема изменена на:', e.matches ? 'тёмную' : 'светлую');
                        }
                    });
                } catch (e) {
                    console.error('Ошибка при установке слушателя темы:', e);
                }
                
                this.updateActiveButtons();
            },
            
            applySystemTheme: function() {
                const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                
                if (prefersDarkTheme) {
                    document.body.classList.add('dark-theme');
                    state.isDarkTheme = true;
                } else {
                    document.body.classList.remove('dark-theme');
                    state.isDarkTheme = false;
                }
                
                document.documentElement.setAttribute('data-theme', state.isDarkTheme ? 'dark' : 'light');
                this.updateActiveButtons();
            },
            
            setLightTheme: function() {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
                localStorage.setItem('theme-mode', 'manual');
                state.isDarkTheme = false;
                document.documentElement.setAttribute('data-theme', 'light');
                this.updateActiveButtons();
            },
            
            setDarkTheme: function() {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
                localStorage.setItem('theme-mode', 'manual');
                state.isDarkTheme = true;
                document.documentElement.setAttribute('data-theme', 'dark');
                this.updateActiveButtons();
            },
            
            setSystemTheme: function(updateStorage = true) {
                if (updateStorage) {
                    localStorage.setItem('theme-mode', 'system');
                }
                this.applySystemTheme();
            },
            
            updateActiveButtons: function() {
                // Проверяем наличие кнопок
                if (!elements.lightThemeBtn || !elements.darkThemeBtn || !elements.systemThemeBtn) return;
                
                // Сначала снимаем класс active со всех кнопок
                elements.lightThemeBtn.classList.remove('active');
                elements.darkThemeBtn.classList.remove('active');
                elements.systemThemeBtn.classList.remove('active');
                
                // Затем добавляем active нужной кнопке
                const themeMode = localStorage.getItem('theme-mode');
                
                if (themeMode === 'system') {
                    elements.systemThemeBtn.classList.add('active');
                } else {
                    if (state.isDarkTheme) {
                        elements.darkThemeBtn.classList.add('active');
                    } else {
                        elements.lightThemeBtn.classList.add('active');
                    }
                }
            }
        };
    }
    
    // Инициализация функций таймера
    function initTimer() {
        timer = {
            start: function() {
                if (state.timers.length === 0) {
                    alert(i18n.translate('NO_TIMERS_ERROR'));
                    return;
                }
                
                if (state.isTimerPaused) {
                    state.isTimerPaused = false;
                } else {
                    state.currentTimerIndex = 0;
                    state.currentCycle = 1;
                    state.remainingSeconds = state.timers[state.currentTimerIndex].duration;
                    state.initialTimerDuration = state.timers[state.currentTimerIndex].duration; // Сохраняем начальную длительность
                    state.elapsedTimeSeconds = 0;
                    
                    // Получаем значение из поля ввода и преобразуем его в число
                    state.totalCycles = parseInt(elements.cyclesInput.value) || 1;
                    
                    // Рассчитать общее время
                    state.totalTimeSeconds = timer.calculateTotalSeconds();
                    state.remainingTotalSeconds = state.totalTimeSeconds;
                    
                    // Сбросить прогресс-бары в начальное состояние
                    progressManager.reset();
                    
                    // Подсветка активного таймера
                    timer.updateActiveTimer();
                }
                
                elements.startBtn.disabled = true;
                elements.pauseBtn.disabled = false;
                
                // Запуск интервала
                state.timerInterval = setInterval(timer.update, 1000);
                timer.updateDisplay();
            },
            
            pause: function() {
                clearInterval(state.timerInterval);
                state.isTimerPaused = true;
                elements.startBtn.disabled = false;
                elements.pauseBtn.disabled = true;
                elements.progressInfo.innerHTML = '<div>Таймер на паузе</div><div>&nbsp;</div>';
            },
            
            reset: function() {
                clearInterval(state.timerInterval);
                state.currentTimerIndex = 0;
                state.currentCycle = 0;
                state.remainingSeconds = 0;
                state.elapsedTimeSeconds = 0;
                state.remainingTotalSeconds = 0;
                state.isTimerPaused = false;
                elements.startBtn.disabled = false;
                elements.pauseBtn.disabled = true;
                elements.display.textContent = '00:00';
                elements.progressInfo.innerHTML = `<div>${i18n.translate('TIMER_NOT_STARTED')}</div><div>&nbsp;</div>`;
                
                // Сброс прогресс-баров
                progressManager.reset();
                
                // Сброс подсветки таймеров
                const timerContainers = document.querySelectorAll('.timer-container');
                timerContainers.forEach(container => {
                    container.style.backgroundColor = 'var(--container-bg)';
                });
            },
            
            update: function() {
                state.remainingSeconds--;
                state.elapsedTimeSeconds++;
                state.remainingTotalSeconds--;
                
                // Обновление прогресс-баров
                if (state.initialTimerDuration > 0) {
                    const currentPercentage = state.remainingSeconds / state.initialTimerDuration;
                    progressManager.updateCurrentTimer(currentPercentage);
                }
                
                if (state.totalTimeSeconds > 0) {
                    const totalPercentage = state.remainingTotalSeconds / state.totalTimeSeconds;
                    progressManager.updateTotalTime(totalPercentage);
                }
                
                // Проверяем, нужно ли воспроизводить предупреждающие звуки
                if (state.useMultipleSounds && 
                    state.timers[state.currentTimerIndex] && 
                    state.timers[state.currentTimerIndex].soundEnabled) {
                    
                    if (state.remainingSeconds === 2) {
                        // Воспроизведение предупреждающего сигнала за 2 секунды
                        soundManager.playBeep("warning");
                    } else if (state.remainingSeconds === 1) {
                        // Воспроизведение предупреждающего сигнала за 1 секунду
                        soundManager.playBeep("warning2");
                    }
                }
                
                if (state.remainingSeconds <= 0) {
                    // Воспроизведение финального звукового сигнала
                    soundManager.playBeep("end");
                    
                    // Приостановить таймер перед переходом к следующему
                    clearInterval(state.timerInterval);
                    
                    // Переход к следующему таймеру без задержки
                    state.currentTimerIndex++;
                    
                    // Проверка, закончились ли все таймеры в текущем цикле
                    if (state.currentTimerIndex >= state.timers.length) {
                        state.currentTimerIndex = 0;
                        state.currentCycle++;
                        
                        // Проверка, закончились ли все циклы
                        if (state.currentCycle > state.totalCycles) {
                            elements.progressInfo.innerHTML = `<div>Общее время: ${timer.formatTime(state.elapsedTimeSeconds)} / ${timer.formatTime(state.totalTimeSeconds)}</div>
                            <div>Все таймеры и циклы завершены!</div>`;
                            elements.startBtn.disabled = false;
                            elements.pauseBtn.disabled = true;
                            elements.display.textContent = '00:00'; // Показываем 00:00 только при полном завершении
                            return;
                        }
                    }
                    
                    state.remainingSeconds = state.timers[state.currentTimerIndex].duration;
                    state.initialTimerDuration = state.remainingSeconds; // Обновляем начальную длительность
                    
                    // Сбрасываем прогресс текущего таймера
                    progressManager.updateCurrentTimer(1);
                    
                    // Подсветка активного таймера
                    timer.updateActiveTimer();
                    
                    // Обновить отображение и перезапустить интервал
                    timer.updateDisplay();
                    state.timerInterval = setInterval(timer.update, 1000);
                } else {
                    timer.updateDisplay();
                }
            },
            
            updateDisplay: function() {
                // Форматирование времени
                const minutes = Math.floor(state.remainingSeconds / 60);
                const seconds = state.remainingSeconds % 60;
                elements.display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Отображение информации о прогрессе с поддержкой локализации
                if (state.timers.length > 0) {
                    if (state.isTimerPaused) {
                        elements.progressInfo.innerHTML = `<div>${i18n.translate('TIMER_PAUSED')}</div><div>&nbsp;</div>`;
                    } else if (state.currentCycle > state.totalCycles) {
                        elements.progressInfo.innerHTML = `
                            <div>${i18n.translate('TOTAL_TIME', {
                                elapsed: timer.formatTime(state.elapsedTimeSeconds),
                                total: timer.formatTime(state.totalTimeSeconds)
                            })}</div>
                            <div>${i18n.translate('ALL_COMPLETED')}</div>
                        `;
                    } else {
                        elements.progressInfo.innerHTML = `
                            <div>${i18n.translate('TOTAL_TIME', {
                                elapsed: timer.formatTime(state.elapsedTimeSeconds),
                                total: timer.formatTime(state.remainingTotalSeconds)
                            })}</div>
                            <div>${i18n.translate('TIMER_STATUS', {
                                current: state.currentTimerIndex + 1,
                                total: state.timers.length,
                                currentCycle: state.currentCycle,
                                totalCycles: state.totalCycles
                            })}</div>
                        `;
                    }
                }
            },
            
            formatTime: function(totalSeconds) {
                const timeObj = utils.secondsToTimeObject(totalSeconds);
                
                if (timeObj.hours > 0) {
                    return utils.formatTimeObject(timeObj);
                } else {
                    return `${timeObj.minutes.toString().padStart(2, '0')}:${timeObj.seconds.toString().padStart(2, '0')}`;
                }
            },
            
            updateActiveTimer: function() {
                const timerContainers = document.querySelectorAll('.timer-container');
                timerContainers.forEach((container, index) => {
                    if (index === state.currentTimerIndex) {
                        container.style.backgroundColor = 'var(--active-timer)';
                    } else {
                        container.style.backgroundColor = 'var(--container-bg)';
                    }
                });
            },
            
            calculateTotalSeconds: function() {
                // Суммирование времени всех таймеров
                let totalSeconds = 0;
                for (const timer of state.timers) {
                    totalSeconds += (parseInt(timer.duration) || 0);
                }
                
                // Умножение на количество циклов
                const cycles = parseInt(elements.cyclesInput.value) || 1;
                return totalSeconds * cycles;
            },
            
            updateTotalTime: function() {
                if (state.timers.length === 0) {
                    elements.totalTimeDisplay.textContent = '00:00';
                    return;
                }
                
                const totalSeconds = timer.calculateTotalSeconds();
                elements.totalTimeDisplay.textContent = timer.formatTime(totalSeconds);
            }
        };
    }
    
    
    
    function adjustTimeValue(targetInput, otherInput, delta, updateCallback) {
        // Текущее значение поля, которое меняем
        let val = parseInt(targetInput.value) || 0;
        // Значение «соседнего» поля (минуты/секунды), чтобы проверять случай «оба 0»
        const otherVal = parseInt(otherInput.value) || 0;
        
        // Прибавляем смещение
        val += delta;
        
        // Ограничиваем в диапазоне 0..59
        if (val < 0) val = 0;
        if (val > 59) val = 59;
        
        // Если и minutes, и seconds оказались 0, ставим хотя бы 1 секунду (или минуту)
        if (val === 0 && otherVal === 0) {
            val = 1;
        }
        
        // Обновляем поле ввода
        targetInput.value = val.toString().padStart(2, '0');
        
        // Вызываем колбэк для пересчёта секунд, общего времени и т.п.
        if (typeof updateCallback === 'function') {
            updateCallback();
        }
    }


    
    
    // Инициализация функций управления таймерами
    function initTimerManager() {
        timerManager = {
        add: function(duration = 30) {
        const timerIndex = state.timers.length;
        
        const timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        timerContainer.dataset.index = timerIndex;
        
        const timerRow = document.createElement('div');
        timerRow.className = 'timer-row';
        
        // Вёрстка для минут и секунд
        const durationGroup = document.createElement('div');
        durationGroup.className = 'time-inputs-container';
        
        // === Создаём контейнер для минут ===
        const minutesGroup = document.createElement('div');
        minutesGroup.className = 'input-group with-buttons time-input-group';
        
        const minutesLabel = document.createElement('label');
        minutesLabel.textContent = i18n.translate('MINUTES_LABEL');
        minutesLabel.dataset.i18n = 'MINUTES_LABEL';
        
        const minutesInputWrapper = document.createElement('div');
        minutesInputWrapper.className = 'input-with-buttons';
        
        // Кнопка «–» для минут
        const minutesMinusBtn = document.createElement('button');
        minutesMinusBtn.className = 'btn-adjust btn-minus';
        minutesMinusBtn.textContent = '-';
        minutesMinusBtn.title = i18n.translate('DECREASE_MINUTES');
        minutesMinusBtn.dataset.i18nTitle = 'DECREASE_MINUTES';
        
        // Поле ввода минут
        const minutesInput = document.createElement('input');
        minutesInput.type = 'number';
        minutesInput.min = '0';
        minutesInput.max = '59';
        minutesInput.placeholder = '00';
        
        // Кнопка «+» для минут
        const minutesPlusBtn = document.createElement('button');
        minutesPlusBtn.className = 'btn-adjust btn-plus';
        minutesPlusBtn.textContent = '+';
        minutesPlusBtn.title = i18n.translate('INCREASE_MINUTES');
        minutesPlusBtn.dataset.i18nTitle = 'INCREASE_MINUTES';
        
        // Устанавливаем начальное значение (из duration)
        const initialMinutes = Math.floor(duration / 60);
        minutesInput.value = initialMinutes.toString().padStart(2, '0');
        
        // === Создаём контейнер для секунд ===
        const secondsGroup = document.createElement('div');
        secondsGroup.className = 'input-group with-buttons time-input-group';
        
        const secondsLabel = document.createElement('label');
        secondsLabel.textContent = i18n.translate('SECONDS_LABEL');
        secondsLabel.dataset.i18n = 'SECONDS_LABEL';
        
        const secondsInputWrapper = document.createElement('div');
        secondsInputWrapper.className = 'input-with-buttons';
        
        // Кнопка «–» для секунд
        const secondsMinusBtn = document.createElement('button');
        secondsMinusBtn.className = 'btn-adjust btn-minus';
        secondsMinusBtn.textContent = '-';
        secondsMinusBtn.title = i18n.translate('DECREASE_SECONDS');
        secondsMinusBtn.dataset.i18nTitle = 'DECREASE_SECONDS';
        
        // Поле ввода секунд
        const secondsInput = document.createElement('input');
        secondsInput.type = 'number';
        secondsInput.min = '0';
        secondsInput.max = '59';
        secondsInput.placeholder = '00';
        
        // Кнопка «+» для секунд
        const secondsPlusBtn = document.createElement('button');
        secondsPlusBtn.className = 'btn-adjust btn-plus';
        secondsPlusBtn.textContent = '+';
        secondsPlusBtn.title = i18n.translate('INCREASE_SECONDS');
        secondsPlusBtn.dataset.i18nTitle = 'INCREASE_SECONDS';
        
        // Устанавливаем начальное значение (из duration)
        const initialSeconds = duration % 60;
        secondsInput.value = initialSeconds.toString().padStart(2, '0');
        
        // Функция, обновляющая длительность таймера в state
        const updateTimerDuration = () => {
            const m = parseInt(minutesInput.value) || 0;
            const s = parseInt(secondsInput.value) || 0;
            const totalSec = m * 60 + s;
            state.timers[timerIndex].duration = totalSec;
            timer.updateTotalTime(); // пересчитываем «Общее время»
        };
        
        // Обработчики кликов «–/+» для минут и секунд
        minutesMinusBtn.addEventListener('click', () => {
            adjustTimeValue(minutesInput, secondsInput, -1, updateTimerDuration);
        });
        minutesPlusBtn.addEventListener('click', () => {
            adjustTimeValue(minutesInput, secondsInput, +1, updateTimerDuration);
        });
        secondsMinusBtn.addEventListener('click', () => {
            adjustTimeValue(secondsInput, minutesInput, -1, updateTimerDuration);
        });
        secondsPlusBtn.addEventListener('click', () => {
            adjustTimeValue(secondsInput, minutesInput, +1, updateTimerDuration);
        });
        
        // События input и blur (если хотите сохранить проверку диапазонов)
        minutesInput.addEventListener('input', updateTimerDuration);
        minutesInput.addEventListener('blur', function() {
            let val = parseInt(this.value) || 0;
            if (val > 59) val = 59;
            if (val < 0)  val = 0;
            this.value = val.toString().padStart(2, '0');
            updateTimerDuration();
        });
        
        secondsInput.addEventListener('input', updateTimerDuration);
        secondsInput.addEventListener('blur', function() {
            let val = parseInt(this.value) || 0;
            if (val > 59) val = 59;
            if (val < 0)  val = 0;
            this.value = val.toString().padStart(2, '0');
            updateTimerDuration();
        });
        
        // Добавляем кнопки и поля ввода в обёртки
        minutesInputWrapper.appendChild(minutesMinusBtn);
        minutesInputWrapper.appendChild(minutesInput);
        minutesInputWrapper.appendChild(minutesPlusBtn);
        
        minutesGroup.appendChild(minutesLabel);
        minutesGroup.appendChild(minutesInputWrapper);
        
        secondsInputWrapper.appendChild(secondsMinusBtn);
        secondsInputWrapper.appendChild(secondsInput);
        secondsInputWrapper.appendChild(secondsPlusBtn);
        
        secondsGroup.appendChild(secondsLabel);
        secondsGroup.appendChild(secondsInputWrapper);
        
        // Добавляем всё в общий durationGroup
        durationGroup.appendChild(minutesGroup);
        durationGroup.appendChild(secondsGroup);
        
        // Кнопки звука и удаления
        const timerActions = document.createElement('div');
        timerActions.className = 'timer-actions';
        
        const soundBtn = document.createElement('button');
        soundBtn.className = 'btn-sound';
        soundBtn.textContent = '🔕'; 
        soundBtn.title = 'Звуковой сигнал выключен';
        
        soundBtn.addEventListener('click', function() {
            state.timers[timerIndex].soundEnabled = !state.timers[timerIndex].soundEnabled;
            soundManager.updateButtonState(soundBtn, state.timers[timerIndex].soundEnabled);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = i18n.translate('DELETE_BUTTON');
        deleteBtn.dataset.i18n = 'DELETE_BUTTON';
        deleteBtn.addEventListener('click', function() {
            timerManager.remove(timerIndex);
        });
        
        timerActions.appendChild(soundBtn);
        timerActions.appendChild(deleteBtn);
        
        // Собираем верстку
        timerRow.appendChild(durationGroup);
        timerRow.appendChild(timerActions);
        timerContainer.appendChild(timerRow);
        
        elements.timerList.appendChild(timerContainer);
        
        // Добавляем новый таймер в state
        state.timers.push({
            duration: duration,
            soundEnabled: false
        });
        
        // Обновляем индексы и общее время
        timerManager.updateIndexes();
        timer.updateTotalTime();
    },
            
            remove: function(index) {
                // Удаление из DOM
                const timerContainers = document.querySelectorAll('.timer-container');
                if (timerContainers[index]) {
                    timerContainers[index].remove();
                }
                
                // Удаление из массива
                state.timers.splice(index, 1);
                
                // Обновление нумерации
                timerManager.updateIndexes();
                
                // Обновление общего времени
                timer.updateTotalTime();
                
                // Сброс таймера, если он был запущен
                timer.reset();
            },
            
            updateIndexes: function() {
                const timerContainers = document.querySelectorAll('.timer-container');
                timerContainers.forEach((container, index) => {
                    container.dataset.index = index;
                });
            }
        };
    }
    
    // Инициализация функций секундомера
    function initStopwatch() {
        stopwatch = {
            start: function() {
                // Если секундомер уже запущен, ничего не делаем
                if (state.isStopwatchRunning) return;
                
                // Если секундомер был на паузе
                if (state.stopwatchElapsedTime > 0) {
                    state.stopwatchStartTime = Date.now() - state.stopwatchElapsedTime;
                } else {
                    state.stopwatchStartTime = Date.now();
                    state.lastLapTime = 0;
                }
                
                state.isStopwatchRunning = true;
                if (elements.startStopwatchBtn) elements.startStopwatchBtn.disabled = true;
                if (elements.pauseStopwatchBtn) elements.pauseStopwatchBtn.disabled = false;
                if (elements.lapStopwatchBtn) elements.lapStopwatchBtn.disabled = false;
                
                // Запуск интервала обновления
                state.stopwatchInterval = setInterval(stopwatch.update, 10); // Обновляем каждые 10 мс для плавности
            },
            
            pause: function() {
                clearInterval(state.stopwatchInterval);
                state.isStopwatchRunning = false;
                if (elements.startStopwatchBtn) elements.startStopwatchBtn.disabled = false;
                if (elements.pauseStopwatchBtn) elements.pauseStopwatchBtn.disabled = true;
                if (elements.lapStopwatchBtn) elements.lapStopwatchBtn.disabled = true;
            },
            
            reset: function() {
                clearInterval(state.stopwatchInterval);
                state.stopwatchElapsedTime = 0;
                state.isStopwatchRunning = false;
                state.laps = [];
                state.lastLapTime = 0;
                
                if (elements.startStopwatchBtn) elements.startStopwatchBtn.disabled = false;
                if (elements.pauseStopwatchBtn) elements.pauseStopwatchBtn.disabled = true;
                if (elements.lapStopwatchBtn) elements.lapStopwatchBtn.disabled = true;
                if (elements.stopwatchDisplay) elements.stopwatchDisplay.innerHTML = '00:00:00<span class="centiseconds">.00</span>';
                if (elements.lapsList) elements.lapsList.innerHTML = '';
                
                // Сбрасываем прогресс-бар секундомера на полную окружность (пустой)
                if (progressElements.stopwatchCircle) {
                    progressElements.stopwatchCircle.style.strokeDashoffset = progressElements.stopwatchCircumference;
                }
                
                // Сбрасываем флаг инициализации вкладки в tabManager, если он существует
                if (tabManager && typeof tabManager.resetInitFlags === 'function') {
                    tabManager.resetInitFlags();
                }
            },
            
            update: function() {
                // Вычисляем прошедшее время
                const currentTime = Date.now();
                state.stopwatchElapsedTime = currentTime - state.stopwatchStartTime;
                
                // Обновляем отображение времени
                stopwatch.updateDisplay();
            },
            
            updateDisplay: function() {
                if (!elements.stopwatchDisplay) return;
                
                // Преобразуем миллисекунды в часы, минуты, секунды, сотые
                const totalMs = state.stopwatchElapsedTime;
                const ms = Math.floor((totalMs % 1000) / 10);
                const seconds = Math.floor((totalMs / 1000) % 60);
                const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
                const hours = Math.floor(totalMs / (1000 * 60 * 60));
                
                // Форматируем основную часть времени
                const mainTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Создаем HTML с долями секунды
                const html = `${mainTimeString}<span class="centiseconds">.${ms.toString().padStart(2, '0')}</span>`;
                
                // Обновляем отображение
                elements.stopwatchDisplay.innerHTML = html;
                
                // Обновляем прогресс-бар (для секунд)
                progressManager.updateStopwatchProgress(seconds);
            },
            
            lap: function() {
                if (!state.isStopwatchRunning || !elements.lapsList) return;
                
                const currentLapTime = state.stopwatchElapsedTime;
                const lapTime = currentLapTime;
                const splitTime = currentLapTime - state.lastLapTime;
                
                // Сохраняем информацию о круге
                state.laps.push({
                    number: state.laps.length + 1,
                    time: lapTime,
                    split: splitTime
                });
                
                // Обновляем время последнего круга
                state.lastLapTime = currentLapTime;
                
                // Обновляем отображение кругов
                stopwatch.updateLaps();
            },
            
            updateLaps: function() {
                if (!elements.lapsList) return;
                
                elements.lapsList.innerHTML = '';
                
                // Добавляем круги в обратном порядке (новые сверху)
                for (let i = state.laps.length - 1; i >= 0; i--) {
                    const lap = state.laps[i];
                    
                    const lapItem = document.createElement('div');
                    lapItem.className = 'lap-item';
                    
                    const lapNumber = document.createElement('span');
                    lapNumber.className = 'lap-number';
                    lapNumber.textContent = i18n.translate('LAP_TEXT', { number: lap.number });
                    lapNumber.dataset.i18n = 'LAP_TEXT';
                    lapNumber.dataset.lapNumber = lap.number;
                    
                    const lapTimeContainer = document.createElement('div');
                    lapTimeContainer.className = 'lap-time-container';
                    
                    const lapTime = document.createElement('div');
                    lapTime.className = 'lap-time';
                    lapTime.textContent = stopwatch.formatMs(lap.time);
                    
                    const lapSplit = document.createElement('div');
                    lapSplit.className = 'lap-split';
                    lapSplit.textContent = `+${stopwatch.formatMs(lap.split)}`;
                    
                    lapTimeContainer.appendChild(lapTime);
                    lapTimeContainer.appendChild(lapSplit);
                    
                    lapItem.appendChild(lapNumber);
                    lapItem.appendChild(lapTimeContainer);
                    
                    elements.lapsList.appendChild(lapItem);
                }
            },
            
            formatMs: function(ms) {
                const totalSeconds = Math.floor(ms / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                const centiseconds = Math.floor((ms % 1000) / 10);
                
                if (hours > 0) {
                    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
                } else {
                    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
                }
            }
        };
    }
    
    // Инициализация управления вкладками
    function initTabManager() {
        tabManager = {
            // Флаг для отслеживания первого открытия вкладки секундомера
            isStopwatchTabInitialized: false,
            
            switchTab: function(tabName) {
                if (!elements.timerTab || !elements.stopwatchTab || 
                    !elements.timerTabBtn || !elements.stopwatchTabBtn) return;
                
                // Скрываем все вкладки
                elements.timerTab.classList.remove('active');
                elements.stopwatchTab.classList.remove('active');
                
                // Деактивируем все кнопки вкладок
                elements.timerTabBtn.classList.remove('active');
                elements.stopwatchTabBtn.classList.remove('active');
                
                // Активируем нужную вкладку
                if (tabName === 'timer') {
                    elements.timerTab.classList.add('active');
                    elements.timerTabBtn.classList.add('active');
                } else if (tabName === 'stopwatch') {
                    elements.stopwatchTab.classList.add('active');
                    elements.stopwatchTabBtn.classList.add('active');
                    
                    // Сбрасываем прогресс-бар только при первом открытии и если секундомер не запущен и не на паузе
                    if (!this.isStopwatchTabInitialized && 
                        !state.isStopwatchRunning && 
                        state.stopwatchElapsedTime === 0) {
                        
                        if (progressElements.stopwatchCircle) {
                            progressElements.stopwatchCircle.style.strokeDashoffset = progressElements.stopwatchCircumference;
                        }
                    }
                    
                    // Отмечаем, что вкладка секундомера была инициализирована
                    this.isStopwatchTabInitialized = true;
                }
            },
            
            // Метод для сброса флага инициализации при полном сбросе приложения
            resetInitFlags: function() {
                this.isStopwatchTabInitialized = false;
            }
        };
    }
    

    function addSoundModeToMenu() {
        // Находим секцию меню, куда добавим наш переключатель
        const menuSections = document.querySelectorAll('.menu-section');
        if (menuSections.length === 0) return;
        
        // Создаем новую секцию для настроек звука
        const soundSection = document.createElement('div');
        soundSection.className = 'menu-section sound-section';
        
        // Заголовок секции
        const soundHeader = document.createElement('h3');
        soundHeader.textContent = i18n.translate('SOUND_SETTINGS');
        soundHeader.dataset.i18n = 'SOUND_SETTINGS';
        
        // Контейнер для переключателя
        const soundControls = document.createElement('div');
        soundControls.className = 'sound-controls';
        
        // Кнопка переключения режима звука
        const soundModeBtn = document.createElement('button');
        soundModeBtn.id = 'soundModeBtn';
        soundModeBtn.className = 'sound-mode-btn';
        soundModeBtn.textContent = state.useMultipleSounds ? '🔔 🔔 🔔' : '🔔';
        soundModeBtn.title = i18n.translate(state.useMultipleSounds ? 'MULTIPLE_SOUND_ENABLED' : 'SINGLE_SOUND_ENABLED');
        
        // Добавляем подпись
        const soundLabel = document.createElement('div');
        soundLabel.className = 'sound-label';
        soundLabel.textContent = i18n.translate('SOUND_MODE_LABEL');
        soundLabel.dataset.i18n = 'SOUND_MODE_LABEL';
        
        // Добавляем событие клика
        soundModeBtn.addEventListener('click', function() {
            soundManager.toggleSoundMode();
        });
        
        // Собираем всё вместе
        soundControls.appendChild(soundModeBtn);
        soundSection.appendChild(soundHeader);
        soundSection.appendChild(soundLabel);
        soundSection.appendChild(soundControls);
        
        // Добавляем секцию в меню (перед языковой секцией, если она есть)
        const languageSection = document.querySelector('.language-section');
        if (languageSection) {
            languageSection.parentNode.insertBefore(soundSection, languageSection);
        } else {
            // Если языковой секции нет, добавляем в конец
            menuSections[menuSections.length - 1].parentNode.appendChild(soundSection);
        }
    }


    // Привязка обработчиков событий
    function bindEvents() {
        // Обработчики событий для вкладок
        if (elements.timerTabBtn) {
            elements.timerTabBtn.addEventListener('click', function() {
                tabManager.switchTab('timer');
            });
        }
        
        if (elements.stopwatchTabBtn) {
            elements.stopwatchTabBtn.addEventListener('click', function() {
                tabManager.switchTab('stopwatch');
            });
        }
        
        // Обработчики событий для таймера
        if (elements.addTimerBtn) {
            elements.addTimerBtn.addEventListener('click', function() {
                timerManager.add();
            });
        }
        
        if (elements.startBtn) {
            elements.startBtn.addEventListener('click', function() {
                timer.start();
            });
        }
        
        if (elements.pauseBtn) {
            elements.pauseBtn.addEventListener('click', function() {
                timer.pause();
            });
        }
        
        if (elements.resetBtn) {
            elements.resetBtn.addEventListener('click', function() {
                timer.reset();
            });
        }
        
        if (elements.cyclesInput) {
            elements.cyclesInput.addEventListener('input', function() {
                timer.updateTotalTime();
            });
        }
        
        // Обработчики событий для секундомера
        if (elements.startStopwatchBtn) {
            elements.startStopwatchBtn.addEventListener('click', function() {
                stopwatch.start();
            });
        }
        
        if (elements.pauseStopwatchBtn) {
            elements.pauseStopwatchBtn.addEventListener('click', function() {
                stopwatch.pause();
            });
        }
        
        if (elements.resetStopwatchBtn) {
            elements.resetStopwatchBtn.addEventListener('click', function() {
                stopwatch.reset();
            });
        }
        
        if (elements.lapStopwatchBtn) {
            elements.lapStopwatchBtn.addEventListener('click', function() {
                stopwatch.lap();
            });
        }
        
        // Обработчики для кнопок + и - для количества циклов
        if (elements.cyclesMinusBtn) {
            elements.cyclesMinusBtn.addEventListener('click', function() {
                const currentValue = parseInt(elements.cyclesInput.value) || 1;
                const newValue = Math.max(1, currentValue - 1); // Минимум 1 цикл
                elements.cyclesInput.value = newValue;
                elements.cyclesInput.dispatchEvent(new Event('input'));
            });
        }
        
        if (elements.cyclesPlusBtn) {
            elements.cyclesPlusBtn.addEventListener('click', function() {
                const currentValue = parseInt(elements.cyclesInput.value) || 1;
                const newValue = currentValue + 1;
                elements.cyclesInput.value = newValue;
                elements.cyclesInput.dispatchEvent(new Event('input'));
            });
        }
        
        // Обработчики темы
        if (elements.lightThemeBtn) {
            elements.lightThemeBtn.addEventListener('click', function() {
                themeManager.setLightTheme();
            });
        }
        
        if (elements.darkThemeBtn) {
            elements.darkThemeBtn.addEventListener('click', function() {
                themeManager.setDarkTheme();
            });
        }
        
        if (elements.systemThemeBtn) {
            elements.systemThemeBtn.addEventListener('click', function() {
                themeManager.setSystemTheme();
            });
        }
        
        // Обработчики меню
        if (elements.menuBtn) {
            elements.menuBtn.addEventListener('click', function() {
                menuManager.toggle();
            });
        }
        
        if (elements.overlay) {
            elements.overlay.addEventListener('click', function() {
                menuManager.close();
            });
        }
        
        // Закрывать меню при клике вне его
        document.addEventListener('click', function(e) {
            if (elements.menuBtn && elements.menuDropdown && 
                !elements.menuBtn.contains(e.target) && 
                !elements.menuDropdown.contains(e.target) && 
                menuManager.isOpen) {
                menuManager.close();
            }
        });

        // Добавляем обработчики событий для локализации
        document.addEventListener('languageChanged', function() {
            i18n.translatePage();
            languageManager.updateDynamicTexts();
        });

        document.addEventListener('languageLoaded', function(event) {
            // Обновляем активную кнопку языка в соответствии с загруженным языком
            const currentLang = event.detail.language;
            const langButtons = document.querySelectorAll('.lang-btn');
            langButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === currentLang);
            });
            
            // Обновляем атрибут lang на html
            document.documentElement.lang = currentLang;
        });

    }
    
    // Главная функция инициализации
    function init() {
        // Инициализация всех компонентов
        initDOMElements();
        initState();
        initUtils();
        initProgressManager();
        initSoundManager();
        initMenuManager();
        initThemeManager();
        initTimer();
        initTimerManager();
        initStopwatch();
        initTabManager();
        initLanguageManager();
        
        // Привязка событий к элементам
        bindEvents();
        
        // Инициализация темы
        themeManager.init();

        // Загрузка настроек звука
        soundManager.loadAudioSettings();
        
        // Добавление переключателя режима звука в меню
        addSoundModeToMenu();

        // Инициализация языка и перевод страницы
        languageManager.init();
        i18n.translatePage();
        
        // Добавление первого таймера
        if (elements.timerList) {
            timerManager.add(30);
        }
        
        // Обновление общего времени
        setTimeout(function() {
            if (typeof timer.updateTotalTime === 'function') {
                timer.updateTotalTime();
            }
        }, 100);
        
        // Инициализация прогресс-бара секундомера в начальное положение (пустой)
        if (progressElements.stopwatchCircle) {
            progressElements.stopwatchCircle.style.strokeDashoffset = progressElements.stopwatchCircumference;
        }
    }
    
    // Запуск приложения
    init();
}

// Теперь вызываем initApp() после загрузки i18n
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await i18n.init();
        // После инициализации локализации продолжаем загрузку приложения
        initApp();
    } catch (error) {
        console.error('Ошибка инициализации локализации:', error);
        
        // Принудительная загрузка языка по умолчанию, если инициализация не удалась
        try {
            await i18n.loadLanguage('ru'); // Загружаем русский как запасной вариант
        } catch (secondError) {
            console.error('Не удалось загрузить язык по умолчанию:', secondError);
        }
        
        // Запускаем приложение после попытки загрузки языка по умолчанию
        initApp();
    }
});