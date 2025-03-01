document.addEventListener('DOMContentLoaded', function() {
    // DOM-элементы
    const elements = {
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
        lightThemeBtn: document.getElementById('lightThemeBtn'),
        darkThemeBtn: document.getElementById('darkThemeBtn'),
        systemThemeBtn: document.getElementById('systemThemeBtn'),
        menuBtn: document.getElementById('menuBtn'),
        menuDropdown: document.getElementById('menuDropdown'),
        overlay: document.getElementById('overlay'),
        currentTimerProgress: document.getElementById('currentTimerProgress'),
        totalTimeProgress: document.getElementById('totalTimeProgress')
    };
    
    // Элементы прогресс-бара
    const progressElements = {
        currentCircle: elements.currentTimerProgress.querySelector('.progress-circle-current'),
        totalCircle: elements.totalTimeProgress.querySelector('.progress-circle-total'),
        currentCircumference: parseFloat(elements.currentTimerProgress.querySelector('.progress-circle-current').getAttribute('stroke-dasharray')),
        totalCircumference: parseFloat(elements.totalTimeProgress.querySelector('.progress-circle-total').getAttribute('stroke-dasharray'))
    };
    
    // Состояние приложения
    const state = {
        timers: [],
        currentTimerIndex: 0,
        currentRepetition: 0,
        currentCycle: 0,
        totalCycles: 1,
        remainingSeconds: 0,
        totalTimeSeconds: 0,
        elapsedTimeSeconds: 0,
        remainingTotalSeconds: 0,
        initialTimerDuration: 0, // Начальная длительность текущего таймера
        timerInterval: null,
        isPaused: false,
        isDarkTheme: false,
        audioContext: null,
        themeMode: 'system' // По умолчанию используем системную тему
    };
    
    // Вспомогательные функции
    const utils = {
        // Функция для интерполяции между двумя цветами
        interpolateColor(color1, color2, factor) {
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
            
            // Конвертируем обратно в hex
            return `rgb(${r}, ${g}, ${b})`;
        },
        
        // Конвертирует общее количество секунд в объект с часами, минутами и секундами
        secondsToTimeObject(totalSeconds) {
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
        formatTimeObject(timeObj) {
            return `${timeObj.hours.toString().padStart(2, '0')}:${timeObj.minutes.toString().padStart(2, '0')}:${timeObj.seconds.toString().padStart(2, '0')}`;
        },

        // Конвертирует строку времени формата чч:мм:сс в секунды
        timeStringToSeconds(timeString) {
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
        handleTimeInputChange(input, onChangeCallback) {
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
    
    // Функции управления звуком
    const soundManager = {
        updateButtonState(button, isEnabled) {
            if (isEnabled) {
                button.textContent = '🔔'; // Bell emoji (U+1F514)
                button.title = 'Звуковой сигнал включен';
            } else {
                button.textContent = '🔕'; // Bell with slash emoji (U+1F515)
                button.title = 'Звуковой сигнал выключен';
            }
        },
        
        playBeep() {
            // Проверяем, включен ли звук для текущего таймера
            if (!state.timers[state.currentTimerIndex].soundEnabled) {
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
                
                // Настройка звука
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, state.audioContext.currentTime);
                
                // Громкость звука
                gainNode.gain.setValueAtTime(0.5, state.audioContext.currentTime);
                
                // Подключение узлов
                oscillator.connect(gainNode);
                gainNode.connect(state.audioContext.destination);
                
                // Запуск и остановка звука через 0.3 секунды
                oscillator.start();
                oscillator.stop(state.audioContext.currentTime + 0.3);
            } catch (e) {
                console.error('Ошибка воспроизведения звука:', e);
            }
        }
    };
    
    // Функции для обновления прогресс-баров
    const progressManager = {
        updateCurrentTimer(percentage) {
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
        
        updateTotalTime(percentage) {
            const offset = progressElements.totalCircumference * (1 - percentage);
            progressElements.totalCircle.style.strokeDashoffset = offset;
        },
        
        reset() {
            progressElements.currentCircle.style.strokeDashoffset = 0;
            progressElements.totalCircle.style.strokeDashoffset = 0;
            // Сбрасываем цвет внешнего прогресс-бара на зеленый
            progressElements.currentCircle.style.stroke = getComputedStyle(document.documentElement).getPropertyValue('--progress-green');
        }
    };
    
    // Функции таймера
    const timer = {
        start() {
            if (state.timers.length === 0) {
                alert('Добавьте хотя бы один таймер!');
                return;
            }
            
            if (state.isPaused) {
                state.isPaused = false;
            } else {
                state.currentTimerIndex = 0;
                state.currentRepetition = 1;
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
        
        pause() {
            clearInterval(state.timerInterval);
            state.isPaused = true;
            elements.startBtn.disabled = false;
            elements.pauseBtn.disabled = true;
            elements.progressInfo.innerHTML = '<div>Таймер на паузе</div>';
        },
        
        reset() {
            clearInterval(state.timerInterval);
            state.currentTimerIndex = 0;
            state.currentRepetition = 0;
            state.currentCycle = 0;
            state.remainingSeconds = 0;
            state.elapsedTimeSeconds = 0;
            state.remainingTotalSeconds = 0;
            state.isPaused = false;
            elements.startBtn.disabled = false;
            elements.pauseBtn.disabled = true;
            elements.display.textContent = '00:00';
            elements.progressInfo.innerHTML = '<div>Таймер не запущен</div>';
            
            // Сброс прогресс-баров
            progressManager.reset();
            
            // Сброс подсветки таймеров
            const timerContainers = document.querySelectorAll('.timer-container');
            timerContainers.forEach(container => {
                container.style.backgroundColor = 'var(--container-bg)';
            });
        },
        
        update() {
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
            
            if (state.remainingSeconds <= 0) {
                // Воспроизведение звукового сигнала
                soundManager.playBeep();
                
                // Показать 00:00 на дисплее
                elements.display.textContent = '00:00';
                
                // Приостановить таймер перед переходом к следующему
                clearInterval(state.timerInterval);
                
                setTimeout(function() {
                    // Проверка, нужно ли перейти к следующему повторению или таймеру
                    if (state.currentRepetition < state.timers[state.currentTimerIndex].repetitions) {
                        // Следующее повторение текущего таймера
                        state.currentRepetition++;
                        state.remainingSeconds = state.timers[state.currentTimerIndex].duration;
                        state.initialTimerDuration = state.remainingSeconds; // Обновляем начальную длительность
                        // Сбрасываем прогресс текущего таймера
                        progressManager.updateCurrentTimer(1);
                    } else {
                        // Переход к следующему таймеру
                        state.currentTimerIndex++;
                        state.currentRepetition = 1;
                        
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
                                return;
                            }
                        }
                        
                        state.remainingSeconds = state.timers[state.currentTimerIndex].duration;
                        state.initialTimerDuration = state.remainingSeconds; // Обновляем начальную длительность
                        
                        // Сбрасываем прогресс текущего таймера
                        progressManager.updateCurrentTimer(1);
                        
                        // Подсветка активного таймера
                        timer.updateActiveTimer();
                    }
                    
                    // Обновить отображение и перезапустить интервал
                    timer.updateDisplay();
                    state.timerInterval = setInterval(timer.update, 1000);
                }, 1000);
            } else {
                timer.updateDisplay();
            }
        },
        
        updateDisplay() {
            // Форматирование времени
            const minutes = Math.floor(state.remainingSeconds / 60);
            const seconds = state.remainingSeconds % 60;
            elements.display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Отображение информации о прогрессе
            if (state.timers.length > 0) {
                elements.progressInfo.innerHTML = `
                    <div>Общее время: ${timer.formatTime(state.elapsedTimeSeconds)} / ${timer.formatTime(state.remainingTotalSeconds)}</div>
                    <div>Таймер ${state.currentTimerIndex + 1} из ${state.timers.length}, повторение ${state.currentRepetition} из ${state.timers[state.currentTimerIndex].repetitions}, цикл ${state.currentCycle} из ${state.totalCycles}</div>
                `;
            }
        },
        
        formatTime(totalSeconds) {
            const timeObj = utils.secondsToTimeObject(totalSeconds);
            
            if (timeObj.hours > 0) {
                return utils.formatTimeObject(timeObj);
            } else {
                return `${timeObj.minutes.toString().padStart(2, '0')}:${timeObj.seconds.toString().padStart(2, '0')}`;
            }
        },
        
        updateActiveTimer() {
            const timerContainers = document.querySelectorAll('.timer-container');
            timerContainers.forEach((container, index) => {
                if (index === state.currentTimerIndex) {
                    container.style.backgroundColor = 'var(--active-timer)';
                } else {
                    container.style.backgroundColor = 'var(--container-bg)';
                }
            });
        },
        
        calculateTotalSeconds() {
            // Суммирование времени всех таймеров с учетом повторений
            let totalSeconds = 0;
            for (const timer of state.timers) {
                totalSeconds += (parseInt(timer.duration) || 0) * (parseInt(timer.repetitions) || 1);
            }
            
            // Умножение на количество циклов
            const cycles = parseInt(elements.cyclesInput.value) || 1;
            return totalSeconds * cycles;
        },
        
        updateTotalTime() {
            if (state.timers.length === 0) {
                elements.totalTimeDisplay.textContent = '00:00';
                return;
            }
            
            const totalSeconds = timer.calculateTotalSeconds();
            elements.totalTimeDisplay.textContent = timer.formatTime(totalSeconds);
        }
    };
    
    // Функции для работы с таймерами
    const timerManager = {
        add(duration = 30, repetitions = 1) {
            const timerIndex = state.timers.length;
            
            const timerContainer = document.createElement('div');
            timerContainer.className = 'timer-container';
            timerContainer.dataset.index = timerIndex;
            
            const timerRow = document.createElement('div');
            timerRow.className = 'timer-row';
            
            // Время таймера
            const durationGroup = document.createElement('div');
            durationGroup.className = 'input-group with-buttons';
            
            const durationLabel = document.createElement('label');
            durationLabel.textContent = 'Время (чч:мм:сс):';
            
            // Создаем контейнер для поля ввода и кнопок + и -
            const durationInputWrapper = document.createElement('div');
            durationInputWrapper.className = 'input-with-buttons';
            
            // Кнопка минус
            const minusBtn = document.createElement('button');
            minusBtn.className = 'btn-adjust btn-minus';
            minusBtn.textContent = '-';
            minusBtn.title = 'Уменьшить на 10 секунд';
            minusBtn.addEventListener('click', function() {
                // Получаем текущее значение в секундах
                const currentSeconds = state.timers[timerIndex].duration;
                const newValue = Math.max(1, currentSeconds - 10); // Минимум 1 секунда
                
                // Обновляем значение в поле ввода
                state.timers[timerIndex].duration = newValue;
                
                // Конвертируем в формат чч:мм:сс и обновляем поле
                const timeObj = utils.secondsToTimeObject(newValue);
                durationInput.value = utils.formatTimeObject(timeObj);
                durationInput.dataset.lastValidValue = durationInput.value;
                
                // Обновляем общее время
                timer.updateTotalTime();
            });
            
            const durationInput = document.createElement('input');
            durationInput.type = 'text';
            durationInput.placeholder = '00:00:00';
            durationInput.pattern = '[0-9]{2}:[0-9]{2}:[0-9]{2}';
            
            // Устанавливаем начальное значение в формате чч:мм:сс
            const initialTimeObj = utils.secondsToTimeObject(duration);
            durationInput.value = utils.formatTimeObject(initialTimeObj);
            durationInput.dataset.lastValidValue = durationInput.value;
            
            durationInput.addEventListener('input', function() {
                utils.handleTimeInputChange(this, (seconds) => {
                    state.timers[timerIndex].duration = seconds;
                    timer.updateTotalTime();
                });
            });
            
            // Дополнительные слушатели для работы с полем времени
            durationInput.addEventListener('focus', function() {
                // При фокусе показываем текущее значение
                this.select(); // Выделяем весь текст для удобства редактирования
            });
            
            durationInput.addEventListener('blur', function() {
                // При потере фокуса форматируем время правильно
                utils.handleTimeInputChange(this, (seconds) => {
                    state.timers[timerIndex].duration = seconds;
                    timer.updateTotalTime();
                });
            });
            
            // Кнопка плюс
            const plusBtn = document.createElement('button');
            plusBtn.className = 'btn-adjust btn-plus';
            plusBtn.textContent = '+';
            plusBtn.title = 'Увеличить на 10 секунд';
            plusBtn.addEventListener('click', function() {
                // Получаем текущее значение в секундах
                const currentSeconds = state.timers[timerIndex].duration;
                const newValue = currentSeconds + 10;
                
                // Обновляем значение в поле ввода
                state.timers[timerIndex].duration = newValue;
                
                // Конвертируем в формат чч:мм:сс и обновляем поле
                const timeObj = utils.secondsToTimeObject(newValue);
                durationInput.value = utils.formatTimeObject(timeObj);
                durationInput.dataset.lastValidValue = durationInput.value;
                
                // Обновляем общее время
                timer.updateTotalTime();
            });
            
            // Добавляем все элементы в контейнер
            durationInputWrapper.appendChild(minusBtn);
            durationInputWrapper.appendChild(durationInput);
            durationInputWrapper.appendChild(plusBtn);
            
            durationGroup.appendChild(durationLabel);
            durationGroup.appendChild(durationInputWrapper);
            
            // Количество повторений
            const repetitionsGroup = document.createElement('div');
            repetitionsGroup.className = 'input-group with-buttons';
            
            const repetitionsLabel = document.createElement('label');
            repetitionsLabel.textContent = 'Повторения:';
            
            // Создаем контейнер для поля ввода и кнопок + и -
            const repetitionsInputWrapper = document.createElement('div');
            repetitionsInputWrapper.className = 'input-with-buttons';
            
            // Кнопка минус
            const repMinusBtn = document.createElement('button');
            repMinusBtn.className = 'btn-adjust btn-minus';
            repMinusBtn.textContent = '-';
            repMinusBtn.title = 'Уменьшить на 1 повторение';
            repMinusBtn.addEventListener('click', function() {
                // Получаем текущее значение и вычитаем 1
                const currentValue = parseInt(repetitionsInput.value) || 0;
                const newValue = Math.max(1, currentValue - 1); // Минимум 1 повторение
                repetitionsInput.value = newValue;
                // Генерируем событие input для обновления данных таймера
                repetitionsInput.dispatchEvent(new Event('input'));
            });
            
            const repetitionsInput = document.createElement('input');
            repetitionsInput.type = 'number';
            repetitionsInput.min = '1';
            repetitionsInput.value = repetitions;
            repetitionsInput.addEventListener('input', function() {
                const newRepetitions = parseInt(this.value) || 1;
                state.timers[timerIndex].repetitions = newRepetitions;
                timer.updateTotalTime();
            });
            
            // Кнопка плюс
            const repPlusBtn = document.createElement('button');
            repPlusBtn.className = 'btn-adjust btn-plus';
            repPlusBtn.textContent = '+';
            repPlusBtn.title = 'Увеличить на 1 повторение';
            repPlusBtn.addEventListener('click', function() {
                // Получаем текущее значение и прибавляем 1
                const currentValue = parseInt(repetitionsInput.value) || 0;
                const newValue = currentValue + 1;
                repetitionsInput.value = newValue;
                // Генерируем событие input для обновления данных таймера
                repetitionsInput.dispatchEvent(new Event('input'));
            });
            
            // Добавляем все элементы в контейнер
            repetitionsInputWrapper.appendChild(repMinusBtn);
            repetitionsInputWrapper.appendChild(repetitionsInput);
            repetitionsInputWrapper.appendChild(repPlusBtn);
            
            repetitionsGroup.appendChild(repetitionsLabel);
            repetitionsGroup.appendChild(repetitionsInputWrapper);
            
            // Кнопки в отдельном контейнере для мобильной версии
            const timerActions = document.createElement('div');
            timerActions.className = 'timer-actions';
            
            // Кнопка звукового сигнала
            const soundBtn = document.createElement('button');
            soundBtn.className = 'btn-sound';
            soundBtn.textContent = '🔕'; // Bell with slash emoji (U+1F515)
            soundBtn.title = 'Звуковой сигнал выключен';
            soundBtn.addEventListener('click', function() {
                state.timers[timerIndex].soundEnabled = !state.timers[timerIndex].soundEnabled;
                soundManager.updateButtonState(soundBtn, state.timers[timerIndex].soundEnabled);
            });
            
            // Кнопка удаления
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.textContent = 'Удалить';
            deleteBtn.addEventListener('click', function() {
                timerManager.remove(timerIndex);
            });
            
            // Добавление элементов в контейнеры
            timerRow.appendChild(durationGroup);
            timerRow.appendChild(repetitionsGroup);
            
            // Добавляем кнопки действий в основную строку для горизонтального отображения
            timerActions.appendChild(soundBtn);
            timerActions.appendChild(deleteBtn);
            timerRow.appendChild(timerActions);
            
            timerContainer.appendChild(timerRow);
            
            elements.timerList.appendChild(timerContainer);
            
            // Добавление таймера в массив
            state.timers.push({
                duration: duration,
                repetitions: repetitions,
                soundEnabled: false
            });
            
            // Обновление нумерации
            timerManager.updateIndexes();
            
            // Обновление общего времени
            timer.updateTotalTime();
        },
        
        remove(index) {
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
        
        updateIndexes() {
            const timerContainers = document.querySelectorAll('.timer-container');
            timerContainers.forEach((container, index) => {
                container.dataset.index = index;
            });
        }
    };
    
    // Функции меню
    const menuManager = {
        isOpen: false,
        
        toggle() {
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
        
        close() {
            if (this.isOpen) {
                this.isOpen = false;
                elements.menuBtn.classList.remove('active');
                elements.menuDropdown.classList.remove('visible');
                elements.overlay.classList.remove('visible');
            }
        }
    };
    
    // Функции работы с темой
    const themeManager = {
        init() {
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
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Изменяем тему только если выбран системный режим
                if (localStorage.getItem('theme-mode') === 'system') {
                    this.applySystemTheme();
                    console.log('Системная тема изменена на:', e.matches ? 'тёмную' : 'светлую');
                }
            });
            
            this.updateActiveButtons();
        },
        
        applySystemTheme() {
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
        
        setLightTheme() {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            localStorage.setItem('theme-mode', 'manual');
            state.isDarkTheme = false;
            document.documentElement.setAttribute('data-theme', 'light');
            this.updateActiveButtons();
        },
        
        setDarkTheme() {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            localStorage.setItem('theme-mode', 'manual');
            state.isDarkTheme = true;
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateActiveButtons();
        },
        
        setSystemTheme(updateStorage = true) {
            if (updateStorage) {
                localStorage.setItem('theme-mode', 'system');
            }
            this.applySystemTheme();
        },
        
        updateActiveButtons() {
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
    
    // Инициализация и привязка обработчиков событий
    function init() {
        // Инициализация темы
        themeManager.init();
        
        // Обработчики событий
        elements.addTimerBtn.addEventListener('click', () => timerManager.add());
        elements.startBtn.addEventListener('click', timer.start);
        elements.pauseBtn.addEventListener('click', timer.pause);
        elements.resetBtn.addEventListener('click', timer.reset);
        elements.cyclesInput.addEventListener('input', timer.updateTotalTime);
        
        // Обработчики для кнопок + и - для количества циклов
        elements.cyclesMinusBtn.addEventListener('click', function() {
            const currentValue = parseInt(elements.cyclesInput.value) || 1;
            const newValue = Math.max(1, currentValue - 1); // Минимум 1 цикл
            elements.cyclesInput.value = newValue;
            elements.cyclesInput.dispatchEvent(new Event('input'));
        });
        
        elements.cyclesPlusBtn.addEventListener('click', function() {
            const currentValue = parseInt(elements.cyclesInput.value) || 1;
            const newValue = currentValue + 1;
            elements.cyclesInput.value = newValue;
            elements.cyclesInput.dispatchEvent(new Event('input'));
        });
        
        elements.lightThemeBtn.addEventListener('click', () => themeManager.setLightTheme());
        elements.darkThemeBtn.addEventListener('click', () => themeManager.setDarkTheme());
        elements.systemThemeBtn.addEventListener('click', () => themeManager.setSystemTheme());
        elements.menuBtn.addEventListener('click', () => menuManager.toggle());
        elements.overlay.addEventListener('click', () => menuManager.close());
        
        // Закрывать меню при клике вне его
        document.addEventListener('click', (e) => {
            if (!elements.menuBtn.contains(e.target) && 
                !elements.menuDropdown.contains(e.target) && 
                menuManager.isOpen) {
                menuManager.close();
            }
        });
        
        // Добавление первого таймера
        timerManager.add(30, 1);
        
        // Обновление общего времени
        setTimeout(timer.updateTotalTime, 100);
    }
    
    // Запуск приложения
    init();
});