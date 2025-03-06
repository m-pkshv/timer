/**
 * Упрощенный модуль локализации для приложения ЦиклоТаймер
 * с поддержкой плоской структуры файлов локализации
 */
const i18n = (function() {
  // Приватные переменные
  let currentLanguage = 'ru'; // Язык по умолчанию
  let translations = {}; // Хранилище всех переводов
  let defaultLanguage = 'ru'; // Запасной язык, если перевод недоступен

  // Список доступных языков
  const availableLanguages = {
    'ru': 'Русский',
    'en': 'English',
    'de': 'Deutsch',
    'fr': 'Français',
    'es': 'Español'
  };

  /**
   * Загружает переводы для указанного языка
   * @param {string} lang - Код языка (ru, en, de и т.д.)
   * @returns {Promise} - Промис, который разрешается после загрузки языка
   */
  function loadLanguage(lang) {
    return new Promise((resolve, reject) => {
      if (translations[lang]) {
        currentLanguage = lang;
        saveLanguagePreference(lang);
        resolve(translations[lang]);
        return;
      }

      fetch(`lang/${lang}.json`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Ошибка загрузки языка: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          translations[lang] = data;
          currentLanguage = lang;
          saveLanguagePreference(lang);
          resolve(data);
        })
        .catch(error => {
          console.error(`Не удалось загрузить язык ${lang}:`, error);
          reject(error);
        });
    });
  }

  /**
   * Сохраняет предпочтительный язык в localStorage
   * @param {string} lang - Код языка
   */
  function saveLanguagePreference(lang) {
    try {
      localStorage.setItem('preferred-language', lang);
    } catch (e) {
      console.warn('Не удалось сохранить языковые настройки:', e);
    }
  }

  /**
   * Получает предпочтительный язык из localStorage или определяет по браузеру
   * @returns {string} - Код языка
   */
  function getPreferredLanguage() {
    // Сначала проверяем localStorage
    try {
      const savedLang = localStorage.getItem('preferred-language');
      if (savedLang && availableLanguages[savedLang]) {
        return savedLang;
      }
    } catch (e) {
      console.warn('Не удалось получить языковые настройки:', e);
    }

    // Затем пробуем определить язык браузера
    const browserLang = navigator.language.split('-')[0]; // 'ru-RU' -> 'ru'
    if (availableLanguages[browserLang]) {
      return browserLang;
    }

    // Если ничего не подошло, возвращаем язык по умолчанию
    return defaultLanguage;
  }

  /**
   * Получает перевод по ключу
   * @param {string} key - Ключ перевода (например, "START_BUTTON")
   * @param {Object} params - Параметры для подстановки в перевод
   * @returns {string} - Переведенная строка
   */
  function translate(key, params = {}) {
    if (!key) return '';

    // Получаем текущий перевод
    const translationObj = translations[currentLanguage];
    if (!translationObj) {
      console.warn(`Перевод для языка ${currentLanguage} не загружен`);
      return key; // Возвращаем ключ как запасной вариант
    }

    // Получаем строку по ключу
    const translatedString = translationObj[key];
    
    // Если перевод не найден, пытаемся использовать значение из языка по умолчанию
    if (translatedString === undefined) {
      console.warn(`Ключ перевода "${key}" не найден для языка ${currentLanguage}`);
      
      // Пытаемся найти в языке по умолчанию
      if (translations[defaultLanguage] && translations[defaultLanguage][key]) {
        return replaceParams(translations[defaultLanguage][key], params);
      }
      
      return key; // Возвращаем ключ как запасной вариант
    }

    // Подставляем параметры в строку перевода
    return replaceParams(translatedString, params);
  }
  
  /**
   * Заменяет параметры в строке шаблона
   * @param {string} str - Строка шаблона с {параметрами}
   * @param {Object} params - Объект с параметрами замены
   * @returns {string} - Строка с замененными параметрами
   */
  function replaceParams(str, params) {
    if (typeof str !== 'string') return str;
    
    let result = str;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
    }
    
    return result;
  }

  /**
   * Инициализирует систему локализации
   * @returns {Promise} - Промис, который разрешается после инициализации
   */
  function init() {
    const language = getPreferredLanguage();
    return loadLanguage(language)
      .then(() => {
        // Вызываем событие загрузки языка для приложения
        document.dispatchEvent(new CustomEvent('languageLoaded', { 
          detail: { language: currentLanguage } 
        }));
        return currentLanguage;
      })
      .catch(error => {
        console.error('Ошибка инициализации локализации:', error);
        // Пытаемся загрузить язык по умолчанию как запасной вариант
        if (language !== defaultLanguage) {
          return loadLanguage(defaultLanguage);
        }
        throw error;
      });
  }

  /**
   * Переключает язык интерфейса
   * @param {string} lang - Код языка
   * @returns {Promise} - Промис, который разрешается после переключения языка
   */
  function changeLanguage(lang) {
    if (!availableLanguages[lang]) {
      return Promise.reject(new Error(`Язык ${lang} недоступен`));
    }

    return loadLanguage(lang)
      .then(() => {
        // Вызываем событие изменения языка для обновления интерфейса
        document.dispatchEvent(new CustomEvent('languageChanged', { 
          detail: { language: currentLanguage } 
        }));
        return currentLanguage;
      });
  }

  /**
   * Применяет переводы ко всем элементам с атрибутом data-i18n
   */
  function translatePage() {
    // Получаем все элементы с атрибутом data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      
      // Переводим основное содержимое элемента
      element.textContent = translate(key);
    });
    
    // Обрабатываем title атрибуты
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = translate(key);
    });
    
    // Обрабатываем placeholder атрибуты
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = translate(key);
    });
  }

  /**
   * Возвращает список доступных языков
   * @returns {Object} - Объект с языками { code: name }
   */
  function getAvailableLanguages() {
    return { ...availableLanguages };
  }

  /**
   * Возвращает текущий язык
   * @returns {string} - Код текущего языка
   */
  function getCurrentLanguage() {
    return currentLanguage;
  }

  // Публичное API модуля
  return {
    init,
    translate,
    changeLanguage,
    translatePage,
    getAvailableLanguages,
    getCurrentLanguage
  };
})();

// Экспортируем модуль
window.i18n = i18n;
export default i18n;
