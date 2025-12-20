// ==================== CONFIGURATION ====================
const SUPABASE_URL = 'https://wuaciyhbdwzesnzinbux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YWNpeWhiZHd6ZXNuemluYnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDQwNjAsImV4cCI6MjA4MDc4MDA2MH0.4bzZckxtZb2UugZTS1UXJJORPuZ9-hU_rz2VubZXCkY';

const supabaseClient = (typeof supabase !== 'undefined')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// ==================== STATE ====================
let currentUser = null;
let currentLang = localStorage.getItem('ozgerLang') || 'kk';
let currentTheme = localStorage.getItem('ozgerTheme') || 'basic';
let pendingTheme = null; // For preview before apply
let userAvatar = localStorage.getItem('ozgerAvatar') || null;
let matrixAnimationId = null;

// Learning state
let factsData = [];
let currentModule = 0;
let currentCard = 0;
let score = 0;
let totalQuestions = 0;
let selectedMatchItem = null;
let matchedPairs = [];
let enabledModules = {
    flashcards: true,
    quiz: true,
    matching: true
};
let sectionScores = {
    flashcards: { correct: 0, total: 0, answered: 0 },
    quiz: { correct: 0, total: 0, answered: 0 },
    matching: { correct: 0, total: 0, answered: 0 }
};

// Favorites
let favorites = JSON.parse(localStorage.getItem('ozgerFavorites') || '[]');

// User uploaded materials
let userMaterials = JSON.parse(localStorage.getItem('ozgerUserMaterials') || '[]');
let userTests = JSON.parse(localStorage.getItem('ozgerUserTests') || '[]');
let currentLibraryTab = 'all';
let currentLibraryType = 'materials';
let currentSubjectFilter = 'all';
let quicklookMaterial = null;
let deleteTargetId = null;

// User profile data
let userProfile = JSON.parse(localStorage.getItem('ozgerUserProfile') || 'null');

// Registration state
let regStep = 1;
let regData = {};

// Current subject for ENT
let currentSubject = null;
let currentMaterialForAction = null;
let currentEditorType = 'material';

