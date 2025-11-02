// js/teacher-dashboard.js
// Функциональность личного кабинета преподавателя

document.addEventListener('DOMContentLoaded', function() {
    initTeacherDashboard();
});

function initTeacherDashboard() {
    // Инициализация вкладок
    initTeacherTabs();
    
    // Загрузка данных преподавателя
    loadTeacherData();
    
    // Загрузка курсов и заданий
    loadTeacherCourses();
    loadWorksToCheck();
    
    // Инициализация модальных окон
    initTeacherModals();
}

function initTeacherTabs() {
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
            loadTeacherTabData(tabId);
        });
    });
}

async function loadTeacherData() {
  try {
    const response = await API.getCurrentUser();
    if (response.user) {
      const user = response.user;
      
      // Заполнение данных в профиле реальными данными
      document.getElementById('teacher-name').textContent = user.firstName + ' ' + user.lastName;
      document.getElementById('teacher-department').textContent = 'Кафедра: ' + (user.department || 'Не указана');
      document.getElementById('teacher-firstname').textContent = user.firstName;
      document.getElementById('teacher-lastname').textContent = user.lastName;
      document.getElementById('teacher-email').textContent = user.email;
      document.getElementById('teacher-department-detail').textContent = user.department || 'Не указана';
      document.getElementById('teacher-position').textContent = user.position || 'Не указана';
    }
  } catch (error) {
    console.error('Ошибка загрузки данных преподавателя:', error);
    // Если не авторизован, перенаправляем на вход
    window.location.href = 'login.html';
  }
}

function loadTeacherCourses() {
    // В реальном приложении здесь будет запрос к API
    const courses = [
        {
            id: 1,
            name: 'Веб-технологии',
            discipline: 'Программная инженерия',
            groups: ['ДИПР6-31', 'ДИПР6-32'],
            studentCount: 24,
            activeLabs: 3
        },
        {
            id: 2,
            name: 'Командный проект по программной инженерии',
            discipline: 'Программная инженерия',
            groups: ['ДИПР6-31'],
            studentCount: 4,
            activeLabs: 1
        }
    ];
    
    displayTeacherCourses(courses);
}

function displayTeacherCourses(courses) {
    const container = document.querySelector('.courses-list');
    
    container.innerHTML = courses.map(course => `
        <div class="course-card">
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
                <span>Дисциплина: ${course.discipline}</span>
                <span>Группы: ${course.groups.join(', ')}</span>
                <span>Студентов: ${course.studentCount}</span>
                <span>Активных работ: ${course.activeLabs}</span>
            </div>
        </div>
    `).join('');
}

function loadWorksToCheck() {
    // В реальном приложении здесь будет запрос к API
    const works = [
        {
            id: 1,
            studentName: 'Косовой Н.А.',
            labTitle: 'Лабораторная работа 2: CSS стилизация',
            course: 'Веб-технологии',
            submitDate: '2025-06-15',
            status: 'pending'
        },
        {
            id: 2,
            studentName: 'Бондаренко А.М.',
            labTitle: 'Лабораторная работа 1: Основы HTML',
            course: 'Веб-технологии',
            submitDate: '2025-06-14',
            status: 'pending'
        },
        {
            id: 3,
            studentName: 'Максименко А.Ю.',
            labTitle: 'Командный проект',
            course: 'Командный проект по программной инженерии',
            submitDate: '2025-06-10',
            status: 'checked',
            score: 8,
            maxScore: 10
        }
    ];
    
    displayWorksToCheck(works);
}

function displayWorksToCheck(works) {
    const container = document.querySelector('.works-list');
    
    container.innerHTML = works.map(work => `
        <div class="work-card">
            <div class="work-header">
                <h4 class="work-title">${work.labTitle}</h4>
                <span class="work-status status-${work.status}">
                    ${work.status === 'pending' ? 'Ожидает проверки' : 'Проверено'}
                </span>
            </div>
            <div class="work-meta">
                <span>Студент: ${work.studentName}</span>
                <span>Курс: ${work.course}</span>
                <span>Дата сдачи: ${formatDate(work.submitDate)}</span>
                ${work.score ? `<span>Оценка: ${work.score}/${work.maxScore}</span>` : ''}
            </div>
            <div class="work-actions">
                ${work.status === 'pending' ? `
                    <button class="btn btn-primary btn-sm check-work" data-work-id="${work.id}">
                        Проверить
                    </button>
                ` : `
                    <button class="btn btn-secondary btn-sm view-checked" data-work-id="${work.id}">
                        Посмотреть
                    </button>
                `}
            </div>
        </div>
    `).join('');
    
    // Добавление обработчиков событий для кнопок
    addWorkEventHandlers();
}

function addWorkEventHandlers() {
    // Обработчик для кнопки "Проверить"
    document.querySelectorAll('.check-work').forEach(btn => {
        btn.addEventListener('click', function() {
            const workId = this.getAttribute('data-work-id');
            openWorkForChecking(workId);
        });
    });
}

