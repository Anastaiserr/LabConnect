// js/student-dashboard.js
// Функциональность личного кабинета студента

// js/student-dashboard.js
// Функциональность личного кабинета студента

document.addEventListener('DOMContentLoaded', function() {
    initStudentDashboard();
});

async function initStudentDashboard() {
    // Инициализация вкладок
    initTabs();
    
    // Загрузка данных студента
    await loadStudentData();
    
    // Загрузка заданий
    loadStudentTasks();
    
    // Инициализация календаря
    initCalendar();
    
    // Инициализация модальных окон уже в main.js
}

function initTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Убрать активный класс со всех ссылок и вкладок
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Добавить активный класс к текущей ссылке
            this.classList.add('active');
            
            // Показать соответствующую вкладку
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Загрузить данные для вкладки при необходимости
            loadTabData(tabId);
        });
    });
}

async function loadStudentData() {
    try {
        const response = await API.getCurrentUser();
        if (response.user) {
            const user = response.user;
            
            // Заполнение данных в профиле реальными данными
            document.getElementById('student-name').textContent = user.firstName + ' ' + user.lastName;
            document.getElementById('user-group').textContent = 'Группа: ' + (user.group || 'Не указана');
            document.getElementById('profile-firstname').textContent = user.firstName;
            document.getElementById('profile-lastname').textContent = user.lastName;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-group').textContent = user.group || 'Не указана';
            document.getElementById('profile-faculty').textContent = user.faculty || 'Не указан';
        }
    } catch (error) {
        console.error('Ошибка загрузки данных студента:', error);
        // Если не авторизован, перенаправляем на вход
        window.location.href = 'login.html';
    }
}

// Остальные функции остаются без изменений...

function loadStudentTasks() {
    // В реальном приложении здесь будет запрос к API
    const tasks = [
        {
            id: 1,
            title: 'Лабораторная работа 1: Основы HTML',
            course: 'Веб-технологии',
            deadline: '2025-06-10',
            status: 'completed',
            score: 9,
            maxScore: 10
        },
        {
            id: 2,
            title: 'Лабораторная работа 2: CSS стилизация',
            course: 'Веб-технологии',
            deadline: '2025-06-17',
            status: 'pending',
            score: null,
            maxScore: 10
        },
        {
            id: 3,
            title: 'Лабораторная работа 3: JavaScript основы',
            course: 'Веб-технологии',
            deadline: '2025-06-24',
            status: 'active',
            score: null,
            maxScore: 10
        },
        {
            id: 4,
            title: 'Лабораторная работа 1: Алгоритмы сортировки',
            course: 'Алгоритмы и структуры данных',
            deadline: '2025-06-05',
            status: 'overdue',
            score: null,
            maxScore: 10
        }
    ];
    
    displayTasks(tasks);
}