// ==================== TRANSLATIONS ====================
const i18n = {
    kk: {
        menu: 'Мәзір',
        changeStyle: 'Стиль ауыстыру',
        selectStyle: 'Стиль таңдаңыз',
        apply: 'Қолдану',
        styleChanged: 'Стиль сәтті өзгертілді!',
        changeLanguage: 'Тіл ауыстыру',
        selectLanguage: 'Тіл таңдаңыз',
        profile: 'Профиль',
        myMaterials: 'Менің материалдарым',
        favorites: 'Таңдаулылар',
        logout: 'Шығу',
        login: 'Кіру',
        register: 'Тіркелу',
        landingSubtitle: 'Оқуға көмектесетін платформа',
        startLearning: 'Бастау',
        chooseAction: 'Не істегіңіз келеді?',
        feature4Step: '4 Қадамдық оқыту',
        feature4StepDesc: 'Карточкалар, тест, сәйкестендіру арқылы үйрен',
        featureCreate: 'Материал жасау',
        featureCreateDesc: 'Өз тесттеріңді, карточкаларыңды жаса',
        featureLibrary: 'Кітапхана',
        featureLibraryDesc: 'Басқалардың материалдарын қара',
        featureFavorites: 'Таңдаулылар',
        featureFavoritesDesc: 'Сақталған материалдарың',
        inputTitle: 'Материалды енгізіңіз',
        correctFormat: 'Форматты түзету',
        loadSample: 'Мысал жүктеу',
        clear: 'Тазалау',
        formatHint: '📌 Формат:',
        formatHintText: 'Әрбір жолда нөмір, сұрақ және жауап қос нүктемен бөлінген.',
        startModules: 'Оқытуды бастау',
        selectModules: 'Оқыту модульдерін таңдаңыз',
        flashcards: 'Флэш-карталар',
        quiz: 'Тест',
        matching: 'Сәйкестендіру',
        cancel: 'Болдырмау',
        start: 'Бастау',
        correct: 'Дұрыс',
        total: 'Барлығы',
        accuracy: 'Дәлдік',
        prev: 'Алдыңғы',
        next: 'Келесі',
        prevModule: 'Алдыңғы модуль',
        nextModule: 'Келесі модуль',
        showResults: 'Нәтиже',
        congratulations: 'Құттықтаймыз!',
        completedAll: 'Сіз барлық модульдерді аяқтадыңыз!',
        library: 'Кітапхана',
        search: 'Іздеу...',
        noFavorites: 'Әзірге таңдаулылар жоқ',
        changeAvatar: 'Аватарды ауыстыру',
        username: 'Пайдаланушы аты:',
        emailPlaceholder: 'Email енгізіңіз',
        passwordPlaceholder: 'Құпия сөз',
        usernamePlaceholder: 'Пайдаланушы аты',
        confirmPassword: 'Құпия сөзді растаңыз',
        noAccount: 'Аккаунтыңыз жоқ па?',
        haveAccount: 'Аккаунтыңыз бар ма?',
        signUp: 'Тіркелу',
        signIn: 'Кіру',
        forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
        resetPassword: 'Электрондық поштаңызға кіру рұқсатын қалпына келтіру үшін сілтеме жібереміз.',
        sendResetLink: 'Сілтеме жіберу',
        loginSuccess: 'Сәтті кірдіңіз!',
        registerSuccess: 'Тіркелу сәтті! Email-ды тексеріңіз.',
        loginError: 'Кіру қатесі',
        registerError: 'Тіркелу қатесі',
        logoutSuccess: 'Сәтті шықтыңыз',
        passwordMismatch: 'Құпия сөздер сәйкес келмейді',
        fillAllFields: 'Барлық өрістерді толтырыңыз',
        languageChanged: 'Тіл сәтті өзгертілді!',
        avatarUpdated: 'Аватар сәтті жаңартылды!',
        guest: 'Қонақ',
        pleaseLogin: 'Жалғастыру үшін кіріңіз немесе тіркеліңіз',
        faq1q: 'õzger дегеніміз не?',
        faq1a: 'õzger - бұл оқыту платформасы. Карточкалар, тесттер, сәйкестендіру арқылы материалды үйренуге көмектеседі.',
        faq2q: 'Қалай бастауға болады?',
        faq2a: '«Бастау» батырмасын басыңыз, материал енгізіңіз және оқыту модульдерін таңдаңыз.',
        faq3q: 'Материал форматы қандай?',
        faq3a: 'Әрбір жол: «1. Сұрақ: Жауап» форматында болуы керек.',
        faq4q: 'Таңдаулыларды қалай сақтауға болады?',
        faq4a: 'Кітапханадағы материалдарды ⭐ батырмасын басып сақтаңыз.',
        errorEmpty: 'Материалды енгізіңіз',
        errorFormat: 'Материал форматы дұрыс емес',
        errorSelectModule: 'Кем дегенде бір модульді таңдаңыз',
        flashcardHint: '👆 Аудару үшін басыңыз',
        flashcardBackHint: '👆 Сұраққа қайту',
        flashcardKnew: '✓ Білдім',
        flashcardDidntKnow: '✗ Білмедім',
        allCardsDone: '🎉 Барлық карталар аяқталды!',
        goNextModule: 'Келесі модульге өтіңіз',
        quizQuestion: 'Сұрақ',
        matchingTitle: 'Сәйкестендіру',
        matchingQuestions: 'Сұрақтар',
        matchingAnswers: 'Жауаптар',
        allMatched: '🎉 Барлығы сәйкестендірілді!',
        resultsTitle: 'Нәтижелер',
        resultsBySection: '📊 Бөлімдер бойынша нәтижелер',
        correctWord: 'дұрыс',
        exitConfirm: 'Шығуды қалайсыз ба? Прогресс сақталмайды.',
        useMaterial: 'Қолдану',
        addToFavorites: 'Таңдаулыға қосу',
        removeFromFavorites: 'Таңдаулыдан алып тастау',
        allMaterials: 'Барлығы',
        myUploads: 'Менікі',
        uploadMaterial: 'Жүктеу',
        materialTitle: 'Атауы',
        materialCategory: 'Санат',
        materialContent: 'Мазмұны',
        makePublic: 'Жалпыға қолжетімді',
        publish: 'Жариялау',
        titlePlaceholder: 'Мысалы: Биология негіздері',
        catOther: 'Басқа',
        catHistory: 'Тарих',
        catMath: 'Математика',
        catScience: 'Жаратылыстану',
        catLanguage: 'Тілдер',
        catGeography: 'География',
        preview: 'Алдын ала қарау',
        questions: 'сұрақ',
        materialUploaded: 'Материал сәтті жүктелді!',
        fillTitleContent: 'Атау мен мазмұнды толтырыңыз',
        noMaterials: 'Материалдар табылмады',
        confirmDelete: 'Өшіруді растау',
        deleteConfirmText: 'Бұл материалды өшіргіңіз келе ме?',
        delete: 'Өшіру',
        materialDeleted: 'Материал өшірілді',
        andMore: 'және тағы',
        // New translations
        mainActions: 'Негізгі әрекеттер',
        libraryDesc: 'Материалдар мен тесттер',
        uploadDesc: 'Материал немесе тест жүктеу',
        favoritesDesc: 'Сақталған материалдар',
        ratingDesc: 'Үздіктер тізімі',
        historyKZ: 'Қазақстан тарихы',
        readingLit: 'Оқу сауаттылығы',
        mathLit: 'Мат. сауаттылық',
        profileSubject1: '1-ші профиль',
        profileSubject2: '2-ші профиль',
        mockENT: 'Пробный ЕНТ',
        materials: 'Материалдар',
        tests: 'Тесттер',
        allSubjects: 'Барлық пәндер',
        mySchool: 'Менің мектебім',
        myClass: 'Менің сыныбым',
        profileGroup: 'Профиль тобы',
        whatToUpload: 'Не жүктегіңіз келеді?',
        material: 'Материал',
        test: 'Тест',
        dailyTest: 'Күнделікті тест',
        dailyTestDesc: 'Кездейсоқ сұрақтар',
        topics: 'Тақырыптар',
        topicsDesc: 'Тақырып бойынша оқу',
        realTest: 'Real Test',
        realTestDesc: 'ЕНТ форматында тест',
        learn: 'Үйрену',
        practice: 'Жаттығу',
        siteGuide: 'Сайт нұсқаулығы',
        country: 'Ел',
        city: 'Қала',
        school: 'Мектеп',
        class: 'Сынып',
        statistics: 'Статистика',
        testsCompleted: 'Тест өтілді',
        avgScore: 'Орташа балл',
        bestENT: 'Үздік ЕНТ',
        nextStep: 'Келесі',
        prevStep: 'Артқа',
        selectCountry: 'Елді таңдаңыз',
        selectCity: 'Қаланы таңдаңыз',
        selectSchool: 'Мектепті таңдаңыз',
        selectClass: 'Сыныпты таңдаңыз',
        classNumber: 'Сынып',
        classLetter: 'Әріп',
        title: 'Атауы',
        subject: 'Пән',
        content: 'Мазмұны',
        save: 'Сақтау',
        addQuestion: 'Сұрақ қосу',
        faq: 'Жиі қойылатын сұрақтар',
        guide1Title: '1. Тіркелу',
        guide1Text: 'Алдымен тіркеліп, профиліңізді толтырыңыз.',
        guide2Title: '2. Кітапхана',
        guide2Text: 'Кітапханадан материалдар мен тесттерді табыңыз.',
        guide3Title: '3. Үйрену',
        guide3Text: 'Материалды таңдап, оқытуды бастаңыз.',
        guide4Title: '4. ЕНТ',
        guide4Text: 'ЕНТ секциясынан пәндер бойынша жаттығыңыз.',
        profileUpdated: 'Профиль жаңартылды',
        classmates: 'Сыныптастар',
        students: 'оқушы',
        noClassmates: 'Сыныптастар табылмады',
        noRatings: 'Рейтинг әзірге бос',
        you: 'Сіз'
    },
    ru: {
        menu: 'Меню',
        changeStyle: 'Сменить стиль',
        selectStyle: 'Выберите стиль',
        apply: 'Применить',
        styleChanged: 'Стиль успешно изменён!',
        changeLanguage: 'Сменить язык',
        selectLanguage: 'Выберите язык',
        profile: 'Профиль',
        myMaterials: 'Мои материалы',
        favorites: 'Избранное',
        logout: 'Выйти',
        login: 'Вход',
        register: 'Регистрация',
        landingSubtitle: 'Платформа для обучения',
        startLearning: 'Начать',
        chooseAction: 'Что вы хотите сделать?',
        feature4Step: '4 Шаговое обучение',
        feature4StepDesc: 'Учись с карточками, тестами и сопоставлением',
        featureCreate: 'Создать материал',
        featureCreateDesc: 'Создавай свои тесты и карточки',
        featureLibrary: 'Библиотека',
        featureLibraryDesc: 'Смотри материалы других',
        featureFavorites: 'Избранное',
        featureFavoritesDesc: 'Твои сохранённые материалы',
        inputTitle: 'Введите материал',
        correctFormat: 'Исправить формат',
        loadSample: 'Загрузить пример',
        clear: 'Очистить',
        formatHint: '📌 Формат:',
        formatHintText: 'Каждая строка: номер, вопрос и ответ через двоеточие.',
        startModules: 'Начать обучение',
        selectModules: 'Выберите модули обучения',
        flashcards: 'Флэш-карты',
        quiz: 'Тест',
        matching: 'Сопоставление',
        cancel: 'Отмена',
        start: 'Начать',
        correct: 'Верно',
        total: 'Всего',
        accuracy: 'Точность',
        prev: 'Назад',
        next: 'Далее',
        prevModule: 'Предыдущий модуль',
        nextModule: 'Следующий модуль',
        showResults: 'Результат',
        congratulations: 'Поздравляем!',
        completedAll: 'Вы завершили все модули!',
        library: 'Библиотека',
        search: 'Поиск...',
        noFavorites: 'Пока нет избранного',
        changeAvatar: 'Сменить аватар',
        username: 'Имя пользователя:',
        emailPlaceholder: 'Введите email',
        passwordPlaceholder: 'Пароль',
        usernamePlaceholder: 'Имя пользователя',
        confirmPassword: 'Подтвердите пароль',
        noAccount: 'Нет аккаунта?',
        haveAccount: 'Есть аккаунт?',
        signUp: 'Зарегистрироваться',
        signIn: 'Войти',
        forgotPassword: 'Забыли пароль?',
        resetPassword: 'Мы отправим ссылку для восстановления доступа на ваш email',
        sendResetLink: 'Отправить ссылку',
        loginSuccess: 'Успешный вход!',
        registerSuccess: 'Регистрация успешна! Проверьте email.',
        loginError: 'Ошибка входа',
        registerError: 'Ошибка регистрации',
        logoutSuccess: 'Вы вышли из системы',
        passwordMismatch: 'Пароли не совпадают',
        fillAllFields: 'Заполните все поля',
        languageChanged: 'Язык успешно изменён!',
        avatarUpdated: 'Аватар успешно обновлён!',
        guest: 'Гость',
        pleaseLogin: 'Войдите или зарегистрируйтесь чтобы продолжить',
        faq1q: 'Что такое õzger?',
        faq1a: 'õzger - это образовательная платформа. Помогает учить материал через карточки, тесты и сопоставление.',
        faq2q: 'Как начать?',
        faq2a: 'Нажмите «Начать», введите материал и выберите модули обучения.',
        faq3q: 'Какой формат материала?',
        faq3a: 'Каждая строка должна быть в формате: «1. Вопрос: Ответ».',
        faq4q: 'Как сохранить в избранное?',
        faq4a: 'Нажмите ⭐ на материале в библиотеке.',
        errorEmpty: 'Введите материал',
        errorFormat: 'Неверный формат материала',
        errorSelectModule: 'Выберите хотя бы один модуль',
        flashcardHint: '👆 Нажмите, чтобы перевернуть',
        flashcardBackHint: '👆 Вернуться к вопросу',
        flashcardKnew: '✓ Знал',
        flashcardDidntKnow: '✗ Не знал',
        allCardsDone: '🎉 Все карточки завершены!',
        goNextModule: 'Переходите к следующему модулю',
        quizQuestion: 'Вопрос',
        matchingTitle: 'Сопоставление',
        matchingQuestions: 'Вопросы',
        matchingAnswers: 'Ответы',
        allMatched: '🎉 Всё сопоставлено!',
        resultsTitle: 'Результаты',
        resultsBySection: '📊 Результаты по разделам',
        correctWord: 'верно',
        exitConfirm: 'Выйти? Прогресс не сохранится.',
        useMaterial: 'Использовать',
        addToFavorites: 'В избранное',
        removeFromFavorites: 'Убрать из избранного',
        allMaterials: 'Все',
        myUploads: 'Мои',
        uploadMaterial: 'Загрузить',
        materialTitle: 'Название',
        materialCategory: 'Категория',
        materialContent: 'Содержание',
        makePublic: 'Доступен всем',
        publish: 'Опубликовать',
        titlePlaceholder: 'Например: Основы биологии',
        catOther: 'Другое',
        catHistory: 'История',
        catMath: 'Математика',
        catScience: 'Естествознание',
        catLanguage: 'Языки',
        catGeography: 'География',
        preview: 'Предпросмотр',
        questions: 'вопросов',
        materialUploaded: 'Материал успешно загружен!',
        fillTitleContent: 'Заполните название и содержание',
        noMaterials: 'Материалы не найдены',
        confirmDelete: 'Подтверждение удаления',
        deleteConfirmText: 'Вы уверены, что хотите удалить этот материал?',
        delete: 'Удалить',
        materialDeleted: 'Материал удалён',
        andMore: 'и ещё',
        mainActions: 'Основные действия',
        libraryDesc: 'Материалы и тесты',
        uploadDesc: 'Загрузить материал или тест',
        favoritesDesc: 'Сохранённые материалы',
        ratingDesc: 'Рейтинг лучших',
        historyKZ: 'История Казахстана',
        readingLit: 'Грамотность чтения',
        mathLit: 'Мат. грамотность',
        profileSubject1: '1-й профиль',
        profileSubject2: '2-й профиль',
        mockENT: 'Пробный ЕНТ',
        materials: 'Материалы',
        tests: 'Тесты',
        allSubjects: 'Все предметы',
        mySchool: 'Моя школа',
        myClass: 'Мой класс',
        profileGroup: 'Группа профиля',
        whatToUpload: 'Что загрузить?',
        material: 'Материал',
        test: 'Тест',
        dailyTest: 'Ежедневный тест',
        dailyTestDesc: 'Случайные вопросы',
        topics: 'Темы',
        topicsDesc: 'Обучение по темам',
        realTest: 'Real Test',
        realTestDesc: 'Тест в формате ЕНТ',
        learn: 'Учить',
        practice: 'Практика',
        siteGuide: 'Руководство',
        country: 'Страна',
        city: 'Город',
        school: 'Школа',
        class: 'Класс',
        statistics: 'Статистика',
        testsCompleted: 'Тестов пройдено',
        avgScore: 'Средний балл',
        bestENT: 'Лучший ЕНТ',
        nextStep: 'Далее',
        prevStep: 'Назад',
        selectCountry: 'Выберите страну',
        selectCity: 'Выберите город',
        selectSchool: 'Выберите школу',
        selectClass: 'Выберите класс',
        classNumber: 'Класс',
        classLetter: 'Буква',
        title: 'Название',
        subject: 'Предмет',
        content: 'Содержание',
        save: 'Сохранить',
        addQuestion: 'Добавить вопрос',
        faq: 'Часто задаваемые вопросы',
        guide1Title: '1. Регистрация',
        guide1Text: 'Сначала зарегистрируйтесь и заполните профиль.',
        guide2Title: '2. Библиотека',
        guide2Text: 'Найдите материалы и тесты в библиотеке.',
        guide3Title: '3. Обучение',
        guide3Text: 'Выберите материал и начните обучение.',
        guide4Title: '4. ЕНТ',
        guide4Text: 'Практикуйтесь по предметам в секции ЕНТ.',
        profileUpdated: 'Профиль обновлён',
        classmates: 'Одноклассники',
        students: 'учеников',
        noClassmates: 'Одноклассники не найдены',
        noRatings: 'Рейтинг пока пуст',
        you: 'Вы'
    },
    en: {
        menu: 'Menu',
        changeStyle: 'Change Style',
        selectStyle: 'Select Style',
        apply: 'Apply',
        styleChanged: 'Style changed successfully!',
        changeLanguage: 'Change Language',
        selectLanguage: 'Select Language',
        profile: 'Profile',
        myMaterials: 'My Materials',
        favorites: 'Favorites',
        logout: 'Logout',
        login: 'Login',
        register: 'Register',
        landingSubtitle: 'Learning platform to help you study',
        startLearning: 'Start',
        chooseAction: 'What do you want to do?',
        feature4Step: '4 Step Learning',
        feature4StepDesc: 'Learn with flashcards, quizzes, and matching',
        featureCreate: 'Create Material',
        featureCreateDesc: 'Create your own tests and cards',
        featureLibrary: 'Library',
        featureLibraryDesc: 'Browse materials from others',
        featureFavorites: 'Favorites',
        featureFavoritesDesc: 'Your saved materials',
        inputTitle: 'Enter Material',
        correctFormat: 'Correct Format',
        loadSample: 'Load Sample',
        clear: 'Clear',
        formatHint: '📌 Format:',
        formatHintText: 'Each line: number, question and answer separated by colon.',
        startModules: 'Start Learning',
        selectModules: 'Select Learning Modules',
        flashcards: 'Flashcards',
        quiz: 'Quiz',
        matching: 'Matching',
        cancel: 'Cancel',
        start: 'Start',
        correct: 'Correct',
        total: 'Total',
        accuracy: 'Accuracy',
        prev: 'Previous',
        next: 'Next',
        prevModule: 'Previous Module',
        nextModule: 'Next Module',
        showResults: 'Results',
        congratulations: 'Congratulations!',
        completedAll: 'You completed all modules!',
        library: 'Library',
        search: 'Search...',
        noFavorites: 'No favorites yet',
        changeAvatar: 'Change Avatar',
        username: 'Username:',
        emailPlaceholder: 'Enter email',
        passwordPlaceholder: 'Password',
        usernamePlaceholder: 'Username',
        confirmPassword: 'Confirm password',
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        signUp: 'Sign Up',
        signIn: 'Sign In',
        forgotPassword: 'Forgot password?',
        resetPassword: 'We will send restore access link to your email',
        sendResetLink: 'Send link',
        loginSuccess: 'Login successful!',
        registerSuccess: 'Registration successful! Check your email.',
        loginError: 'Login error',
        registerError: 'Registration error',
        logoutSuccess: 'Logged out successfully',
        passwordMismatch: 'Passwords do not match',
        fillAllFields: 'Please fill all fields',
        languageChanged: 'Language changed successfully!',
        avatarUpdated: 'Avatar updated successfully!',
        guest: 'Guest',
        pleaseLogin: 'Please login or register to continue',
        faq1q: 'What is õzger?',
        faq1a: 'õzger is an educational platform. It helps learn material through flashcards, quizzes, and matching.',
        faq2q: 'How to start?',
        faq2a: 'Click "Start", enter your material and select learning modules.',
        faq3q: 'What is the material format?',
        faq3a: 'Each line should be: "1. Question: Answer".',
        faq4q: 'How to save to favorites?',
        faq4a: 'Click the ⭐ button on materials in the library.',
        errorEmpty: 'Please enter material',
        errorFormat: 'Invalid material format',
        errorSelectModule: 'Select at least one module',
        flashcardHint: '👆 Click to flip',
        flashcardBackHint: '👆 Return to question',
        flashcardKnew: '✓ Knew it',
        flashcardDidntKnow: '✗ Didn\'t know',
        allCardsDone: '🎉 All cards completed!',
        goNextModule: 'Proceed to next module',
        quizQuestion: 'Question',
        matchingTitle: 'Matching',
        matchingQuestions: 'Questions',
        matchingAnswers: 'Answers',
        allMatched: '🎉 All matched!',
        resultsTitle: 'Results',
        resultsBySection: '📊 Results by section',
        correctWord: 'correct',
        exitConfirm: 'Exit? Progress will not be saved.',
        useMaterial: 'Use',
        addToFavorites: 'Add to favorites',
        removeFromFavorites: 'Remove from favorites',
        allMaterials: 'All',
        myUploads: 'My uploads',
        uploadMaterial: 'Upload',
        materialTitle: 'Title',
        materialCategory: 'Category',
        materialContent: 'Content',
        makePublic: 'Make public',
        publish: 'Publish',
        titlePlaceholder: 'e.g. Biology basics',
        catOther: 'Other',
        catHistory: 'History',
        catMath: 'Math',
        catScience: 'Science',
        catLanguage: 'Languages',
        catGeography: 'Geography',
        preview: 'Preview',
        questions: 'questions',
        materialUploaded: 'Material uploaded successfully!',
        fillTitleContent: 'Please fill title and content',
        noMaterials: 'No materials found',
        confirmDelete: 'Confirm delete',
        deleteConfirmText: 'Are you sure you want to delete this material?',
        delete: 'Delete',
        materialDeleted: 'Material deleted',
        andMore: 'and more',
        mainActions: 'Main Actions',
        libraryDesc: 'Materials and tests',
        uploadDesc: 'Upload material or test',
        favoritesDesc: 'Saved materials',
        ratingDesc: 'Top ratings',
        historyKZ: 'Kazakhstan History',
        readingLit: 'Reading Literacy',
        mathLit: 'Math Literacy',
        profileSubject1: '1st Profile',
        profileSubject2: '2nd Profile',
        mockENT: 'Mock ENT',
        materials: 'Materials',
        tests: 'Tests',
        allSubjects: 'All Subjects',
        mySchool: 'My School',
        myClass: 'My Class',
        profileGroup: 'Profile Group',
        whatToUpload: 'What to upload?',
        material: 'Material',
        test: 'Test',
        dailyTest: 'Daily Test',
        dailyTestDesc: 'Random questions',
        topics: 'Topics',
        topicsDesc: 'Learn by topic',
        realTest: 'Real Test',
        realTestDesc: 'ENT format test',
        learn: 'Learn',
        practice: 'Practice',
        siteGuide: 'Site Guide',
        country: 'Country',
        city: 'City',
        school: 'School',
        class: 'Class',
        statistics: 'Statistics',
        testsCompleted: 'Tests Completed',
        avgScore: 'Avg Score',
        bestENT: 'Best ENT',
        nextStep: 'Next',
        prevStep: 'Back',
        selectCountry: 'Select country',
        selectCity: 'Select city',
        selectSchool: 'Select school',
        selectClass: 'Select class',
        classNumber: 'Grade',
        classLetter: 'Letter',
        title: 'Title',
        subject: 'Subject',
        content: 'Content',
        save: 'Save',
        addQuestion: 'Add Question',
        faq: 'Frequently Asked Questions',
        guide1Title: '1. Registration',
        guide1Text: 'First register and fill your profile.',
        guide2Title: '2. Library',
        guide2Text: 'Find materials and tests in the library.',
        guide3Title: '3. Learning',
        guide3Text: 'Select material and start learning.',
        guide4Title: '4. ENT',
        guide4Text: 'Practice subjects in the ENT section.',
        profileUpdated: 'Profile updated',
        classmates: 'Classmates',
        students: 'students',
        noClassmates: 'No classmates found',
        noRatings: 'No ratings yet',
        you: 'You'
    }
};