function openWorkForChecking(workId) {
    // В реальном приложении здесь будет загрузка данных работы
    showAlert('Открытие работы для проверки...', 'info');
    
    // Симуляция открытия модального окна проверки
    setTimeout(() => {
        const modal = document.getElementById('check-work-modal');
        
        // Заполнение данных о работе (в реальном приложении из API)
        document.getElementById('work-student-name').textContent = 'Студент: Косовой Н.А.';
        document.getElementById('work-lab-name').textContent = 'Лабораторная работа: "Разработка веб-приложения"';
        document.getElementById('work-submit-date').textContent = 'Дата сдачи: 25.05.2025 14:30';
        
        // Заполнение списка файлов
        const filesList = document.getElementById('work-files-list');
        filesList.innerHTML = `
            <div class="file-item">
                <span class="file-icon">📄</span>
                <span>index.html</span>
                <button class="btn btn-secondary btn-sm">Скачать</button>
            </div>
            <div class="file-item">
                <span class="file-icon">📄</span>
                <span>style.css</span>
                <button class="btn btn-secondary btn-sm">Скачать</button>
            </div>
            <div class="file-item">
                <span class="file-icon">📄</span>
                <span>script.js</span>
                <button class="btn btn-secondary btn-sm">Скачать</button>
            </div>
        `;
        
        // Заполнение кода (в реальном приложении будет загружен файл)
        document.getElementById('work-code-preview').textContent = `<!DOCTYPE html>
<html>
<head>
    <title>Моя лабораторная работа</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Добро пожаловать на мой сайт</h1>
    <p>Это выполненная лабораторная работа по веб-технологиям.</p>
    <script src="script.js"></script>
</body>
</html>`;
        
        modal.style.display = 'block';
    }, 500);
}

function initTeacherModals() {
    // Инициализация модальных окон преподавателя
    const createCourseBtn = document.getElementById('create-course-btn');
    const createLabBtn = document.getElementById('create-lab-btn');
    const editProfileBtn = document.getElementById('edit-teacher-profile');
    
    // Обработчики для открытия модальных окон
    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', function() {
            document.getElementById('create-course-modal').style.display = 'block';
        });
    }
    
    if (createLabBtn) {
        createLabBtn.addEventListener('click', function() {
            document.getElementById('create-lab-modal').style.display = 'block';
        });
    }
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            openTeacherEditProfileModal();
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
    
    // Обработчики форм
    initTeacherForms();
}

function initTeacherForms() {
    // Обработчик формы создания курса
    const courseCreateForm = document.getElementById('course-create-form');
    if (courseCreateForm) {
        courseCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewCourse();
        });
    }
    
    // Обработчик отмены создания курса
    const cancelCourseBtn = document.getElementById('cancel-course');
    if (cancelCourseBtn) {
        cancelCourseBtn.addEventListener('click', function() {
            document.getElementById('create-course-modal').style.display = 'none';
        });
    }
    
    // Обработчик формы создания лабораторной работы
    const labCreateForm = document.getElementById('lab-create-form');
    if (labCreateForm) {
        labCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewLab();
        });
    }
    
    // Обработчик отмены создания лабораторной работы
    const cancelLabBtn = document.getElementById('cancel-lab');
    if (cancelLabBtn) {
        cancelLabBtn.addEventListener('click', function() {
            document.getElementById('create-lab-modal').style.display = 'none';
        });
    }
    
    // Обработчик формы оценки работы
    const workEvaluationForm = document.getElementById('work-evaluation-form');
    if (workEvaluationForm) {
        workEvaluationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitWorkEvaluation();
        });
    }
    
    // Обработчик кнопки отправки на доработку
    const sendRevisionBtn = document.getElementById('send-revision');
    if (sendRevisionBtn) {
        sendRevisionBtn.addEventListener('click', function() {
            sendWorkForRevision();
        });
    }
}

function createNewCourse() {
    const formData = new FormData(document.getElementById('course-create-form'));
    
    const courseData = {
        name: formData.get('course-name'),
        description: formData.get('course-description'),
        discipline: formData.get('course-discipline'),
        password: formData.get('course-password')
    };
    
    // В реальном приложении здесь будет запрос к API
    console.log('Создание курса:', courseData);
    
    showAlert('Курс успешно создан', 'success');
    document.getElementById('create-course-modal').style.display = 'none';
    
    // Очистка формы
    document.getElementById('course-create-form').reset();
}

function createNewLab() {
    const formData = new FormData(document.getElementById('lab-create-form'));
    
    const labData = {
        name: formData.get('lab-name'),
        course: formData.get('lab-course'),
        description: formData.get('lab-description'),
        template: formData.get('lab-template'),
        deadline: formData.get('lab-deadline'),
        maxScore: formData.get('lab-max-score')
    };
    
    // В реальном приложении здесь будет запрос к API
    console.log('Создание лабораторной работы:', labData);
    
    showAlert('Лабораторная работа успешно создана', 'success');
    document.getElementById('create-lab-modal').style.display = 'none';
    
    // Очистка формы
    document.getElementById('lab-create-form').reset();
}