function displayTasks(tasks) {
    const container = document.getElementById('tasks-container');
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="no-data">Нет заданий</p>';
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="task-card" data-task-id="${task.id}">
            <div class="task-header">
                <h4 class="task-title">${task.title}</h4>
                <span class="task-status status-${task.status}">
                    ${getStatusText(task.status)}
                </span>
            </div>
            <div class="task-meta">
                <span>Курс: ${task.course}</span>
                <span>Дедлайн: ${formatDate(task.deadline)}</span>
                ${task.score ? `<span>Оценка: ${task.score}/${task.maxScore}</span>` : ''}
            </div>
            <div class="task-actions">
                ${task.status === 'active' ? `
                    <button class="btn btn-primary btn-sm start-task" data-task-id="${task.id}">
                        Начать выполнение
                    </button>
                ` : ''}
                ${task.status === 'completed' ? `
                    <button class="btn btn-secondary btn-sm view-result" data-task-id="${task.id}">
                        Посмотреть результат
                    </button>
                ` : ''}
                ${task.status === 'pending' ? `
                    <button class="btn btn-secondary btn-sm" disabled>
                        Ожидает проверки
                    </button>
                ` : ''}
                ${task.status === 'overdue' ? `
                    <button class="btn btn-warning btn-sm submit-late" data-task-id="${task.id}">
                        Сдать позже
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    // Добавление обработчиков событий для кнопок
    addTaskEventHandlers();
}

function addTaskEventHandlers() {
    // Обработчик для кнопки "Начать выполнение"
    document.querySelectorAll('.start-task').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task-id');
            openTask(taskId);
        });
    });
    
    // Обработчик для кнопки "Посмотреть результат"
    document.querySelectorAll('.view-result').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task-id');
            viewTaskResult(taskId);
        });
    });
    
    // Обработчик для кнопки "Сдать позже"
    document.querySelectorAll('.submit-late').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task-id');
            submitLateWork(taskId);
        });
    });
}

function openTask(taskId) {
    // В реальном приложении здесь будет переход к заданию
    showAlert('Открытие задания...', 'info');
    
    // Симуляция открытия модального окна с заданием
    setTimeout(() => {
        document.getElementById('submit-work-modal').style.display = 'block';
    }, 500);
}

function viewTaskResult(taskId) {
    // В реальном приложении здесь будет показ результата
    showAlert('Просмотр результата задания...', 'info');
}

function submitLateWork(taskId) {
    // В реальном приложении здесь будет отправка запроса на сдачу позже
    showAlert('Запрос на сдачу работы отправлен преподавателю', 'warning');
}

function initCalendar() {
    // Инициализация календаря
    const calendar = document.getElementById('calendar-widget');
    const currentMonthElement = document.getElementById('current-month');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    let currentDate = new Date();
    
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Обновление отображаемого месяца
        currentMonthElement.textContent = currentDate.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Генерация календаря
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        let calendarHTML = '<div class="calendar-grid">';
        
        // Заголовки дней недели
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day header">${day}</div>`;
        });
        
        // Пустые ячейки перед первым днем месяца
        for (let i = 0; i < (startingDay === 0 ? 6 : startingDay - 1); i++) {
            calendarHTML += '<div class="calendar-day other-month"></div>';
        }
        
        // Дни месяца
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const dayClass = isToday ? 'calendar-day today' : 'calendar-day';
            
            calendarHTML += `<div class="${dayClass}">${day}`;
            
            // Добавление событий (заданий с дедлайнами)
            if (day === 10 || day === 17 || day === 24) {
                calendarHTML += `<div class="calendar-event">ЛР по веб-технологиям</div>`;
            }
            
            calendarHTML += '</div>';
        }
        
        calendarHTML += '</div>';
        calendar.innerHTML = calendarHTML;
    }
    
    // Обработчики для кнопок навигации
    prevBtn.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextBtn.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Первоначальная отрисовка
    renderCalendar();
}

function initModals() {
    // Инициализация модальных окон
    const editProfileBtn = document.getElementById('edit-profile');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const submitWorkModal = document.getElementById('submit-work-modal');
    
    // Обработчик для редактирования профиля
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            openEditProfileModal();
        });
    }
    
    // Закрытие модальных окон при клике на крестик
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Закрытие модальных окон при клике вне окна
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Обработчик формы редактирования профиля
    const profileEditForm = document.getElementById('profile-edit-form');
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }
    
    // Обработчик отмены редактирования
    const cancelEditBtn = document.getElementById('cancel-edit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            editProfileModal.style.display = 'none';
        });
    }
    
    // Обработчик формы сдачи работы
    const workSubmitForm = document.getElementById('work-submit-form');
    if (workSubmitForm) {
        workSubmitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitWork();
        });
    }
    
    // Обработчик отмены сдачи работы
    const cancelSubmitBtn = document.getElementById('cancel-submit');
    if (cancelSubmitBtn) {
        cancelSubmitBtn.addEventListener('click', function() {
            submitWorkModal.style.display = 'none';
        });
    }
}