function t(key) {
    return (i18n[currentLang] && i18n[currentLang][key]) || (i18n['en'] && i18n['en'][key]) || key;
}

// ==================== SAMPLE DATA ====================
const sampleMaterial = `1. Қазақ хандығының негізін қалаған: Керей мен Жәнібек
2. Қазақ хандығы құрылған жыл: 1465 жыл
3. Алтын Орда ыдыраған соң қалыптасқан хандық: Ақ Орда
4. Қазақ халқының ата-бабалары: Сақтар, Ғұндар, Түріктер
5. "Қазақ" сөзінің мағынасы: Еркін адам
6. Әбілқайыр хан билеген: Өзбек хандығын
7. Тәуке хан қабылдаған заңдар: "Жеті жарғы"
8. Қазақ жүздерінің саны: Үш жүз
9. Ұлы жүзді басқарған би: Төле би
10. Орта жүзді басқарған би: Қазыбек би`;

const libraryMaterials = [
    {
        id: 1,
        title: 'Қазақстан тарихы',
        author: 'Әкімше',
        count: 10,
        category: 'history',
        content: sampleMaterial
    },
    {
        id: 2,
        title: 'Математика формулалары',
        author: 'Әкімше',
        count: 8,
        category: 'math',
        content: `1. Квадрат теңдеу формуласы: x = (-b ± √(b²-4ac)) / 2a
2. Пифагор теоремасы: a² + b² = c²
3. Шеңбер ауданы: S = πr²
4. Үшбұрыш ауданы: S = (a × h) / 2
5. Тіктөртбұрыш ауданы: S = a × b
6. Параллелограмм ауданы: S = a × h
7. Трапеция ауданы: S = ((a + b) × h) / 2
8. Шар көлемі: V = (4/3)πr³`
    },
    {
        id: 3,
        title: 'English Vocabulary',
        author: 'Admin',
        count: 6,
        category: 'language',
        content: `1. Persistent: Continuing firmly despite difficulties
2. Ambiguous: Having more than one meaning
3. Eloquent: Fluent and persuasive in speaking
4. Pragmatic: Dealing with things sensibly
5. Resilient: Able to recover quickly
6. Meticulous: Showing great attention to detail`
    },
    {
        id: 4,
        title: 'Биология: Адам денесі',
        author: 'Әкімше',
        count: 8,
        category: 'science',
        content: `1. Адам денесіндегі сүйектер саны: 206
2. Қанның негізгі функциясы: Оттегін тасымалдау
3. Жүректің бөліктері: 4 камера (2 жүрекше, 2 қарынша)
4. Өкпе функциясы: Газ алмасу
5. Бүйректің функциясы: Қанды сүзу
6. Миға оттегі жеткізетін: Қызыл қан жасушалары
7. Асқорыту жүйесі басталады: Ауыз қуысы
8. Тері функциясы: Қорғау, терморегуляция`
    },
    {
        id: 5,
        title: 'Әлем географиясы',
        author: 'Admin',
        count: 7,
        category: 'geography',
        content: `1. Әлемдегі ең үлкен мұхит: Тынық мұхит
2. Әлемдегі ең ұзын өзен: Ніл өзені
3. Әлемдегі ең биік тау: Эверест (8848.86 м)
4. Әлемдегі ең үлкен ел: Ресей
5. Әлемдегі ең кішкентай ел: Ватикан
6. Әлемдегі ең терең көл: Байкал көлі
7. Континенттер саны: 7`
    }
];

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        </div>
        <div class="toast-progress"></div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    toast.addEventListener('click', () => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    });
}

// ==================== NAVIGATION ====================
function hideAllPages() {
    document.getElementById('landingPage')?.classList.add('hidden');
    document.getElementById('homePage')?.classList.add('hidden');
    document.getElementById('inputPage')?.classList.add('hidden');
    document.getElementById('learningPage')?.classList.add('hidden');
    document.getElementById('libraryPage')?.classList.add('hidden');
    document.getElementById('favoritesPage')?.classList.add('hidden');
    document.getElementById('ratingPage')?.classList.add('hidden');
    document.getElementById('profilePage')?.classList.add('hidden');
    document.getElementById('classmatesPage')?.classList.add('hidden');
}

function showLanding() {
    hideAllPages();
    document.getElementById('landingPage')?.classList.remove('hidden');
}

function showHome() {
    hideAllPages();
    document.getElementById('homePage')?.classList.remove('hidden');
    updateENTProfileSubjects();
}

function showInputSection() {
    hideAllPages();
    document.getElementById('inputPage')?.classList.remove('hidden');
}

function showCreateSection() {
    showInputSection();
}

function showLearning() {
    hideAllPages();
    document.getElementById('learningPage')?.classList.remove('hidden');
}

function showLibrary() {
    hideAllPages();
    document.getElementById('libraryPage')?.classList.remove('hidden');
    renderLibrary();
}

function showFavorites() {
    hideAllPages();
    document.getElementById('favoritesPage')?.classList.remove('hidden');
    renderFavorites();
}

function showRating() {
    hideAllPages();
    document.getElementById('ratingPage')?.classList.remove('hidden');
    updateRating();
}

function showProfile() {
    hideAllPages();
    document.getElementById('profilePage')?.classList.remove('hidden');
    renderProfilePage();
}

function showClassmates() {
    hideAllPages();
    document.getElementById('classmatesPage')?.classList.remove('hidden');
    renderClassmates();
}

// ==================== CLASSMATES ====================
function renderClassmates() {
    const list = document.getElementById('classmatesList');
    const emptyState = document.getElementById('emptyClassmates');
    const countEl = document.getElementById('classmatesCount');
    const schoolEl = document.getElementById('classmatesSchool');
    const classNameEl = document.getElementById('classmatesClassName');
    
    if (!list) return;
    
    const profile = userProfile || {};
    const userClass = profile.class || '11А';
    const userSchool = profile.school || 'dostyq';
    
    const schoolNames = {
        dostyq: 'Dostyq School',
        nis: 'NIS',
        bil: 'БИЛ',
        other: 'Мектеп'
    };
    
    // Update header
    if (schoolEl) schoolEl.textContent = schoolNames[userSchool] || userSchool;
    if (classNameEl) classNameEl.textContent = userClass;
    
    // In real app this would come from database - showing only current user for now
    const classmates = [];
    
    if (currentUser && profile.username) {
        classmates.push({ 
            username: profile.username, 
            avatar: userAvatar, 
            isCurrentUser: true,
            subject1: profile.subject1,
            subject2: profile.subject2
        });
    }
    
    if (countEl) countEl.textContent = classmates.length;
    
    if (classmates.length === 0) {
        list.innerHTML = '';
        emptyState?.classList.remove('hidden');
        return;
    }
    
    emptyState?.classList.add('hidden');
    
    const subjectNames = getSubjectNames();
    
    list.innerHTML = classmates.map(classmate => `
        <div class="classmate-item ${classmate.isCurrentUser ? 'current-user' : ''}">
            <div class="classmate-avatar">
                ${classmate.avatar 
                    ? `<img src="${classmate.avatar}" alt="">` 
                    : `<span>${classmate.username ? classmate.username.charAt(0).toUpperCase() : '?'}</span>`
                }
            </div>
            <div class="classmate-info">
                <div class="classmate-name">
                    ${classmate.username || t('guest')}
                    ${classmate.isCurrentUser ? `<span class="you-badge">(${t('you')})</span>` : ''}
                </div>
                <div class="classmate-subjects">
                    ${subjectNames[classmate.subject1] || ''} • ${subjectNames[classmate.subject2] || ''}
                </div>
            </div>
        </div>
    `).join('');
}

function getSubjectNames() {
    return {
        math: 'Математика',
        physics: 'Физика',
        chemistry: 'Химия',
        biology: 'Биология',
        geography: 'География',
        world_history: 'Дүниежүзі тарихы',
        english: 'Ағылшын тілі',
        informatics: 'Информатика'
    };
}

function showUploadModal() {
    openModal('uploadTypeModal');
}

function startUpload(type) {
    currentEditorType = type;
    closeModal('uploadTypeModal');
    hideAllPages();
    document.getElementById('inputPage')?.classList.remove('hidden');
    
    const title = document.getElementById('inputPageTitle');
    if (title) {
        title.textContent = type === 'test' ? t('test') : t('material');
    }
    
    document.getElementById('materialEditorGroup')?.classList.toggle('hidden', type === 'test');
    document.getElementById('testEditorGroup')?.classList.toggle('hidden', type !== 'test');
    document.getElementById('startLearningBtn')?.classList.toggle('hidden', type === 'test');
}