function submitWorkEvaluation() {
    const score = document.getElementById('work-score').value;
    const comments = document.getElementById('work-comments').value;
    
    if (!score) {
        showAlert('Пожалуйста, укажите оценку', 'error');
        return;
    }
    
    // В реальном приложении здесь будет запрос к API
    console.log('Оценка работы:', { score, comments });
    
    showAlert('Оценка сохранена и отправлена студенту', 'success');
    document.getElementById('check-work-modal').style.display = 'none';
    
    // Очистка формы
    document.getElementById('work-evaluation-form').reset();
}

function sendWorkForRevision() {
    const comments = document.getElementById('work-comments').value;
    
    if (!comments) {
        showAlert('Пожалуйста, укажите причины для доработки', 'error');
        return;
    }
    
    // В реальном приложении здесь будет запрос к API
    console.log('Отправка на доработку:', { comments });
    
    showAlert('Работа отправлена на доработку', 'warning');
    document.getElementById('check-work-modal').style.display = 'none';
    
    // Очистка формы
    document.getElementById('work-evaluation-form').reset();
}

function openTeacherEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    
    // Заполнение формы текущими данными
    document.getElementById('edit-firstname').value = document.getElementById('teacher-firstname').textContent;
    document.getElementById('edit-lastname').value = document.getElementById('teacher-lastname').textContent;
    document.getElementById('edit-email').value = document.getElementById('teacher-email').textContent;
    
    modal.style.display = 'block';
}

function loadTeacherTabData(tabId) {
    switch(tabId) {
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

function loadStatementData() {
    // Загрузка данных для формирования ведомостей
    const courses = [
        { id: 1, name: 'Веб-технологии' },
        { id: 2, name: 'Командный проект по программной инженерии' }
    ];
    
    const courseSelect = document.getElementById('statement-course');
    courseSelect.innerHTML = '<option value="">-- Выберите курс --</option>' +
        courses.map(course => `<option value="${course.id}">${course.name}</option>`).join('');
}

function loadSettingsData() {
    // Загрузка настроек системы
    const criteria = [
        { id: 1, name: 'Качество кода', weight: 0.3 },
        { id: 2, name: 'Функциональность', weight: 0.4 },
        { id: 3, name: 'Оформление', weight: 0.2 },
        { id: 4, name: 'Своевременность', weight: 0.1 }
    ];
    
    const templates = [
        { id: 1, name: 'Базовый шаблон веб-приложения' },
        { id: 2, name: 'Шаблон алгоритмической задачи' }
    ];
    
    displaySettings(criteria, templates);
}

function displaySettings(criteria, templates) {
    const criteriaContainer = document.querySelector('.grading-criteria');
    const templatesContainer = document.querySelector('.task-templates');
    
    criteriaContainer.innerHTML = criteria.map(criterion => `
        <div class="criterion-item">
            <span>${criterion.name}</span>
            <span>Вес: ${criterion.weight * 100}%</span>
            <button class="btn btn-secondary btn-sm">Изменить</button>
        </div>
    `).join('');
    
    templatesContainer.innerHTML = templates.map(template => `
        <div class="template-item">
            <span>${template.name}</span>
            <button class="btn btn-secondary btn-sm">Использовать</button>
        </div>
    `).join('');
}

function loadTeacherChats() {
    // В реальном приложении здесь будет запрос к API
    const groups = [
        { id: 1, name: 'ДИПР6-31 - Веб-технологии', type: 'group', unread: 3 },
        { id: 2, name: 'ДИПР6-32 - Веб-технологии', type: 'group', unread: 0 },
        { id: 3, name: 'Командный проект - ДИПР6-31', type: 'group', unread: 1 }
    ];
    
    const students = [
        { id: 4, name: 'Косовой Н.А.', group: 'ДИПР6-31', unread: 0 },
        { id: 5, name: 'Бондаренко А.М.', group: 'ДИПР6-31', unread: 1 },
        { id: 6, name: 'Максименко А.Ю.', group: 'ДИПР6-31', unread: 0 }
    ];
    
    displayTeacherChats(groups, students);
}

function displayTeacherChats(groups, students) {
    const container = document.querySelector('.groups-list');
    
    container.innerHTML = `
        <div class="chat-section">
            <h5>Групповые чаты</h5>
            ${groups.map(group => `
                <div class="group-item" data-chat-id="${group.id}">
                    <div class="chat-name">${group.name}</div>
                    ${group.unread > 0 ? `<span class="unread-count">${group.unread}</span>` : ''}
                </div>
            `).join('')}
        </div>
        <div class="chat-section">
            <h5>Индивидуальные чаты</h5>
            ${students.map(student => `
                <div class="group-item" data-chat-id="${student.id}">
                    <div class="chat-name">${student.name} (${student.group})</div>
                    ${student.unread > 0 ? `<span class="unread-count">${student.unread}</span>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

// Вспомогательная функция
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}