function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    
    // Заполнение формы текущими данными
    document.getElementById('edit-firstname').value = document.getElementById('profile-firstname').textContent;
    document.getElementById('edit-lastname').value = document.getElementById('profile-lastname').textContent;
    document.getElementById('edit-email').value = document.getElementById('profile-email').textContent;
    document.getElementById('edit-group').value = document.getElementById('profile-group').textContent;
    
    modal.style.display = 'block';
}

function saveProfileChanges() {
    const formData = new FormData(document.getElementById('profile-edit-form'));
    
    // Обновление данных в интерфейсе
    document.getElementById('profile-firstname').textContent = formData.get('edit-firstname');
    document.getElementById('profile-lastname').textContent = formData.get('edit-lastname');
    document.getElementById('profile-email').textContent = formData.get('edit-email');
    document.getElementById('profile-group').textContent = formData.get('edit-group');
    document.getElementById('student-name').textContent = formData.get('edit-firstname') + ' ' + formData.get('edit-lastname');
    
    // Закрытие модального окна
    document.getElementById('edit-profile-modal').style.display = 'none';
    
    showAlert('Профиль успешно обновлен', 'success');
}

function submitWork() {
    const filesInput = document.getElementById('work-files');
    const comment = document.getElementById('work-comment').value;
    
    if (filesInput.files.length === 0) {
        showAlert('Пожалуйста, прикрепите файлы с выполненной работой', 'error');
        return;
    }
    
    // Симуляция отправки работы
    showAlert('Работа отправлена на проверку', 'success');
    
    // Закрытие модального окна
    document.getElementById('submit-work-modal').style.display = 'none';
    
    // Очистка формы
    filesInput.value = '';
    document.getElementById('work-comment').value = '';
}

function loadTabData(tabId) {
    switch(tabId) {
        case 'available-tasks':
            loadAvailableTasks();
            break;
        case 'submitted-works':
            loadSubmittedWorks();
            break;
        case 'chat':
            loadChats();
            break;
        case 'courses':
            loadStudentCourses();
            break;
        case 'my-courses':
            loadStudentCourses();
            break;
        case 'available-tasks':
            loadAvailableTasks();
            break;
        case 'my-tasks':
            loadStudentTasks();
            break;
    }
}
// Добавьте новые функции
async function loadStudentCourses() {
    try {
        const container = document.getElementById('student-courses-list');
        container.innerHTML = '<div class="loading">Загрузка курсов...</div>';
        
        const response = await fetch('/api/student/courses', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displayStudentCourses(result.courses || []);
        } else {
            throw new Error('Ошибка загрузки курсов');
        }
    } catch (error) {
        console.error('Ошибка загрузки курсов студента:', error);
        document.getElementById('student-courses-list').innerHTML = 
            '<div class="error-message">Ошибка загрузки курсов</div>';
    }
}