// ==================== RATING ====================
function updateRating() {
    const ratingList = document.getElementById('ratingList');
    if (!ratingList) return;
    
    // In real app this would come from database - showing only current user for now
    const profile = userProfile || {};
    const currentUsername = profile.username || currentUser?.user_metadata?.username;
    
    const schoolNames = {
        dostyq: 'Dostyq School',
        nis: 'NIS',
        bil: 'БИЛ',
        other: 'Мектеп'
    };
    
    // Only show current user if logged in
    const ratings = currentUser && currentUsername ? [
        { 
            name: currentUsername, 
            school: schoolNames[profile.school] || profile.school || '-', 
            class: profile.class || '-', 
            score: profile.bestENT || 0 
        }
    ] : [];
    
    if (ratings.length === 0) {
        ratingList.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>${t('noRatings')}</p></div>`;
        return;
    }
    
    ratingList.innerHTML = ratings.map((user, index) => `
        <div class="rating-item ${user.name === currentUsername ? 'self' : ''}">
            <div class="rating-position">${index + 1}</div>
            <div class="rating-user">
                <div class="rating-name">${user.name}</div>
                <div class="rating-school">${user.school} • ${user.class}</div>
            </div>
            <div class="rating-score">${user.score}</div>
        </div>
    `).join('');
}

// ==================== PROFILE PAGE ====================
function renderProfilePage() {
    if (!currentUser && !userProfile) return;
    
    const profile = userProfile || {};
    const user = currentUser || {};
    
    document.getElementById('profilePageUsername').textContent = 
        profile.username || user.user_metadata?.username || t('guest');
    document.getElementById('profilePageEmail').textContent = 
        user.email || profile.email || '-';
    document.getElementById('profilePageCountry').textContent = 
        profile.country || 'Қазақстан';
    document.getElementById('profilePageCity').textContent = 
        profile.city || '-';
    document.getElementById('profilePageSchool').textContent = 
        profile.school || '-';
    
    // Set select values for class
    const classNumberSelect = document.getElementById('profilePageClassNumber');
    const classLetterSelect = document.getElementById('profilePageClassLetter');
    
    if (classNumberSelect && profile.classNumber) {
        classNumberSelect.value = profile.classNumber;
    } else if (classNumberSelect && profile.class) {
        // Extract from combined class like "10А"
        classNumberSelect.value = profile.class.substring(0, 2);
    }
    
    if (classLetterSelect && profile.classLetter) {
        classLetterSelect.value = profile.classLetter;
    } else if (classLetterSelect && profile.class) {
        // Extract from combined class like "10А"
        classLetterSelect.value = profile.class.substring(2);
    }
    
    const subject1Select = document.getElementById('profilePageSubject1');
    if (subject1Select && profile.subject1) {
        subject1Select.value = profile.subject1;
    }
    
    const subject2Select = document.getElementById('profilePageSubject2');
    if (subject2Select && profile.subject2) {
        subject2Select.value = profile.subject2;
    }
    
    // Update ENT section with profile subjects
    updateENTProfileSubjects();
    
    // Update avatar
    if (userAvatar) {
        const placeholder = document.getElementById('pageAvatarPlaceholder');
        const img = document.getElementById('pageAvatarImg');
        if (placeholder && img) {
            placeholder.classList.add('hidden');
            img.classList.remove('hidden');
            img.src = userAvatar;
        }
    }
}

function updateProfileField(field) {
    if (!userProfile) userProfile = {};
    
    const value = document.getElementById(`profilePage${capitalize(field)}`)?.value;
    if (value) {
        userProfile[field] = value;
        localStorage.setItem('ozgerUserProfile', JSON.stringify(userProfile));
        showToast(t('profileUpdated'), 'success');
        updateENTProfileSubjects();
    }
}

function updateClassField() {
    if (!userProfile) userProfile = {};
    
    const classNumber = document.getElementById('profilePageClassNumber')?.value;
    const classLetter = document.getElementById('profilePageClassLetter')?.value;
    
    if (classNumber && classLetter) {
        userProfile.classNumber = classNumber;
        userProfile.classLetter = classLetter;
        userProfile.class = classNumber + classLetter;
        localStorage.setItem('ozgerUserProfile', JSON.stringify(userProfile));
        showToast(t('profileUpdated'), 'success');
    }
}

function updateENTProfileSubjects() {
    const subjectNames = getSubjectNames();
    const profile = userProfile || {};
    
    const name1 = document.getElementById('entProfile1Name');
    if (name1) {
        name1.textContent = profile.subject1 ? subjectNames[profile.subject1] : t('profileSubject1');
    }
    
    const name2 = document.getElementById('entProfile2Name');
    if (name2) {
        name2.textContent = profile.subject2 ? subjectNames[profile.subject2] : t('profileSubject2');
    }
    
    // Update icons based on subject
    const subjectIcons = {
        math: '📐',
        physics: '⚡',
        chemistry: '🧪',
        biology: '🧬',
        geography: '🌍',
        world_history: '📜',
        english: '🇬🇧',
        informatics: '💻'
    };
    
    const icon1 = document.querySelector('#entProfile1 .ent-icon');
    if (icon1 && profile.subject1) {
        icon1.textContent = subjectIcons[profile.subject1] || '📐';
    }
    
    const icon2 = document.querySelector('#entProfile2 .ent-icon');
    if (icon2 && profile.subject2) {
        icon2.textContent = subjectIcons[profile.subject2] || '🔬';
    }
}

// ==================== ENT SUBJECT MODAL ====================
function openSubjectModal(subject) {
    currentSubject = subject;
    const title = document.getElementById('subjectModalTitle');
    
    const subjectNames = {
        history_kz: t('historyKZ'),
        reading: t('readingLit'),
        math_lit: t('mathLit'),
        profile1: userProfile?.subject1 ? t('profileSubject1') : t('profileSubject1'),
        profile2: userProfile?.subject2 ? t('profileSubject2') : t('profileSubject2')
    };
    
    if (title) {
        title.textContent = subjectNames[subject] || subject;
    }
    
    openModal('subjectModal');
}

function subjectAction(action) {
    closeModal('subjectModal');
    
    // Filter library by subject and show
    if (action === 'topics') {
        showLibrary();
        filterBySubject(currentSubject);
    } else if (action === 'daily' || action === 'realtest') {
        // Start random test or real test
        showToast('Тест дайындалуда...', 'info');
    }
}

function startMockENT() {
    showToast('Пробный ЕНТ дайындалуда...', 'info');
}

// ==================== MATERIAL ACTION MODAL ====================
function openMaterialActionModal(material) {
    currentMaterialForAction = material;
    const title = document.getElementById('materialActionTitle');
    if (title) {
        title.textContent = material.title;
    }
    openModal('materialActionModal');
}

function materialAction(action) {
    closeModal('materialActionModal');
    
    if (!currentMaterialForAction) return;
    
    document.getElementById('materialInput').value = currentMaterialForAction.content;
    
    if (action === 'learn') {
        showInputSection();
    } else if (action === 'practice') {
        // Go directly to quiz
        showInputSection();
        setTimeout(() => showModuleSelection(), 100);
    } else if (action === 'realtest') {
        showToast('Real Test режимі дайындалуда...', 'info');
    }
}

function openMaterialActionFromQuicklook() {
    closeModal('quicklookModal');
    if (quicklookMaterial) {
        openMaterialActionModal(quicklookMaterial);
    }
}

function handleStartBtn() {
    if (!currentUser) {
        showToast(t('pleaseLogin'), 'warning');
        openAuthModal('login');
        return;
    }
    showHome();
}

// ==================== SIDE PANELS ====================
function openSidePanelLeft() {
    document.getElementById('sidePanelLeft')?.classList.add('active');
    document.getElementById('blurOverlay')?.classList.add('active');
}

function closeSidePanelLeft() {
    document.getElementById('sidePanelLeft')?.classList.remove('active');
    if (!document.getElementById('sidePanelRight')?.classList.contains('active') &&
        !document.querySelector('.modal-overlay.active')) {
        document.getElementById('blurOverlay')?.classList.remove('active');
    }
}

function openSidePanelRight() {
    if (!currentUser) {
        showToast(t('pleaseLogin'), 'warning');
        openAuthModal('login');
        return;
    }
    document.getElementById('sidePanelRight')?.classList.add('active');
    document.getElementById('blurOverlay')?.classList.add('active');
}

function closeSidePanelRight() {
    document.getElementById('sidePanelRight')?.classList.remove('active');
    if (!document.getElementById('sidePanelLeft')?.classList.contains('active') &&
        !document.querySelector('.modal-overlay.active')) {
        document.getElementById('blurOverlay')?.classList.remove('active');
    }
}

function closeAllSidePanels() {
    closeSidePanelLeft();
    closeSidePanelRight();
}

// ==================== MODALS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.getElementById('blurOverlay')?.classList.add('active');
        closeAllSidePanels();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        if (!document.querySelector('.modal-overlay.active') &&
            !document.getElementById('sidePanelLeft')?.classList.contains('active') &&
            !document.getElementById('sidePanelRight')?.classList.contains('active')) {
            document.getElementById('blurOverlay')?.classList.remove('active');
        }
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.getElementById('blurOverlay')?.classList.remove('active');
}

// ==================== THEME ====================
function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('ozgerTheme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Update style cards selection
    document.querySelectorAll('.style-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.style === theme);
    });
    
    // Handle Matrix animation for flow theme
    if (theme === 'flow') {
        initMatrixRain();
    } else {
        stopMatrixRain();
    }
}

function openStyleModal() {
    pendingTheme = currentTheme;
    document.querySelectorAll('.style-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.style === currentTheme);
    });
    openModal('styleModal');
}

function selectStyle(style) {
    pendingTheme = style;
    document.querySelectorAll('.style-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.style === style);
    });
}

function applySelectedStyle() {
    if (pendingTheme && pendingTheme !== currentTheme) {
        setTheme(pendingTheme);
        showToast(t('styleChanged'), 'success');
    }
    closeModal('styleModal');
}

// Matrix Rain Animation
function initMatrixRain() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);
    
    const chars = 'õzgerアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    
    function draw() {
        ctx.fillStyle = 'rgba(13, 17, 23, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff41';
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * 0.5 + 0.5})`;
            ctx.fillText(text, x, y);
            
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        
        matrixAnimationId = requestAnimationFrame(draw);
    }
    
    draw();
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (currentTheme === 'flow') {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });
}

function stopMatrixRain() {
    if (matrixAnimationId) {
        cancelAnimationFrame(matrixAnimationId);
        matrixAnimationId = null;
    }
}

// ==================== LANGUAGE ====================
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('ozgerLang', lang);
    
    document.querySelectorAll('.lang-card').forEach(card => {
        card.classList.toggle('active', card.dataset.lang === lang);
    });
    
    applyTranslations();
    renderFaqContent();
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[currentLang] && i18n[currentLang][key]) {
            el.textContent = i18n[currentLang][key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18n[currentLang] && i18n[currentLang][key]) {
            el.placeholder = i18n[currentLang][key];
        }
    });
    
    // Update sidebar username
    const sidebarUsername = document.getElementById('sidebarUsername');
    if (sidebarUsername) {
        sidebarUsername.textContent = currentUser 
            ? (currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || t('guest'))
            : t('guest');
    }
}

// ==================== FAQ ====================
function showFaqSection(section) {
    document.querySelectorAll('.faq-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent.includes(section === 'faq' ? t('faq') : t('siteGuide')));
    });
    
    document.getElementById('faqContent')?.classList.toggle('hidden', section !== 'faq');
    document.getElementById('guideContent')?.classList.toggle('hidden', section !== 'guide');
    
    if (section === 'faq') {
        renderFaqContent();
    } else {
        renderGuideContent();
    }
}

function renderFaqContent() {
    const faqContent = document.getElementById('faqContent');
    if (!faqContent) return;
    
    faqContent.innerHTML = `
        <div class="faq-item">
            <div class="faq-question">${t('faq1q')}</div>
            <div class="faq-answer">${t('faq1a')}</div>
        </div>
        <div class="faq-item">
            <div class="faq-question">${t('faq2q')}</div>
            <div class="faq-answer">${t('faq2a')}</div>
        </div>
        <div class="faq-item">
            <div class="faq-question">${t('faq3q')}</div>
            <div class="faq-answer">${t('faq3a')}</div>
        </div>
        <div class="faq-item">
            <div class="faq-question">${t('faq4q')}</div>
            <div class="faq-answer">${t('faq4a')}</div>
        </div>
    `;
}

function renderGuideContent() {
    const guideContent = document.getElementById('guideContent');
    if (!guideContent) return;
    
    guideContent.innerHTML = `
        <div class="guide-step">
            <h4>🔐 ${t('guide1Title')}</h4>
            <p>${t('guide1Text')}</p>
        </div>
        <div class="guide-step">
            <h4>📚 ${t('guide2Title')}</h4>
            <p>${t('guide2Text')}</p>
        </div>
        <div class="guide-step">
            <h4>🎓 ${t('guide3Title')}</h4>
            <p>${t('guide3Text')}</p>
        </div>
        <div class="guide-step">
            <h4>🎯 ${t('guide4Title')}</h4>
            <p>${t('guide4Text')}</p>
        </div>
    `;
}

// ==================== AUTH ====================
function openAuthModal(mode = 'login') {
    regStep = 1;
    regData = {};
    renderAuthForm(mode);
    updateAuthSteps();
    openModal('authModal');
}

function updateAuthSteps() {
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum === regStep);
        step.classList.toggle('completed', stepNum < regStep);
    });
    
    // Show/hide steps for login
    const stepsContainer = document.getElementById('authSteps');
    if (stepsContainer) {
        stepsContainer.style.display = regStep === 0 ? 'none' : 'flex';
    }
}

