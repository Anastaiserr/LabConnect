// js/teacher-dashboard.js
// Функциональность личного кабинета преподавателя

let currentCourseId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ teacher-dashboard.js загружен');
    initTeacherDashboard();
});

async function initTeacherDashboard() {
    console.log('🎯 Инициализация личного кабинета преподавателя');
    
    // Инициализация вкладок
    initTeacherTabs();
    
    // Инициализация модальных окон
    initTeacherModals();
    
    // Загрузка данных преподавателя
    await loadTeacherData();
    
    // Загружаем курсы если активна соответствующая вкладка
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'disciplines') {
        console.log('📚 Загружаем курсы...');
        await loadTeacherCourses();
    }
    
    console.log('✅ Личный кабинет преподавателя инициализирован');
}

function initTeacherTabs() {
    console.log('🔧 Инициализация вкладок');
    
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const tabId = this.getAttribute('data-tab');
            console.log('🔄 Переключение на вкладку:', tabId);
            
            // Убрать активный класс со всех ссылок и вкладок
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Добавить активный класс к текущей ссылке
            this.classList.add('active');
            
            // Показать соответствующую вкладку
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Загрузить данные для вкладки
            loadTeacherTabData(tabId);
        });
    });
}

function initTeacherModals() {
    console.log('🔧 Инициализация модальных окон');
    
    // 1. Кнопка создания курса
    const createCourseBtn = document.getElementById('create-course-btn');
    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', function() {
            console.log('🎯 Кнопка создания курса нажата');
            document.getElementById('create-course-modal').style.display = 'block';
        });
    }
    
    // 2. Форма создания курса
    const courseCreateForm = document.getElementById('course-create-form');
    if (courseCreateForm) {
        courseCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Форма создания курса отправлена');
            createNewCourse();
        });
    }
    
    // 3. Кнопка создания лабораторной работы в модальном окне управления курсом
    const createLabBtn = document.getElementById('create-lab-btn');
    if (createLabBtn) {
        createLabBtn.addEventListener('click', function() {
            console.log('🎯 Кнопка создания лабораторной работы нажата');
            openCreateLabModal();
        });
    }
    
    // 4. Форма создания лабораторной работы
    const labCreateForm = document.getElementById('lab-create-form');
    if (labCreateForm) {
        labCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Форма создания лабораторной работы отправлена');
            createNewLab();
        });
    }
    
    // 5. Инициализация вкладок в модальном окне управления курсом
    initCourseManagementTabs();
    
    // Закрытие модальных окон
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Закрытие при клике вне окна
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    console.log('✅ Модальные окна инициализированы');
}

function initCourseManagementTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.course-management-tabs .tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Убрать активный класс со всех кнопок и вкладок
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Добавить активный класс к текущей кнопке
            this.classList.add('active');
            
            // Показать соответствующую вкладку
            document.getElementById(tabId + '-tab').classList.add('active');
            
            // Загрузить данные для вкладки
            if (tabId === 'labs' && currentCourseId) {
                loadCourseLabs(currentCourseId);
            }
        });
    });
}

async function loadTeacherTabData(tabId) {
    console.log('📂 Загрузка данных для вкладки:', tabId);
    
    switch(tabId) {
        case 'disciplines':
            await loadTeacherCourses();
            break;
        case 'check-works':
            await loadWorksToCheck();
            break;
        case 'statements':
            loadStatementData();
            break;
        case 'settings':
            loadSettingsData();
            break;
        case 'chat':
            loadTeacherChats();
            break;
    }
}