async function searchCourses() {
    const query = document.getElementById('course-search').value.trim();
    
    if (!query) {
        showAlert('Введите поисковый запрос', 'warning');
        return;
    }
    
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '<div class="loading">Поиск курсов...</div>';
    
    try {
        const response = await fetch(`/api/courses/search?query=${encodeURIComponent(query)}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displaySearchResults(result.courses || []);
        } else {
            throw new Error('Ошибка поиска');
        }
    } catch (error) {
        console.error('Ошибка поиска курсов:', error);
        resultsContainer.innerHTML = '<div class="error-message">Ошибка поиска курсов</div>';
    }
}

// Обновите функцию displaySearchResults
function displaySearchResults(courses) {
    const container = document.getElementById('search-results');
    
    if (courses.length === 0) {
        container.innerHTML = '<div class="no-data">Курсы не найдены</div>';
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="course-card search-result" data-course-id="${course.id}">
            <div class="course-header">
                <h4 class="course-title">${course.name}</h4>
                <span class="course-protection">
                    ${course.password ? '🔒 Защищен паролем' : '🔓 Открытый доступ'}
                </span>
            </div>
            <div class="course-meta">
                <span><strong>Дисциплина:</strong> ${course.discipline}</span>
                <span><strong>Преподаватель:</strong> ${course.teacher_first_name} ${course.teacher_last_name}</span>
                ${course.description ? `<span><strong>Описание:</strong> ${course.description}</span>` : ''}
            </div>
            <div class="course-actions">
                <button class="btn btn-primary btn-sm enroll-course" data-course-id="${course.id}">
                    Записаться на курс
                </button>
            </div>
        </div>
    `).join('');
    
    addSearchResultsEventHandlers();
}

// Отображение курсов студента
function displayStudentCourses(courses) {
    const container = document.getElementById('student-courses-list');
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <p>Вы еще не записаны ни на один курс</p>
                <p><a href="student-courses.html" class="btn btn-primary">Найти курсы</a></p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="course-card enrolled" data-course-id="${course.id}">
            <div class="course-header">
                <h4 class="course-title">${course.name}</h4>
                <span class="enrollment-status">Записан</span>
            </div>
            <div class="course-meta">
                <span><strong>Дисциплина:</strong> ${course.discipline}</span>
                <span><strong>Преподаватель:</strong> ${course.teacher_first_name} ${course.teacher_last_name}</span>
                ${course.description ? `<span><strong>Описание:</strong> ${course.description}</span>` : ''}
            </div>
            <div class="course-actions">
                <button class="btn btn-primary btn-sm open-course" data-course-id="${course.id}">
                    Открыть курс
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок
    document.querySelectorAll('.open-course').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            openCourseDetails(courseId);
        });
    });
}

// Открытие деталей курса с лабораторными работами
async function openCourseDetails(courseId) {
    try {
        // Загружаем лабораторные работы курса
        const response = await fetch(`/api/courses/${courseId}/labs`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            showCourseLabsModal(courseId, result.labs || []);
        } else {
            throw new Error('Ошибка загрузки лабораторных работ');
        }
    } catch (error) {
        console.error('Ошибка открытия курса:', error);
        showAlert('Ошибка загрузки курса: ' + error.message, 'error');
    }
}

