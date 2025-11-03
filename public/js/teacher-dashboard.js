// js/teacher-dashboard.js
// Функциональность личного кабинета преподавателя

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

    
    // 2. Кнопка создания лабораторной работы
    const createLabBtn = document.getElementById('create-lab-btn');
    if (createLabBtn) {
        createLabBtn.addEventListener('click', function() {
            console.log('🎯 Кнопка создания лабораторной работы нажата');
            openCreateLabModal();
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

    // 4. Форма создания лабораторной работы
    const labCreateForm = document.getElementById('lab-create-form');
    if (labCreateForm) {
        labCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Форма создания лабораторной работы отправлена');
            createNewLab();
        });
    }
    
    // 3. Закрытие модальных окон
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 4. Закрытие при клике вне окна
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    console.log('✅ Модальные окна инициализированы');
}


// Функция создания новой лабораторной работы
async function createNewLab() {
    const form = document.getElementById('lab-create-form');
    if (!form) {
        console.error('❌ Форма создания лабораторной работы не найдена');
        return;
    }
    
    const formData = new FormData(form);
    const labData = {
        name: formData.get('lab-name'),
        course_id: parseInt(formData.get('lab-course')),
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
    if (!labData.name || !labData.course_id || !labData.description) {
        showAlert('Название, курс и описание обязательны для заполнения', 'error');
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
        await loadTeacherLabs();
        
    } catch (error) {
        console.error('❌ Ошибка создания лабораторной работы:', error);
        showAlert('Ошибка создания лабораторной работы: ' + error.message, 'error');
    }
}

// Функция загрузки лабораторных работ
async function loadTeacherLabs() {
    try {
        console.log('📚 Загрузка лабораторных работ...');
        
        // В реальном приложении здесь будет запрос к API
        // const response = await fetch('/api/teacher/labs', {...});
        
        // Пока используем заглушку
        const labs = [
            {
                id: 1,
                title: 'Лабораторная работа 1: Основы HTML',
                course: 'Веб-технологии',
                start_date: '2025-01-15T00:00:00',
                deadline: '2025-01-22T23:59:00',
                status: 'active',
                submissions: 15,
                checked: 10
            },
            {
                id: 2,
                title: 'Лабораторная работа 2: CSS стилизация',
                course: 'Веб-технологии',
                start_date: '2025-01-23T00:00:00',
                deadline: '2025-01-30T23:59:00',
                status: 'upcoming',
                submissions: 0,
                checked: 0
            }
        ];
        
        displayTeacherLabs(labs);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки лабораторных работ:', error);
    }
}

// Функция отображения лабораторных работ
function displayTeacherLabs(labs) {
    const container = document.querySelector('.labs-list');
    
    if (!container) {
        console.error('❌ Контейнер лабораторных работ не найден');
        return;
    }
    
    if (!labs || labs.length === 0) {
        container.innerHTML = `
            <div class="no-labs">
                <p>Лабораторные работы не найдены</p>
                <p>Создайте первую лабораторную работу</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = labs.map(lab => `
        <div class="lab-card" data-lab-id="${lab.id}">
            <div class="lab-header">
                <h4 class="lab-title">${lab.title}</h4>
                <span class="lab-status status-${lab.status}">
                    ${getLabStatusText(lab.status)}
                </span>
            </div>
            <div class="lab-meta">
                <span><strong>Курс:</strong> ${lab.course}</span>
                <span><strong>Начало:</strong> ${formatDate(lab.start_date)}</span>
                <span><strong>Дедлайн:</strong> ${formatDate(lab.deadline)}</span>
            </div>
            <div class="lab-stats">
                <span>Сдано работ: ${lab.submissions}</span>
                <span>Проверено: ${lab.checked}</span>
            </div>
            <div class="lab-actions">
                <button class="btn btn-secondary btn-sm edit-lab" data-lab-id="${lab.id}">
                    Редактировать
                </button>
                <button class="btn btn-primary btn-sm view-submissions" data-lab-id="${lab.id}">
                    Проверить работы
                </button>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Лабораторные работы отображены');
}

// Вспомогательные функции
function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
}

function getLabStatusText(status) {
    const statusMap = {
        'active': 'Активна',
        'upcoming': 'Скоро начнется',
        'completed': 'Завершена',
        'draft': 'Черновик'
    };
    return statusMap[status] || status;
}

async function loadTeacherTabData(tabId) {
    console.log('📂 Загрузка данных для вкладки:', tabId);
    
    switch(tabId) {
        case 'disciplines':
            await loadTeacherCourses();
            break;
        case 'assign-tasks':
            await loadTeacherLabs();
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

// Создание нового курса
async function createNewCourse() {
    const form = document.getElementById('course-create-form');
    if (!form) {
        console.error('❌ Форма создания курса не найдена');
        return;
    }
    
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
                <button class="btn btn-outline btn-sm view-labs" data-course-id="${course.id}">
                    Лабораторные работы
                </button>
                <button class="btn btn-outline btn-sm view-students" data-course-id="${course.id}">
                    Студенты
                </button>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Курсы отображены');
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
async function loadTeacherLabs() {
    console.log('📚 Загрузка лабораторных работ...');
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

// Тестовая функция для проверки кнопки
function testButton() {
    const btn = document.getElementById('create-course-btn');
    if (btn) {
        console.log('✅ Кнопка найдена, добавляем тестовый обработчик');
        btn.onclick = function() {
            console.log('🎯 Тест: кнопка работает!');
            alert('Кнопка создания курса работает!');
        };
    } else {
        console.error('❌ Кнопка не найдена');
    }
}

// Запускаем тест через секунду после загрузки
setTimeout(testButton, 1000);