async function loadTeacherData() {
    try {
        console.log('👤 Загрузка данных преподавателя...');
        const response = await fetch('/api/user', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Данные преподавателя загружены:', data.user);
            
            // Обновляем данные на странице
            if (data.user) {
                document.getElementById('teacher-name').textContent = data.user.firstName + ' ' + data.user.lastName;
                document.getElementById('teacher-department').textContent = 'Кафедра: ' + (data.user.department || 'Не указана');
                
                // Обновляем данные в профиле
                document.getElementById('teacher-firstname').textContent = data.user.firstName;
                document.getElementById('teacher-lastname').textContent = data.user.lastName;
                document.getElementById('teacher-email').textContent = data.user.email;
                document.getElementById('teacher-department-detail').textContent = data.user.department || 'Не указана';
                document.getElementById('teacher-position').textContent = data.user.position || 'Не указана';
            }
        } else {
            console.error('❌ Ошибка загрузки данных пользователя');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных преподавателя:', error);
    }
}

// Загрузка курсов преподавателя
async function loadTeacherCourses() {
    try {
        const coursesList = document.getElementById('courses-list');
        
        console.log('🔄 Загрузка курсов преподавателя...');
        
        if (!coursesList) {
            console.error('❌ Элемент courses-list не найден');
            return;
        }
        
        // Показываем загрузку
        coursesList.innerHTML = '<div class="loading">Загрузка курсов...</div>';
        
        const response = await fetch('/api/teacher/courses', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log('📊 Статус ответа:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Получены курсы:', result);
        
        if (result.courses && result.courses.length > 0) {
            displayTeacherCourses(result.courses);
        } else {
            coursesList.innerHTML = `
                <div class="no-courses">
                    <h4>Курсы не найдены</h4>
                    <p>У вас пока нет созданных курсов</p>
                    <p>Создайте первый курс, нажав кнопку "Создать новый курс"</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки курсов:', error);
        const coursesList = document.getElementById('courses-list');
        if (coursesList) {
            coursesList.innerHTML = `
                <div class="error-message">
                    <h4>Ошибка загрузки</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-secondary" onclick="loadTeacherCourses()">Повторить попытку</button>
                </div>
            `;
        }
    }
}

// Отображение курсов
function displayTeacherCourses(courses) {
    const container = document.getElementById('courses-list');
    
    if (!container) {
        console.error('❌ Контейнер курсов не найден');
        return;
    }
    
    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <p>У вас пока нет созданных курсов</p>
                <p>Создайте первый курс, нажав кнопку "Создать новый курс"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-header">
                <h4 class="course-title">${course.name}</h4>
                <div class="course-actions">
                    <button class="btn btn-secondary btn-sm edit-course" data-course-id="${course.id}">
                        Редактировать
                    </button>
                    <button class="btn btn-primary btn-sm manage-course" data-course-id="${course.id}">
                        Управление
                    </button>
                </div>
            </div>
            <div class="course-meta">
                <span><strong>Дисциплина:</strong> ${course.discipline}</span>
                ${course.description ? `<span><strong>Описание:</strong> ${course.description}</span>` : ''}
                <span><strong>Создан:</strong> ${formatDate(course.created_at)}</span>
                ${course.password ? `<span><strong>Пароль доступа:</strong> ${course.password}</span>` : ''}
            </div>
            <div class="course-stats">
                <span>Лабораторных работ: <strong id="lab-count-${course.id}">0</strong></span>
                <span>Студентов: <strong>0</strong></span>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики событий для кнопок
    addCourseEventHandlers();
    
    // Загружаем количество лабораторных работ для каждого курса
    courses.forEach(course => {
        loadCourseLabsCount(course.id);
    });
}

// Загрузка количества лабораторных работ для курса
async function loadCourseLabsCount(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/labs/count`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const countElement = document.getElementById(`lab-count-${courseId}`);
            if (countElement) {
                countElement.textContent = result.count || 0;
            }
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки количества лабораторных работ:', error);
    }
}

// Обработчики событий для кнопок курсов
function addCourseEventHandlers() {
    // Кнопка "Управление"
    document.querySelectorAll('.manage-course').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            openCourseManagement(courseId);
        });
    });
    
    // Кнопка "Редактировать"
    document.querySelectorAll('.edit-course').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            editCourse(courseId);
        });
    });
}