function renderAuthForm(mode = 'login') {
    const isForgot = mode === 'forgot';
    const isLogin = mode === 'login' && !isForgot;
    const container = document.getElementById('authFormContainer');
    const title = document.getElementById('authModalTitle');
    
    if (title) {
        if (isForgot) {
            title.textContent = t('forgotPassword');
        } else {
            title.textContent = isLogin ? t('login') : t('register');
        }
    }
    
    // For forgot password, show email-only form
    if (isForgot) {
        regStep = 0;
        updateAuthSteps();
        
        if (container) {
            container.innerHTML = `
                <form class="auth-form" id="authForm">
                    <div class="form-group">
                        <label class="form-label">${t('emailPlaceholder')}</label>
                        <input type="email" class="form-input" id="resetEmail" placeholder="${t('emailPlaceholder')}" required>
                    </div>
                    <p class="auth-hint">
                        ${t('resetPassword')}
                    </p>
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px;">
                        ${t('sendResetLink')}
                    </button>
                </form>
                <div class="auth-switch">
                    ${t('haveAccount')}
                    <span class="auth-switch-link" id="backToLog">${t('signUp')}</span>
                </div>
            `;
            
            document.getElementById('authForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                handleForgotPassword();
            });
            
            document.getElementById('backToLog')?.addEventListener('click', () => {
                renderAuthForm('login');
            });
        }
        return;
    }
    
    // For login, show simple form
    if (isLogin) {
        regStep = 0;
        updateAuthSteps();
        
        if (container) {
            container.innerHTML = `
                <form class="auth-form" id="authForm">
                    <div class="form-group">
                        <input type="email" class="form-input" id="authEmail" placeholder="${t('emailPlaceholder')}" required>
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-input" id="authPassword" placeholder="${t('passwordPlaceholder')}" required>
                    </div>
                     <span class="auth-switch-link" id="forgotPassword">${t('forgotPassword')}</span>
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px;">
                        ${t('signIn')}
                    </button>
                </form>
                <div class="auth-switch">
                    ${t('noAccount')}
                    <span class="auth-switch-link" id="authSwitchLink">${t('signUp')}</span>
                </div>
            `;
            
            document.getElementById('authForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                handleAuth(true);
            });
            
            document.getElementById('forgotPassword')?.addEventListener('click', () => {
                renderAuthForm('forgot');
            });
            
            document.getElementById('authSwitchLink')?.addEventListener('click', () => {
                regStep = 1;
                renderAuthForm('register');
            });
        }
        return;
    }
    
    // Multi-step registration
    if (container) {
        if (regStep === 1) {
            container.innerHTML = `
                <form class="auth-form form-step" id="authForm">
                    <div class="form-group">
                        <label class="form-label">${t('usernamePlaceholder')}</label>
                        <input type="text" class="form-input" id="regUsername" value="${regData.username || ''}" placeholder="${t('usernamePlaceholder')}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('country')}</label>
                        <select class="form-input form-select" id="regCountry">
                            <option value="kz" ${regData.country === 'kz' ? 'selected' : ''}>Қазақстан</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('city')}</label>
                        <select class="form-input form-select" id="regCity">
                            <option value="almaty" ${regData.city === 'almaty' ? 'selected' : ''}>Алматы</option>
                            <option value="astana" ${regData.city === 'astana' ? 'selected' : ''}>Астана</option>
                            <option value="shymkent" ${regData.city === 'shymkent' ? 'selected' : ''}>Шымкент</option>
                            <option value="other" ${regData.city === 'other' ? 'selected' : ''}>Басқа</option>
                        </select>
                    </div>
                    <div class="step-nav">
                        <div></div>
                        <button type="submit" class="btn btn-primary">${t('nextStep')} →</button>
                    </div>
                </form>
                <div class="auth-switch">
                    ${t('haveAccount')}
                    <span class="auth-switch-link" id="authSwitchLink">${t('signIn')}</span>
                </div>
            `;
        } else if (regStep === 2) {
            container.innerHTML = `
                <form class="auth-form form-step" id="authForm">
                    <div class="form-group">
                        <label class="form-label">${t('school')}</label>
                        <select class="form-input form-select" id="regSchool">
                            <option value="dostyq" ${regData.school === 'dostyq' ? 'selected' : ''}>Dostyq School</option>
                            <option value="nis" ${regData.school === 'nis' ? 'selected' : ''}>NIS</option>
                            <option value="bil" ${regData.school === 'bil' ? 'selected' : ''}>БИЛ</option>
                            <option value="other" ${regData.school === 'other' ? 'selected' : ''}>Басқа</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">${t('classNumber')}</label>
                            <select class="form-input form-select" id="regClassNumber">
                                <option value="10" ${regData.classNumber === '10' ? 'selected' : ''}>10</option>
                                <option value="11" ${regData.classNumber === '11' ? 'selected' : ''}>11</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${t('classLetter')}</label>
                            <select class="form-input form-select" id="regClassLetter">
                                <option value="А" ${regData.classLetter === 'А' ? 'selected' : ''}>А</option>
                                <option value="Ә" ${regData.classLetter === 'Ә' ? 'selected' : ''}>Ә</option>
                                <option value="Б" ${regData.classLetter === 'Б' ? 'selected' : ''}>Б</option>
                                <option value="В" ${regData.classLetter === 'В' ? 'selected' : ''}>В</option>
                                <option value="Г" ${regData.classLetter === 'Г' ? 'selected' : ''}>Г</option>
                                <option value="Ғ" ${regData.classLetter === 'Ғ' ? 'selected' : ''}>Ғ</option>
                                <option value="Д" ${regData.classLetter === 'Д' ? 'selected' : ''}>Д</option>
                                <option value="Е" ${regData.classLetter === 'Е' ? 'selected' : ''}>Е</option>
                                <option value="Ж" ${regData.classLetter === 'Ж' ? 'selected' : ''}>Ж</option>
                                <option value="З" ${regData.classLetter === 'З' ? 'selected' : ''}>З</option>
                                <option value="И" ${regData.classLetter === 'И' ? 'selected' : ''}>И</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">${t('profileSubject1')}</label>
                            <select class="form-input form-select" id="regSubject1">
                                <option value="math" ${regData.subject1 === 'math' ? 'selected' : ''}>Математика</option>
                                <option value="physics" ${regData.subject1 === 'physics' ? 'selected' : ''}>Физика</option>
                                <option value="chemistry" ${regData.subject1 === 'chemistry' ? 'selected' : ''}>Химия</option>
                                <option value="biology" ${regData.subject1 === 'biology' ? 'selected' : ''}>Биология</option>
                                <option value="geography" ${regData.subject1 === 'geography' ? 'selected' : ''}>География</option>
                                <option value="world_history" ${regData.subject1 === 'world_history' ? 'selected' : ''}>Дүниежүзі тарихы</option>
                                <option value="english" ${regData.subject1 === 'english' ? 'selected' : ''}>Ағылшын тілі</option>
                                <option value="informatics" ${regData.subject1 === 'informatics' ? 'selected' : ''}>Информатика</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${t('profileSubject2')}</label>
                            <select class="form-input form-select" id="regSubject2">
                                <option value="physics" ${regData.subject2 === 'physics' ? 'selected' : ''}>Физика</option>
                                <option value="chemistry" ${regData.subject2 === 'chemistry' ? 'selected' : ''}>Химия</option>
                                <option value="biology" ${regData.subject2 === 'biology' ? 'selected' : ''}>Биология</option>
                                <option value="geography" ${regData.subject2 === 'geography' ? 'selected' : ''}>География</option>
                                <option value="world_history" ${regData.subject2 === 'world_history' ? 'selected' : ''}>Дүниежүзі тарихы</option>
                                <option value="english" ${regData.subject2 === 'english' ? 'selected' : ''}>Ағылшын тілі</option>
                                <option value="informatics" ${regData.subject2 === 'informatics' ? 'selected' : ''}>Информатика</option>
                            </select>
                        </div>
                    </div>
                    <div class="step-nav">
                        <button type="button" class="btn btn-ghost" onclick="prevRegStep()">← ${t('prevStep')}</button>
                        <button type="submit" class="btn btn-primary">${t('nextStep')} →</button>
                    </div>
                </form>
            `;
        } else if (regStep === 3) {
            container.innerHTML = `
                <form class="auth-form form-step" id="authForm">
                    <div class="form-group">
                        <label class="form-label">Gmail</label>
                        <input type="email" class="form-input" id="regEmail" value="${regData.email || ''}" placeholder="${t('emailPlaceholder')}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('passwordPlaceholder')}</label>
                        <input type="password" class="form-input" id="regPassword" placeholder="${t('passwordPlaceholder')}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('confirmPassword')}</label>
                        <input type="password" class="form-input" id="regPasswordConfirm" placeholder="${t('confirmPassword')}" required>
                    </div>
                    <div class="step-nav">
                        <button type="button" class="btn btn-ghost" onclick="prevRegStep()">← ${t('prevStep')}</button>
                        <button type="submit" class="btn btn-primary">${t('signUp')}</button>
                    </div>
                </form>
            `;
        }
        
        document.getElementById('authForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRegStep();
        });
        
        document.getElementById('authSwitchLink')?.addEventListener('click', () => {
            renderAuthForm('login');
        });
        
        updateAuthSteps();
    }
}

function prevRegStep() {
    if (regStep > 1) {
        regStep--;
        renderAuthForm('register');
    }
}

function handleRegStep() {
    if (regStep === 1) {
        regData.username = document.getElementById('regUsername')?.value.trim();
        regData.country = document.getElementById('regCountry')?.value;
        regData.city = document.getElementById('regCity')?.value;
        
        if (!regData.username) {
            showToast(t('fillAllFields'), 'warning');
            return;
        }
        
        regStep = 2;
        renderAuthForm('register');
    } else if (regStep === 2) {
        regData.school = document.getElementById('regSchool')?.value;
        regData.classNumber = document.getElementById('regClassNumber')?.value;
        regData.classLetter = document.getElementById('regClassLetter')?.value;
        regData.class = regData.classNumber + regData.classLetter; // Combined: "10А"
        regData.subject1 = document.getElementById('regSubject1')?.value;
        regData.subject2 = document.getElementById('regSubject2')?.value;
        
        regStep = 3;
        renderAuthForm('register');
    } else if (regStep === 3) {
        regData.email = document.getElementById('regEmail')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regPasswordConfirm')?.value;
        
        if (!regData.email || !password) {
            showToast(t('fillAllFields'), 'warning');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast(t('passwordMismatch'), 'warning');
            return;
        }
        
        // Complete registration
        completeRegistration(password);
    }
}

async function completeRegistration(password) {
    if (!supabaseClient) {
        // Fallback for local testing
        userProfile = {
            username: regData.username,
            country: regData.country,
            city: regData.city,
            school: regData.school,
            class: regData.class,
            subject1: regData.subject1,
            subject2: regData.subject2,
            email: regData.email
        };
        localStorage.setItem('ozgerUserProfile', JSON.stringify(userProfile));
        currentUser = { email: regData.email, user_metadata: { username: regData.username } };
        showToast(t('registerSuccess'), 'success');
        closeModal('authModal');
        updateAuthUI();
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({ 
            email: regData.email, 
            password,
            options: { 
                data: { 
                    username: regData.username,
                    country: regData.country,
                    city: regData.city,
                    school: regData.school,
                    class: regData.class,
                    subject1: regData.subject1,
                    subject2: regData.subject2
                } 
            }
        });
        
        if (error) throw error;
        
        // Save profile locally too
        userProfile = { ...regData };
        localStorage.setItem('ozgerUserProfile', JSON.stringify(userProfile));
        
        showToast(t('registerSuccess'), 'success');
        closeModal('authModal');
    } catch (error) {
        showToast(t('registerError') + ': ' + error.message, 'error');
    }
}