// Модальное окно с лабораторными работами курса
function showCourseLabsModal(courseId, labs) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Лабораторные работы курса</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="labs-list" id="course-labs-list">
                    ${labs.length === 0 ? 
                        '<div class="no-labs">Лабораторные работы пока не добавлены</div>' : 
                        labs.map(lab => `
                            <div class="lab-card" data-lab-id="${lab.id}">
                                <div class="lab-header">
                                    <h4 class="lab-title">${lab.title}</h4>
                                    <span class="lab-status status-${getLabStatus(lab)}">
                                        ${getLabStatusText(lab)}
                                    </span>
                                </div>
                                <div class="lab-meta">
                                    <span><strong>Дедлайн:</strong> ${formatDateTime(lab.deadline)}</span>
                                    <span><strong>Макс. балл:</strong> ${lab.max_score}</span>
                                </div>
                                <div class="lab-description">
                                    <p>${lab.description}</p>
                                </div>
                                <div class="lab-actions">
                                    <button class="btn btn-primary btn-sm start-lab" data-lab-id="${lab.id}">
                                        Приступить к выполнению
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики событий
    modal.querySelector('.close').addEventListener('click', () => {
        modal.remove();
    });
    
    // Обработчики для кнопок начала выполнения
    modal.querySelectorAll('.start-lab').forEach(btn => {
        btn.addEventListener('click', function() {
            const labId = this.getAttribute('data-lab-id');
            modal.remove();
            openLabWorkModal(labId);
        });
    });
    
    // Закрытие при клике вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            modal.remove();
        }
    });
}

// Вспомогательные функции для статусов лабораторных работ
function getLabStatus(lab) {
    if (!lab.deadline) return 'active';
    
    const now = new Date();
    const deadline = new Date(lab.deadline);
    
    if (now > deadline) return 'completed';
    return 'active';
}

function getLabStatusText(lab) {
    const status = getLabStatus(lab);
    const statusMap = {
        'active': 'Активна',
        'completed': 'Завершена',
        'upcoming': 'Скоро начнется'
    };
    return statusMap[status] || status;
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

// Модальное окно выполнения лабораторной работы
function openLabWorkModal(labId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Выполнение лабораторной работы</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="lab-submit-form">
                    <input type="hidden" id="lab-id" value="${labId}">
                    
                    <div class="form-group">
                        <label for="lab-files">Прикрепить файлы</label>
                        <input type="file" id="lab-files" name="lab-files" class="form-control" multiple 
                               accept=".pdf,.doc,.docx,.zip,.rar,.txt,.cpp,.java,.py,.html,.css,.js,.php">
                        <small class="form-text">Можно прикрепить несколько файлов</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="lab-code">Код (если требуется)</label>
                        <textarea id="lab-code" name="lab-code" class="form-control" rows="10" 
                                  placeholder="Вставьте ваш код здесь..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="lab-comment">Комментарий к работе</label>
                        <textarea id="lab-comment" name="lab-comment" class="form-control" rows="4" 
                                  placeholder="Опишите особенности вашего решения..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">Отмена</button>
                        <button type="submit" class="btn btn-primary">Отправить на проверку</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики событий
    const form = modal.querySelector('#lab-submit-form');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const closeBtn = modal.querySelector('.close');
    
    form.addEventListener('submit', handleLabSubmission);
    cancelBtn.addEventListener('click', () => modal.remove());
    closeBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            modal.remove();
        }
    });
}

// Обработка отправки лабораторной работы
async function handleLabSubmission(e) {
    e.preventDefault();
    
    const labId = document.getElementById('lab-id').value;
    const code = document.getElementById('lab-code').value;
    const comment = document.getElementById('lab-comment').value;
    const filesInput = document.getElementById('lab-files');
    
    // Проверяем, что что-то прикреплено
    if (filesInput.files.length === 0 && !code.trim()) {
        showAlert('Пожалуйста, прикрепите файлы или введите код', 'error');
        return;
    }
    
    try {
        // Собираем имена файлов
        const fileNames = Array.from(filesInput.files).map(file => file.name).join(', ');
        
        const response = await fetch(`/api/labs/${labId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                files: fileNames,
                code: code,
                comment: comment
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            
            // Закрываем модальное окно
            document.querySelector('.modal').remove();
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
    } catch (error) {
        console.error('Ошибка отправки работы:', error);
        showAlert('Ошибка отправки работы: ' + error.message, 'error');
    }
}

function loadAvailableTasks() {
    // В реальном приложении здесь будет запрос к API
    const courses = [
        {
            id: 1,
            name: 'Веб-технологии',
            teacher: 'Измайлов Н.Н.',
            labs: [
                { id: 1, title: 'ЛР1: Основы HTML', deadline: '2025-06-10' },
                { id: 2, title: 'ЛР2: CSS стилизация', deadline: '2025-06-17' },
                { id: 3, title: 'ЛР3: JavaScript основы', deadline: '2025-06-24' }
            ]
        },
        {
            id: 2,
            name: 'Алгоритмы и структуры данных',
            teacher: 'Петров А.В.',
            labs: [
                { id: 4, title: 'ЛР1: Алгоритмы сортировки', deadline: '2025-06-05' },
                { id: 5, title: 'ЛР2: Деревья поиска', deadline: '2025-06-12' }
            ]
        }
    ];
    
    displayAvailableTasks(courses);
}

function displayAvailableTasks(courses) {
    const container = document.querySelector('.courses-list');
    
    container.innerHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-header">
                <h4 class="course-title">${course.name}</h4>
                <span class="course-teacher">${course.teacher}</span>
            </div>
            <div class="course-labs">
                <h5>Лабораторные работы:</h5>
                ${course.labs.map(lab => `
                    <div class="lab-item">
                        <span class="lab-title">${lab.title}</span>
                        <span class="lab-deadline">До: ${formatDate(lab.deadline)}</span>
                        <button class="btn btn-primary btn-sm start-lab" data-lab-id="${lab.id}">
                            Начать
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function loadSubmittedWorks() {
    // В реальном приложении здесь будет запрос к API
    const submittedWorks = [
        {
            id: 1,
            title: 'Лабораторная работа 1: Основы HTML',
            course: 'Веб-технологии',
            submitDate: '2025-05-28',
            score: 9,
            maxScore: 10,
            teacherComment: 'Хорошая работа, но нужно улучшить семантическую разметку.'
        },
        {
            id: 2,
            title: 'Лабораторная работа 2: CSS стилизация',
            course: 'Веб-технологии',
            submitDate: '2025-06-15',
            score: null,
            maxScore: 10,
            teacherComment: null
        }
    ];
    
    displaySubmittedWorks(submittedWorks);
}

function displaySubmittedWorks(works) {
    const container = document.querySelector('.submitted-works-list');
    
    container.innerHTML = works.map(work => `
        <div class="work-card">
            <div class="work-header">
                <h4 class="work-title">${work.title}</h4>
                <span class="work-status status-${work.score ? 'checked' : 'pending'}">
                    ${work.score ? 'Проверено' : 'Ожидает проверки'}
                </span>
            </div>
            <div class="work-meta">
                <span>Курс: ${work.course}</span>
                <span>Дата сдачи: ${formatDate(work.submitDate)}</span>
                ${work.score ? `<span>Оценка: ${work.score}/${work.maxScore}</span>` : ''}
            </div>
            ${work.teacherComment ? `
                <div class="work-comment">
                    <strong>Комментарий преподавателя:</strong>
                    <p>${work.teacherComment}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function loadChats() {
    // В реальном приложении здесь будет запрос к API
    const chats = [
        { id: 1, name: 'Веб-технологии - Общий чат', type: 'group', unread: 2 },
        { id: 2, name: 'Измайлов Н.Н.', type: 'teacher', unread: 0 },
        { id: 3, name: 'Алгоритмы - Общий чат', type: 'group', unread: 0 }
    ];
    
    displayChats(chats);
}

function displayChats(chats) {
    const container = document.querySelector('.chats');
    
    container.innerHTML = chats.map(chat => `
        <div class="chat-item" data-chat-id="${chat.id}">
            <div class="chat-name">${chat.name}</div>
            ${chat.unread > 0 ? `<span class="unread-count">${chat.unread}</span>` : ''}
        </div>
    `).join('');
}

// Вспомогательные функции
function getStatusText(status) {
    const statusMap = {
        'active': 'Активно',
        'completed': 'Выполнено',
        'pending': 'Ожидает проверки',
        'overdue': 'Просрочено',
        'checked': 'Проверено'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Сдача лабораторной работы
async function submitLabWork(labId) {
    const files = document.getElementById('lab-files').files;
    const code = document.getElementById('lab-code').value;
    const comment = document.getElementById('lab-comment').value;
    
    // Здесь можно добавить логику загрузки файлов
    const fileNames = Array.from(files).map(file => file.name).join(', ');
    
    try {
        const response = await fetch(`/api/labs/${labId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                files: fileNames,
                code: code,
                comment: comment
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            // Закрыть модальное окно сдачи и т.д.
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
    } catch (error) {
        console.error('Ошибка сдачи работы:', error);
        showAlert('Ошибка сдачи работы: ' + error.message, 'error');
    }
}