// Открытие управления курсом
async function openCourseManagement(courseId) {
    currentCourseId = courseId;
    
    try {
        // Загружаем информацию о курсе
        const response = await fetch(`/api/courses/${courseId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const course = result.course;
            
            // Обновляем заголовок модального окна
            document.getElementById('manage-course-title').textContent = `Управление курсом: ${course.name}`;
            
            // Показываем модальное окно
            document.getElementById('manage-course-modal').style.display = 'block';
            
            // Загружаем лабораторные работы курса
            await loadCourseLabs(courseId);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных курса:', error);
        showAlert('Ошибка загрузки данных курса', 'error');
    }
}

// Загрузка лабораторных работ курса
async function loadCourseLabs(courseId) {
    try {
        const labsList = document.getElementById('course-labs-list');
        
        if (!labsList) return;
        
        labsList.innerHTML = '<div class="loading">Загрузка лабораторных работ...</div>';
        
        const response = await fetch(`/api/courses/${courseId}/labs`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displayCourseLabs(result.labs || []);
        } else {
            throw new Error('Ошибка загрузки лабораторных работ');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки лабораторных работ:', error);
        const labsList = document.getElementById('course-labs-list');
        if (labsList) {
            labsList.innerHTML = `
                <div class="error-message">
                    <p>Ошибка загрузки лабораторных работ: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Отображение лабораторных работ курса
function displayCourseLabs(labs) {
    const container = document.getElementById('course-labs-list');
    
    if (!container) return;
    
    if (!labs || labs.length === 0) {
        container.innerHTML = `
            <div class="no-labs">
                <p>Лабораторные работы не найдены</p>
                <p>Создайте первую лабораторную работу для этого курса</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = labs.map(lab => `
        <div class="lab-card" data-lab-id="${lab.id}">
            <div class="lab-header">
                <h4 class="lab-title">${lab.title}</h4>
                <span class="lab-status status-${getLabStatus(lab)}">
                    ${getLabStatusText(getLabStatus(lab))}
                </span>
            </div>
            <div class="lab-meta">
                <span><strong>Начало:</strong> ${formatDateTime(lab.start_date)}</span>
                <span><strong>Дедлайн:</strong> ${formatDateTime(lab.deadline)}</span>
                <span><strong>Макс. балл:</strong> ${lab.max_score}</span>
            </div>
            <div class="lab-description">
                <p>${lab.description}</p>
            </div>
            <div class="lab-actions">
                <button class="btn btn-secondary btn-sm edit-lab" data-lab-id="${lab.id}">
                    Редактировать
                </button>
                <button class="btn btn-primary btn-sm view-submissions" data-lab-id="${lab.id}">
                    Работы студентов
                </button>
                <button class="btn btn-danger btn-sm delete-lab" data-lab-id="${lab.id}">
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
}

// Функция для открытия модального окна создания лабораторной работы
function openCreateLabModal() {
    const modal = document.getElementById('create-lab-modal');
    
    if (!currentCourseId) {
        showAlert('Ошибка: курс не выбран', 'error');
        return;
    }
    
    // Устанавливаем текущую дату и время по умолчанию
    const now = new Date();
    const startDate = new Date(now.getTime() + 60 * 60 * 1000); // +1 час
    const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 дней
    
    document.getElementById('lab-start-date').value = formatDateTimeLocal(startDate);
    document.getElementById('lab-deadline').value = formatDateTimeLocal(deadline);
    
    modal.style.display = 'block';
}

// Функция создания новой лабораторной работы
async function createNewLab() {
    const form = document.getElementById('lab-create-form');
    if (!form) {
        console.error('❌ Форма создания лабораторной работы не найдена');
        return;
    }
    
    if (!currentCourseId) {
        showAlert('Ошибка: курс не выбран', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const labData = {
        name: formData.get('lab-name'),
        course_id: currentCourseId,
        description: formData.get('lab-description'),
        template_code: formData.get('lab-template') || null,
        start_date: formData.get('lab-start-date'),
        deadline: formData.get('lab-deadline'),
        max_score: parseInt(formData.get('lab-max-score')),
        attempts: parseInt(formData.get('lab-attempts')),
        requirements: formData.get('lab-requirements') || null
    };
    
    console.log('🔄 Создание лабораторной работы:', labData);
    
    // Валидация
    if (!labData.name || !labData.description) {
        showAlert('Название и описание обязательны для заполнения', 'error');
        return;
    }
    
    // Проверка дат
    const startDate = new Date(labData.start_date);
    const deadline = new Date(labData.deadline);
    
    if (deadline <= startDate) {
        showAlert('Дедлайн должен быть позже даты начала', 'error');
        return;
    }

    try {
        const response = await fetch('/api/labs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(labData)
        });

        console.log('📊 Статус создания лабораторной работы:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания лабораторной работы');
        }

        const result = await response.json();
        console.log('✅ Лабораторная работа создана:', result);
        
        showAlert(result.message, 'success');
        document.getElementById('create-lab-modal').style.display = 'none';
        form.reset();
        
        // Перезагружаем список лабораторных работ
        await loadCourseLabs(currentCourseId);
        await loadCourseLabsCount(currentCourseId);
        
    } catch (error) {
        console.error('❌ Ошибка создания лабораторной работы:', error);
        showAlert('Ошибка создания лабораторной работы: ' + error.message, 'error');
    }
}

// Создание нового курса
async function createNewCourse() {
    const form = document.getElementById('course-create-form');
    const formData = new FormData(form);
    
    const courseData = {
        name: formData.get('course-name'),
        description: formData.get('course-description'),
        discipline: formData.get('course-discipline'),
        password: formData.get('course-password') || null
    };
    
    console.log('🔄 Создание курса:', courseData);
    
    // Валидация
    if (!courseData.name || !courseData.discipline) {
        showAlert('Название и дисциплина обязательны для заполнения', 'error');
        return;
    }

    try {
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(courseData)
        });

        console.log('📊 Статус создания курса:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания курса');
        }

        const result = await response.json();
        console.log('✅ Курс создан:', result);
        
        showAlert(result.message, 'success');
        document.getElementById('create-course-modal').style.display = 'none';
        form.reset();
        
        // Перезагружаем список курсов
        await loadTeacherCourses();
        
    } catch (error) {
        console.error('❌ Ошибка создания курса:', error);
        showAlert('Ошибка создания курса: ' + error.message, 'error');
    }
}

// Вспомогательные функции
function formatDate(dateString) {
    if (!dateString) return 'Не указано';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return 'Неверная дата';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'Не указано';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    } catch (e) {
        return 'Неверная дата';
    }
}

function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
}

function getLabStatus(lab) {
    const now = new Date();
    const startDate = new Date(lab.start_date);
    const deadline = new Date(lab.deadline);
    
    if (now < startDate) return 'upcoming';
    if (now > deadline) return 'completed';
    return 'active';
}

function getLabStatusText(status) {
    const statusMap = {
        'active': 'Активна',
        'upcoming': 'Скоро начнется',
        'completed': 'Завершена'
    };
    return statusMap[status] || status;
}

function showAlert(message, type = 'info') {
    console.log(`📢 Уведомление [${type}]:`, message);
    
    // Удаляем существующие уведомления
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    alert.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Заглушки для остальных функций
function editCourse(courseId) {
    console.log('✏️ Редактирование курса:', courseId);
    showAlert('Функция редактирования курса в разработке', 'info');
}

async function loadWorksToCheck() {
    console.log('📝 Загрузка работ для проверки...');
}

function loadStatementData() {
    console.log('📊 Загрузка данных для ведомостей...');
}

function loadSettingsData() {
    console.log('⚙️ Загрузка настроек...');
}

function loadTeacherChats() {
    console.log('💬 Загрузка чатов...');
}