async function handleAuth(isLogin) {
    const email = document.getElementById('authEmail')?.value.trim();
    const password = document.getElementById('authPassword')?.value;
    const confirmPassword = document.getElementById('authPasswordConfirm')?.value;
    const username = document.getElementById('authUsername')?.value.trim();
    
    if (!email || !password) {
        showToast(t('fillAllFields'), 'warning');
        return;
    }
    
    if (!isLogin) {
        if (!username) {
            showToast(t('fillAllFields'), 'warning');
            return;
        }
        if (password !== confirmPassword) {
            showToast(t('passwordMismatch'), 'warning');
            return;
        }
    }
    
    if (!supabaseClient) {
        showToast('Supabase not configured', 'error');
        return;
    }
    
    try {
        if (isLogin) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            currentUser = data.user;
            showToast(t('loginSuccess'), 'success');
            closeModal('authModal');
            updateAuthUI();
        } else {
            const { data, error } = await supabaseClient.auth.signUp({ 
                email, 
                password,
                options: { data: { username: username } }
            });
            if (error) throw error;
            
            showToast(t('registerSuccess'), 'success');
            closeModal('authModal');
        }
    } catch (err) {
        showToast(`${isLogin ? t('loginError') : t('registerError')}: ${err.message}`, 'error');
    }
}

async function handleLogout() {
    if (!supabaseClient) return;
    
    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        showToast(t('logoutSuccess'), 'success');
        closeModal('profileModal');
        closeSidePanelRight();
        updateAuthUI();
        showLanding();
    } catch (err) {
        showToast('Logout error: ' + err.message, 'error');
    }
}
async function handleForgotPassword() {
    const emailInput = document.getElementById('resetEmail');
    if (!emailInput || !supabaseClient) return;

    const email = emailInput.value.trim();
    if (!email) {
        showToast(t('emailPlaceholder') + ' required', 'warning');
        return;
    }

    pendingResetEmail = email;
    // Use query parameters for Netlify compatibility
    const resetUrl = `${window.location.origin}?type=recovery`;

    console.log('Attempting to send reset link to:', email);
    console.log('Reset URL:', resetUrl);

    try {
        // Use Supabase built-in reset password function
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: resetUrl
        });

        if (error) {
            console.error('Reset password error:', error);
            console.log('❌ Email not configured in Supabase!');
            console.log('📧 To enable email sending, follow instructions in SUPABASE_EMAIL_SETUP.md');
            console.log('🔗 For testing, use this reset URL:', resetUrl);

            // Show helpful message to user
            showToast('Email not configured. Check console for reset URL.', 'warning');

            // Still show success modal for testing
            setAuthStep('forgot-password-modal');
        } else {
            console.log('Reset password link sent successfully:', data);
            showToast('Reset password link sent to your email', 'success');
            setAuthStep('forgot-password-modal');
        }
    } catch (err) {
        console.error('Reset password error:', err);
        console.log('❌ Network/Supabase error!');
        console.log('📧 Check SUPABASE_EMAIL_SETUP.md for configuration');
        console.log('🔗 For testing, use this reset URL:', resetUrl);

        showToast('Check console for reset URL (email not configured)', 'warning');
        setAuthStep('forgot-password-modal');
    }

}

async function loadSession() {
    if (!supabaseClient) return;
    
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session?.user) {
        currentUser = data.session.user;
        if (currentUser.user_metadata?.avatar_url) {
            userAvatar = currentUser.user_metadata.avatar_url;
        }
    }
    updateAuthUI();
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userIconBtn = document.getElementById('userIconBtn');
    const userIconText = document.getElementById('userIconText');
    const userAvatar = document.getElementById('userAvatar');
    const sidebarUsername = document.getElementById('sidebarUsername');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    
    if (currentUser) {
        authButtons?.classList.add('hidden');
        userIconBtn?.classList.remove('hidden');
        
        const initial = (currentUser.user_metadata?.username || currentUser.email || '?')[0].toUpperCase();
        if (userIconText) userIconText.textContent = initial;
        if (profilePlaceholder) profilePlaceholder.textContent = initial;
        
        if (sidebarUsername) {
            sidebarUsername.textContent = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || t('guest');
        }
    } else {
        authButtons?.classList.remove('hidden');
        userIconBtn?.classList.add('hidden');
        
        if (sidebarUsername) sidebarUsername.textContent = t('guest');
        if (profilePlaceholder) profilePlaceholder.textContent = '?';
    }
}

// ==================== PROFILE ====================
function openProfileModal() {
    if (!currentUser) {
        openAuthModal('login');
        return;
    }
    
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileUsername) {
        profileUsername.textContent = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || '-';
    }
    if (profileEmail) {
        profileEmail.textContent = currentUser.email || '-';
    }
    
    openModal('profileModal');
}

async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target.result;
        userAvatar = base64;
        localStorage.setItem('ozgerAvatar', base64);
        
        if (currentUser && supabaseClient) {
            try {
                await supabaseClient.auth.updateUser({
                    data: { avatar_url: base64 }
                });
            } catch (err) {
                console.warn('Could not save avatar to server:', err);
            }
        }
        
        updateAvatarUI(base64);
        showToast(t('avatarUpdated'), 'success');
    };
    reader.readAsDataURL(file);
}

function updateAvatarUI(url) {
    if (!url) return;
    
    const userAvatar = document.getElementById('userAvatar');
    const profileAvatar = document.getElementById('profileAvatar');
    const modalAvatarImg = document.getElementById('modalAvatarImg');
    
    if (userAvatar) {
        userAvatar.src = url;
        userAvatar.classList.remove('hidden');
        document.getElementById('userIconText')?.classList.add('hidden');
    }
    
    if (profileAvatar) {
        profileAvatar.src = url;
        profileAvatar.classList.remove('hidden');
        document.getElementById('profilePlaceholder')?.classList.add('hidden');
    }
    
    if (modalAvatarImg) {
        modalAvatarImg.src = url;
        modalAvatarImg.classList.remove('hidden');
        document.getElementById('modalAvatarPlaceholder')?.classList.add('hidden');
    }
}

// ==================== INPUT SECTION ====================
function clearInput() {
    const input = document.getElementById('materialInput');
    if (input) input.value = '';
    hideError();
}

function loadSampleMaterial() {
    const input = document.getElementById('materialInput');
    if (input) input.value = sampleMaterial;
}

function runCorrector() {
    const input = document.getElementById('materialInput');
    if (!input) return;
    
    const raw = input.value.trim();
    if (!raw) return;
    
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const merged = [];
    let buffer = '';
    const numbered = /^\d+[\.\)]/;

    lines.forEach(line => {
        const isNumbered = numbered.test(line);

        if (isNumbered && buffer) {
            merged.push(buffer);
            buffer = line;
        } else if (isNumbered && !buffer) {
            buffer = line;
        } else {
            buffer = buffer ? `${buffer} ${line}` : line;
        }
    });

    if (buffer) merged.push(buffer);

    const fixed = merged.map((line, idx) => {
        let text = line.replace(/^\d+[\.\)]\s*/, '').trim();
        if (!text.includes(':')) {
            const dashSplit = text.split(/[-–—]/);
            if (dashSplit.length >= 2) {
                text = dashSplit[0].trim() + ': ' + dashSplit.slice(1).join('-').trim();
            }
        } else {
            const colonIndex = text.indexOf(':');
            const question = text.substring(0, colonIndex).trim();
            const answer = text.substring(colonIndex + 1).trim().replace(/\s+/g, ' ');
            text = `${question}: ${answer}`;
        }
        return `${idx + 1}. ${text}`;
    }).join('\n');

    input.value = fixed;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) errorDiv.classList.add('hidden');
}

function parseInput(material) {
    const lines = material.split('\n').filter(line => line.trim());
    const facts = [];

    lines.forEach((line) => {
        let cleanLine = line.replace(/^\d+[\.\)]\s*/, '').trim();
        const colonIndex = cleanLine.lastIndexOf(':');
        if (colonIndex > 0 && colonIndex < cleanLine.length - 1) {
            const question = cleanLine.substring(0, colonIndex).trim();
            const answer = cleanLine.substring(colonIndex + 1).trim();
            
            if (question && answer) {
                facts.push({
                    index: facts.length + 1,
                    question: question,
                    answer: answer,
                    original: line.trim()
                });
            }
        }
    });
    
    return facts;
}

function showModuleSelection() {
    const material = document.getElementById('materialInput')?.value.trim();
    
    if (!material) {
        showError(t('errorEmpty'));
        return;
    }
    
    hideError();
    factsData = parseInput(material);
    
    if (factsData.length === 0) {
        showError(t('errorFormat'));
        return;
    }
    
    openModal('moduleModal');
}

// ==================== LEARNING ====================
function startLearning() {
    enabledModules.flashcards = document.getElementById('chkFlashcards')?.checked || false;
    enabledModules.quiz = document.getElementById('chkQuiz')?.checked || false;
    enabledModules.matching = document.getElementById('chkMatching')?.checked || false;
    
    if (!enabledModules.flashcards && !enabledModules.quiz && !enabledModules.matching) {
        showToast(t('errorSelectModule'), 'warning');
        return;
    }
    
    closeModal('moduleModal');
    
    sectionScores = {
        flashcards: { correct: 0, total: 0, answered: 0 },
        quiz: { correct: 0, total: 0, answered: 0 },
        matching: { correct: 0, total: 0, answered: 0 }
    };
    
    currentModule = -1;
    score = 0;
    totalQuestions = 0;
    matchedPairs = [];
    
    showLearning();
    nextModule();
}

function getEnabledModulesList() {
    const modules = [];
    let num = 1;
    if (enabledModules.flashcards) modules.push({ id: 'flashcardsModule', titleKey: 'flashcards', init: initFlashcards, key: 'flashcards', num: num++ });
    if (enabledModules.quiz) modules.push({ id: 'quizModule', titleKey: 'quiz', init: initQuiz, key: 'quiz', num: num++ });
    if (enabledModules.matching) modules.push({ id: 'matchingModule', titleKey: 'matching', init: initMatching, key: 'matching', num: num++ });
    return modules;
}

function showModule(moduleIndex) {
    const modules = getEnabledModulesList();
    
    if (moduleIndex < 0 || moduleIndex >= modules.length) {
        currentModule = modules.length;
        document.querySelectorAll('.learning-module').forEach(m => m.classList.remove('active'));
        document.getElementById('completionModule')?.classList.add('active');
        document.getElementById('moduleTitle').textContent = t('resultsTitle');
        document.getElementById('prevModuleBtn').style.display = 'none';
        document.getElementById('nextModuleBtn').style.display = 'none';
        document.getElementById('finishBtn').style.display = 'none';
        showCompletion();
        return;
    }
    
    document.querySelectorAll('.learning-module').forEach(m => m.classList.remove('active'));
    currentModule = moduleIndex;
    const moduleInfo = modules[moduleIndex];
    document.getElementById('moduleTitle').textContent = `${moduleInfo.num}. ${t(moduleInfo.titleKey)}`;
    document.getElementById(moduleInfo.id)?.classList.add('active');
    updateProgress();
    updateScoreDisplay();
    updateModuleNavigation();
    moduleInfo.init();
}

function updateProgress() {
    const modules = getEnabledModulesList();
    const progress = modules.length > 0 ? Math.min(((currentModule + 1) / modules.length) * 100, 100) : 0;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
        progressBar.textContent = Math.round(progress) + '%';
    }
}

function updateScoreDisplay() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('totalValue').textContent = totalQuestions;
    const percent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    document.getElementById('percentValue').textContent = percent + '%';
}

function updateModuleNavigation() {
    const modules = getEnabledModulesList();
    const prevModuleBtn = document.getElementById('prevModuleBtn');
    const nextModuleBtn = document.getElementById('nextModuleBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    if (currentModule >= modules.length) {
        if (prevModuleBtn) prevModuleBtn.style.display = 'none';
        if (nextModuleBtn) nextModuleBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
        return;
    }
    
    if (prevModuleBtn) prevModuleBtn.style.display = currentModule <= 0 ? 'none' : 'inline-flex';
    if (nextModuleBtn) nextModuleBtn.style.display = (currentModule >= modules.length - 1) ? 'none' : 'inline-flex';
    if (finishBtn) finishBtn.style.display = 'inline-flex';
}

function previousModule() {
    if (currentModule > 0) {
        showModule(currentModule - 1);
    }
}

function nextModule() {
    const modules = getEnabledModulesList();
    if (currentModule < modules.length - 1) {
        showModule(currentModule + 1);
    } else {
        showModule(modules.length);
    }
}

function finishAndShowResults() {
    const modules = getEnabledModulesList();
    showModule(modules.length);
}

function confirmExitLearning() {
    if (confirm(t('exitConfirm'))) {
        showHome();
    }
}

// ==================== FLASHCARDS ====================
function initFlashcards() {
    currentCard = 0;
    sectionScores.flashcards = { correct: 0, total: factsData.length, answered: 0 };
    showFlashcard(0);
}

function showFlashcard(index) {
    if (index < 0 || index >= factsData.length) return;
    
    const container = document.getElementById('flashcardContainer');
    const fact = factsData[index];
    
    document.getElementById('cardCounter').textContent = `${index + 1} / ${factsData.length}`;
    updateCardNavigation();
    
    container.innerHTML = `
        <div class="flashcard-wrapper">
            <div class="flashcard" id="currentFlashcard" onclick="flipCard()">
                <div class="flashcard-face flashcard-front">
                    <div class="flashcard-question">${fact.question}:</div>
                    <div class="flashcard-hint">${t('flashcardHint')}</div>
                </div>
                <div class="flashcard-face flashcard-back">
                    <div class="flashcard-answer">${fact.answer}</div>
                    <div class="flashcard-hint">${t('flashcardBackHint')}</div>
                </div>
            </div>
        </div>
        <div class="flashcard-scoring" id="flashcardScoring" style="display: none;">
            <button class="score-btn knew" onclick="scoreFlashcard(true)">${t('flashcardKnew')}</button>
            <button class="score-btn didnt-know" onclick="scoreFlashcard(false)">${t('flashcardDidntKnow')}</button>
        </div>
    `;
}

function updateCardNavigation() {
    const prevBtn = document.getElementById('prevCardBtn');
    const nextBtn = document.getElementById('nextCardBtn');
    
    if (prevBtn) prevBtn.style.display = currentCard <= 0 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = currentCard >= factsData.length - 1 ? 'none' : 'inline-flex';
}

function flipCard() {
    const card = document.getElementById('currentFlashcard');
    if (card) {
        card.classList.toggle('flipped');
        const scoringDiv = document.getElementById('flashcardScoring');
        if (scoringDiv) {
            scoringDiv.style.display = card.classList.contains('flipped') ? 'flex' : 'none';
        }
    }
}

function scoreFlashcard(knew) {
    totalQuestions++;
    sectionScores.flashcards.answered++;
    if (knew) {
        score++;
        sectionScores.flashcards.correct++;
    }
    updateScoreDisplay();
    
    if (currentCard < factsData.length - 1) {
        currentCard++;
        showFlashcard(currentCard);
    } else {
        document.getElementById('flashcardContainer').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3em; margin-bottom: 15px;">🎉</div>
                <h3 style="color: var(--color-primary);">${t('allCardsDone')}</h3>
                <p style="color: var(--text-muted); margin-top: 10px;">${t('goNextModule')}</p>
            </div>
        `;
        document.getElementById('prevCardBtn').style.display = 'none';
        document.getElementById('nextCardBtn').style.display = 'none';
    }
}

function previousCard() {
    if (currentCard > 0) {
        currentCard--;
        showFlashcard(currentCard);
    }
}

function nextCard() {
    if (currentCard < factsData.length - 1) {
        currentCard++;
        showFlashcard(currentCard);
    }
}

// ==================== QUIZ ====================
function initQuiz() {
    const container = document.getElementById('quizContainer');
    container.innerHTML = '';
    
    sectionScores.quiz = { correct: 0, total: factsData.length, answered: 0 };
    totalQuestions += factsData.length;

    factsData.forEach((fact, index) => {
        const questionBox = document.createElement('div');
        questionBox.className = 'question-box';
        questionBox.dataset.answered = 'false';
        
        const options = generateQuizOptions(fact, index);
        
        questionBox.innerHTML = `
            <h3>${t('quizQuestion')} ${index + 1}</h3>
            <div class="question-text">${fact.question}:</div>
            <div class="options" id="options-${index}">
                ${options.map((opt, i) => `
                    <div class="option" onclick="checkQuizAnswer(${index}, ${i}, '${escapeHtml(fact.answer)}')">${opt}</div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(questionBox);
    });
    
    updateScoreDisplay();
}

function generateQuizOptions(fact, factIndex) {
    const correctAnswer = fact.answer;
    const options = [correctAnswer];
    
    let attempts = 0;
    while (options.length < 4 && attempts < 50) {
        const randomFact = factsData[Math.floor(Math.random() * factsData.length)];
        if (randomFact.answer !== correctAnswer && !options.includes(randomFact.answer)) {
            options.push(randomFact.answer);
        }
        attempts++;
    }
    
    return shuffleArray(options);
}

function checkQuizAnswer(questionIndex, optionIndex, correctAnswer) {
    const optionsContainer = document.getElementById(`options-${questionIndex}`);
    if (!optionsContainer) return;
    
    const questionBox = optionsContainer.closest('.question-box');
    if (questionBox.dataset.answered === 'true') return;
    questionBox.dataset.answered = 'true';
    
    const options = optionsContainer.querySelectorAll('.option');
    const selectedOption = options[optionIndex];
    const selectedText = selectedOption.textContent.trim();
    
    options.forEach(option => {
        option.classList.add('disabled');
        if (option.textContent.trim() === correctAnswer) {
            option.classList.add('correct');
        }
    });
    
    sectionScores.quiz.answered++;
    
    if (selectedText === correctAnswer) {
        score++;
        sectionScores.quiz.correct++;
    } else {
        selectedOption.classList.add('incorrect');
    }
    
    updateScoreDisplay();
}

// ==================== MATCHING ====================
function initMatching() {
    matchedPairs = [];
    selectedMatchItem = null;
    
    sectionScores.matching = { correct: 0, total: factsData.length, answered: 0 };
    totalQuestions += factsData.length;
    
    renderMatching();
    updateScoreDisplay();
}

function renderMatching() {
    const container = document.getElementById('matchingContainer');
    const unmatchedFacts = factsData.filter(f => !matchedPairs.includes(f.index));
    
    let html = `<h3>${t('matchingTitle')}</h3>`;
    
    if (matchedPairs.length > 0) {
        html += '<div class="matched-pairs">';
        matchedPairs.forEach(factIndex => {
            const fact = factsData.find(f => f.index === factIndex);
            html += `
                <div class="matched-pair">
                    <div class="question-side">${fact.question}</div>
                    <div class="answer-side">${fact.answer}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (unmatchedFacts.length > 0) {
        const shuffledQuestions = shuffleArray([...unmatchedFacts]);
        const shuffledAnswers = shuffleArray([...unmatchedFacts]);
        
        html += `
            <div class="matching-game">
                <div class="matching-column">
                    <h4>${t('matchingQuestions')}</h4>
                    ${shuffledQuestions.map(fact => `
                        <div class="matching-item" data-fact-index="${fact.index}" data-side="left" onclick="selectMatchItem(this)">
                            ${fact.question}
                        </div>
                    `).join('')}
                </div>
                <div class="matching-column">
                    <h4>${t('matchingAnswers')}</h4>
                    ${shuffledAnswers.map(fact => `
                        <div class="matching-item" data-fact-index="${fact.index}" data-side="right" onclick="selectMatchItem(this)">
                            ${fact.answer}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="text-align: center; padding: 30px;">
                <div style="font-size: 3em; margin-bottom: 15px;">🎉</div>
                <h3 style="color: var(--color-primary);">${t('allMatched')}</h3>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function selectMatchItem(item) {
    const side = item.dataset.side;
    const factIndex = item.dataset.factIndex;
    
    if (!selectedMatchItem) {
        item.classList.add('selected');
        selectedMatchItem = { element: item, side, factIndex };
    } else if (selectedMatchItem.side === side) {
        selectedMatchItem.element.classList.remove('selected');
        item.classList.add('selected');
        selectedMatchItem = { element: item, side, factIndex };
    } else {
        if (selectedMatchItem.factIndex === factIndex) {
            matchedPairs.push(parseInt(factIndex));
            score++;
            sectionScores.matching.correct++;
            sectionScores.matching.answered++;
            updateScoreDisplay();
            
            setTimeout(() => {
                renderMatching();
            }, 300);
        } else {
            item.classList.add('wrong');
            selectedMatchItem.element.classList.add('wrong');
            
            setTimeout(() => {
                item.classList.remove('wrong');
                selectedMatchItem.element.classList.remove('wrong', 'selected');
                selectedMatchItem = null;
            }, 500);
            return;
        }
        selectedMatchItem = null;
    }
}

// ==================== COMPLETION ====================
function showCompletion() {
    const statsContainer = document.getElementById('completionStats');
    
    let totalCorrect = 0;
    let totalAll = 0;
    if (enabledModules.flashcards) { totalCorrect += sectionScores.flashcards.correct; totalAll += sectionScores.flashcards.total; }
    if (enabledModules.quiz) { totalCorrect += sectionScores.quiz.correct; totalAll += sectionScores.quiz.total; }
    if (enabledModules.matching) { totalCorrect += sectionScores.matching.correct; totalAll += sectionScores.matching.total; }
    
    const sectionInfo = [
        { key: 'flashcards', name: t('flashcards'), icon: '📇', enabled: enabledModules.flashcards },
        { key: 'quiz', name: t('quiz'), icon: '✅', enabled: enabledModules.quiz },
        { key: 'matching', name: t('matching'), icon: '🔗', enabled: enabledModules.matching }
    ];
    
    const gradeClass = (pct) => pct >= 80 ? 'excellent' : pct >= 60 ? 'good' : pct >= 40 ? 'average' : 'poor';

    let html = `<div class="section-results"><h3>${t('resultsBySection')}</h3>`;
    sectionInfo.forEach(section => {
        if (!section.enabled) return;
        const data = sectionScores[section.key];
        const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        const g = gradeClass(pct);
        html += `
            <div class="section-result-item">
                <div class="section-icon">${section.icon}</div>
                <div class="section-info">
                    <div class="section-name">${section.name}</div>
                    <div class="section-score">${data.correct} / ${data.total} ${t('correctWord')}</div>
                    <div class="section-progress">
                        <div class="section-progress-fill ${g}" style="width:${pct}%"></div>
                    </div>
                </div>
                <div class="section-percent ${g}">${pct}%</div>
            </div>
        `;
    });
    html += '</div>';
    statsContainer.innerHTML = html;
}

// ==================== LIBRARY ====================
function setLibraryFilter(filterType, value) {
    if (filterType === 'owner') {
        currentLibraryTab = value;
        document.querySelectorAll('.filter-tab[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === value);
        });
    } else if (filterType === 'type') {
        currentLibraryType = value;
        document.querySelectorAll('.filter-tab[data-type]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === value);
        });
    }
    renderLibrary();
}

function filterBySubject(subject) {
    if (subject) {
        currentSubjectFilter = subject;
        const select = document.getElementById('subjectFilter');
        if (select) select.value = subject;
    } else {
        currentSubjectFilter = document.getElementById('subjectFilter')?.value || 'all';
    }
    renderLibrary();
}

function switchLibraryTab(tab) {
    currentLibraryTab = tab;
    document.querySelectorAll('.filter-tab[data-filter]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === tab);
    });
    renderLibrary();
}

function getAllMaterials() {
    // Combine library materials with user materials
    return [...libraryMaterials, ...userMaterials];
}

function renderLibrary() {
    const grid = document.getElementById('libraryGrid');
    const emptyState = document.getElementById('emptyLibrary');
    if (!grid) return;
    
    let materials;
    if (currentLibraryTab === 'my') {
        materials = currentLibraryType === 'tests' ? userTests : userMaterials;
    } else {
        materials = currentLibraryType === 'tests' ? [...userTests] : getAllMaterials();
    }
    
    // Subject filter
    if (currentSubjectFilter && currentSubjectFilter !== 'all') {
        materials = materials.filter(m => m.category === currentSubjectFilter || m.subject === currentSubjectFilter);
    }
    
    const query = document.getElementById('librarySearch')?.value.toLowerCase() || '';
    if (query) {
        materials = materials.filter(m => 
            m.title.toLowerCase().includes(query) || 
            m.author.toLowerCase().includes(query) ||
            (m.category && m.category.toLowerCase().includes(query))
        );
    }
    
    if (materials.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    
    grid.innerHTML = materials.map(material => {
        const isFavorite = favorites.includes(material.id);
        const isOwn = material.isUserMaterial || false;
        const categoryIcon = getCategoryIcon(material.category);
        
        return `
            <div class="material-card" onclick="openQuicklook(${material.id}, ${isOwn})">
                <div class="material-card-header">
                    <div class="material-card-title">${escapeHtml(material.title)}</div>
                    <div class="material-card-badge">${categoryIcon}</div>
                </div>
                <div class="material-card-meta">
                    <span>👤 ${escapeHtml(material.author)}</span>
                    <span>📝 ${material.count} ${t('questions')}</span>
                </div>
                <div class="material-card-actions" onclick="event.stopPropagation()">
                    <button class="card-action-btn" onclick="useMaterial(${material.id}, ${isOwn})">
                        🚀 ${t('useMaterial')}
                    </button>
                    <button class="card-action-btn ${isFavorite ? 'favorite-active' : ''}" onclick="toggleFavorite(${material.id}, ${isOwn})">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                    ${isOwn ? `<button class="card-action-btn delete-btn" onclick="showDeleteConfirm(${material.id})">🗑️</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getCategoryIcon(category) {
    const icons = {
        history: '📜',
        math: '🔢',
        science: '🔬',
        language: '🌍',
        geography: '🗺️',
        other: '📚'
    };
    return icons[category] || '📚';
}

function useMaterial(id, isUserMaterial = false) {
    const materials = isUserMaterial ? userMaterials : getAllMaterials();
    const material = materials.find(m => m.id === id);
    if (material) {
        document.getElementById('materialInput').value = material.content;
        showInputSection();
    }
}

function toggleFavorite(id, isUserMaterial = false) {
    const favId = isUserMaterial ? `user_${id}` : id;
    const index = favorites.indexOf(favId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(favId);
    }
    localStorage.setItem('ozgerFavorites', JSON.stringify(favorites));
    renderLibrary();
    renderFavorites();
}

function searchLibrary() {
    renderLibrary();
}

// ==================== UPLOAD MATERIAL ====================
function showUploadPage() {
    hideAllPages();
    document.getElementById('uploadPage')?.classList.remove('hidden');
    // Clear form
    document.getElementById('uploadTitle').value = '';
    document.getElementById('uploadContent').value = '';
    document.getElementById('uploadCategory').value = 'other';
    document.getElementById('uploadPublic').checked = true;
}

function uploadMaterial() {
    const title = document.getElementById('uploadTitle')?.value.trim();
    const content = document.getElementById('uploadContent')?.value.trim();
    const category = document.getElementById('uploadCategory')?.value || 'other';
    const isPublic = document.getElementById('uploadPublic')?.checked || false;
    
    if (!title || !content) {
        showToast(t('fillTitleContent'), 'warning');
        return;
    }
    
    // Parse content to count items
    const lines = content.split('\n').filter(line => line.trim());
    const count = lines.length;
    
    // Create new material
    const newMaterial = {
        id: Date.now(),
        title: title,
        author: currentUser ? (currentUser.user_metadata?.username || currentUser.email?.split('@')[0]) : t('guest'),
        count: count,
        content: content,
        category: category,
        isPublic: isPublic,
        isUserMaterial: true,
        createdAt: new Date().toISOString()
    };
    
    userMaterials.push(newMaterial);
    localStorage.setItem('ozgerUserMaterials', JSON.stringify(userMaterials));
    
    showToast(t('materialUploaded'), 'success');
    showLibrary();
    switchLibraryTab('my');
}

// ==================== QUICKLOOK ====================
function openQuicklook(id, isUserMaterial = false) {
    const materials = isUserMaterial ? userMaterials : getAllMaterials();
    const material = materials.find(m => m.id === id);
    if (!material) return;
    
    quicklookMaterial = { ...material, isUserMaterial };
    
    // Update quicklook modal content
    document.getElementById('quicklookTitle').textContent = material.title;
    document.getElementById('quicklookAuthor').textContent = material.author;
    document.getElementById('quicklookCount').textContent = `${material.count} ${t('questions')}`;
    document.getElementById('quicklookIcon').textContent = getCategoryIcon(material.category);
    document.getElementById('quicklookCategory').textContent = t(`cat${capitalize(material.category || 'Other')}`);
    
    // Render preview
    const previewContainer = document.getElementById('quicklookPreview');
    const parsed = parseInput(material.content);
    const previewItems = parsed.slice(0, 5);
    
    let previewHtml = '<div class="preview-list">';
    previewItems.forEach((item, index) => {
        previewHtml += `
            <div class="preview-item">
                <div class="preview-number">${index + 1}.</div>
                <div class="preview-content">
                    <div class="preview-question">${escapeHtml(item.question)}</div>
                    <div class="preview-answer">→ ${escapeHtml(item.answer)}</div>
                </div>
            </div>
        `;
    });
    
    if (parsed.length > 5) {
        previewHtml += `<div class="preview-more">... ${t('andMore')} ${parsed.length - 5} ${t('questions')}</div>`;
    }
    previewHtml += '</div>';
    previewContainer.innerHTML = previewHtml;
    
    // Update favorite button
    updateQuicklookFavoriteBtn();
    
    openModal('quicklookModal');
}

function updateQuicklookFavoriteBtn() {
    if (!quicklookMaterial) return;
    const favId = quicklookMaterial.isUserMaterial ? `user_${quicklookMaterial.id}` : quicklookMaterial.id;
    const isFavorite = favorites.includes(favId);
    
    const favIcon = document.getElementById('quicklookFavIcon');
    const favBtn = document.getElementById('quicklookFavoriteBtn');
    if (favIcon) favIcon.textContent = isFavorite ? '⭐' : '☆';
    if (favBtn) {
        favBtn.querySelector('[data-i18n]')?.setAttribute('data-i18n', isFavorite ? 'removeFromFavorites' : 'addToFavorites');
        const textEl = favBtn.querySelector('[data-i18n]');
        if (textEl) textEl.textContent = t(isFavorite ? 'removeFromFavorites' : 'addToFavorites');
    }
}

function toggleQuicklookFavorite() {
    if (!quicklookMaterial) return;
    toggleFavorite(quicklookMaterial.id, quicklookMaterial.isUserMaterial);
    updateQuicklookFavoriteBtn();
}

function useQuicklookMaterial() {
    if (!quicklookMaterial) return;
    closeModal('quicklookModal');
    document.getElementById('materialInput').value = quicklookMaterial.content;
    showInputSection();
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==================== DELETE MATERIAL ====================
function showDeleteConfirm(id) {
    deleteTargetId = id;
    openModal('confirmDeleteModal');
}

function confirmDeleteMaterial() {
    if (deleteTargetId === null) return;
    
    const index = userMaterials.findIndex(m => m.id === deleteTargetId);
    if (index > -1) {
        userMaterials.splice(index, 1);
        localStorage.setItem('ozgerUserMaterials', JSON.stringify(userMaterials));
        
        // Remove from favorites if present
        const favId = `user_${deleteTargetId}`;
        const favIndex = favorites.indexOf(favId);
        if (favIndex > -1) {
            favorites.splice(favIndex, 1);
            localStorage.setItem('ozgerFavorites', JSON.stringify(favorites));
        }
        
        showToast(t('materialDeleted'), 'success');
        renderLibrary();
        renderFavorites();
    }
    
    deleteTargetId = null;
    closeModal('confirmDeleteModal');
}

// ==================== FAVORITES ====================
function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyFavorites');
    if (!grid || !emptyState) return;
    
    // Get favorites from both library and user materials
    const favoriteMaterials = [];
    
    favorites.forEach(favId => {
        if (typeof favId === 'string' && favId.startsWith('user_')) {
            const id = parseInt(favId.replace('user_', ''));
            const material = userMaterials.find(m => m.id === id);
            if (material) favoriteMaterials.push({ ...material, isUserMaterial: true });
        } else {
            const material = libraryMaterials.find(m => m.id === favId);
            if (material) favoriteMaterials.push({ ...material, isUserMaterial: false });
        }
    });
    
    if (favoriteMaterials.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    grid.innerHTML = favoriteMaterials.map(material => {
        const categoryIcon = getCategoryIcon(material.category);
        return `
            <div class="material-card" onclick="openQuicklook(${material.id}, ${material.isUserMaterial})">
                <div class="material-card-header">
                    <div class="material-card-title">${escapeHtml(material.title)}</div>
                    <div class="material-card-badge">${categoryIcon}</div>
                </div>
                <div class="material-card-meta">
                    <span>👤 ${escapeHtml(material.author)}</span>
                    <span>📝 ${material.count} ${t('questions')}</span>
                </div>
                <div class="material-card-actions" onclick="event.stopPropagation()">
                    <button class="card-action-btn" onclick="useMaterial(${material.id}, ${material.isUserMaterial})">
                        🚀 ${t('useMaterial')}
                    </button>
                    <button class="card-action-btn favorite-active" onclick="toggleFavorite(${material.id}, ${material.isUserMaterial})">
                        ⭐
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== UTILITY FUNCTIONS ====================
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ==================== EVENT LISTENERS ====================
function initEventListeners() {
    // Start button
    document.getElementById('startBtn')?.addEventListener('click', handleStartBtn);
    
    // Hamburger menu
    document.getElementById('hamburgerBtn')?.addEventListener('click', openSidePanelLeft);
    document.getElementById('closePanelLeft')?.addEventListener('click', closeSidePanelLeft);
    
    // User icon
    document.getElementById('userIconBtn')?.addEventListener('click', openSidePanelRight);
    document.getElementById('closePanelRight')?.addEventListener('click', closeSidePanelRight);
    
    // Auth buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => openAuthModal('login'));
    document.getElementById('registerBtn')?.addEventListener('click', () => openAuthModal('register'));
    
    // Menu buttons
    document.getElementById('changeStyleBtn')?.addEventListener('click', () => {
        closeSidePanelLeft();
        openStyleModal();
    });
    document.getElementById('changeLangBtn')?.addEventListener('click', () => {
        closeSidePanelLeft();
        document.querySelectorAll('.lang-card').forEach(card => {
            card.classList.toggle('active', card.dataset.lang === currentLang);
        });
        openModal('langModal');
    });
    document.getElementById('faqBtn')?.addEventListener('click', () => {
        closeSidePanelLeft();
        renderFaqContent();
        openModal('faqModal');
    });
    
    // Style cards
    document.querySelectorAll('.style-card').forEach(card => {
        card.addEventListener('click', () => {
            selectStyle(card.dataset.style);
        });
    });
    document.getElementById('applyStyleBtn')?.addEventListener('click', applySelectedStyle);
    
    // Profile button
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        closeSidePanelRight();
        showProfile();
    });
    
    // My materials
    document.getElementById('myMaterialsBtn')?.addEventListener('click', () => {
        closeSidePanelRight();
        showLibrary();
        setTimeout(() => setLibraryFilter('owner', 'my'), 100);
    });
    
    // Favorites (sidebar)
    document.getElementById('favoritesMenuBtn')?.addEventListener('click', () => {
        closeSidePanelRight();
        showFavorites();
    });
    
    // Guide button
    document.getElementById('guideBtn')?.addEventListener('click', () => {
        closeSidePanelLeft();
        showFaqSection('guide');
        openModal('faqModal');
    });
    
    // Classmates button
    document.getElementById('classmatesBtn')?.addEventListener('click', () => {
        closeSidePanelRight();
        showClassmates();
    });
    
    // Page avatar input
    document.getElementById('pageAvatarInput')?.addEventListener('change', handleAvatarChange);
    
    // Logout
    document.getElementById('logoutMenuBtn')?.addEventListener('click', () => {
        closeSidePanelRight();
        handleLogout();
    });
    
    // Language cards
    document.querySelectorAll('.lang-card').forEach(card => {
        card.addEventListener('click', () => {
            setLanguage(card.dataset.lang);
            showToast(t('languageChanged'), 'success');
            closeModal('langModal');
        });
    });
    
    // Avatar change
    document.getElementById('changeAvatarBtn')?.addEventListener('click', () => {
        document.getElementById('avatarInput')?.click();
    });
    document.getElementById('avatarInput')?.addEventListener('change', handleAvatarChange);
    
    // Library search on enter
    document.getElementById('librarySearch')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchLibrary();
    });
    document.getElementById('librarySearch')?.addEventListener('input', () => {
        // Live search as user types
        searchLibrary();
    });
    
    // Blur overlay click
    document.getElementById('blurOverlay')?.addEventListener('click', () => {
        closeAllSidePanels();
        closeAllModals();
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllSidePanels();
            closeAllModals();
        }
    });
}

// ==================== INITIALIZATION ====================
function init() {
    setTheme(currentTheme);
    setLanguage(currentLang);
    initEventListeners();
    loadSession();
    renderFaqContent();
    
    if (userAvatar) {
        updateAvatarUI(userAvatar);
    }
    
    // Auth state listener
    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                currentUser = session.user;
                if (currentUser.user_metadata?.avatar_url) {
                    userAvatar = currentUser.user_metadata.avatar_url;
                    localStorage.setItem('ozgerAvatar', userAvatar);
                }
            } else {
                currentUser = null;
            }
            updateAuthUI();
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
