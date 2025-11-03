// js/teacher-dashboard.js
let currentCourseId = null;

document.addEventListener('DOMContentLoaded', function() {
    initTeacherDashboard();
});

async function initTeacherDashboard() {
    initTeacherTabs();
    initTeacherModals();
    await loadTeacherData();
    
    // Загружаем курсы если активна соответствующая вкладка
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'disciplines') {
        await loadTeacherCourses();
    }
}

function initTeacherTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const tabId = this.getAttribute('data-tab');
            
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
    // Кнопка создания курса
    const createCourseBtn = document.getElementById('create-course-btn');
    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', function() {
            document.getElementById('create-course-modal').style.display = 'block';
        });
    }
    
    // Форма создания курса
    const courseCreateForm = document.getElementById('course-create-form');
    if (courseCreateForm) {
        courseCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewCourse();
        });
    }
    
    // Кнопка создания лабораторной работы
    const createLabBtn = document.getElementById('create-lab-btn');
    if (createLabBtn) {
        createLabBtn.addEventListener('click', function() {
            openCreateLabModal();
        });
    }
    
    // Форма создания лабораторной работы
    const labCreateForm = document.getElementById('lab-create-form');
    if (labCreateForm) {
        labCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewLab();
        });
    }
    
    // Инициализация вкладок в модальном окне управления курсом
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
            } else if (tabId === 'students' && currentCourseId) {
                loadCourseStudents(currentCourseId);
            }
        });
    });
}

async function loadTeacherTabData(tabId) {
    switch(tabId) {
        case 'disciplines':
            await loadTeacherCourses();
            break;
        case 'check-works':
            await loadWorksToCheck();
            break;
    }
}

async function loadTeacherData() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            updateTeacherUI(data.user);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных преподавателя:', error);
    }
}

function updateTeacherUI(user) {
    // Обновляем информацию на странице
    const teacherNameElements = document.querySelectorAll('#teacher-name, #teacher-firstname');
    teacherNameElements.forEach(el => {
        if (el.id === 'teacher-name') {
            el.textContent = user.firstName + ' ' + user.lastName;
        } else if (el.id === 'teacher-firstname') {
            el.textContent = user.firstName;
        }
    });
    
    document.getElementById('teacher-lastname').textContent = user.lastName;
    document.getElementById('teacher-email').textContent = user.email;
    document.getElementById('teacher-department-detail').textContent = user.department || 'Не указана';
    document.getElementById('teacher-position').textContent = user.position || 'Не указана';
}

async function loadTeacherCourses() {
    try {
        const coursesList = document.getElementById('courses-list');
        coursesList.innerHTML = '<div class="loading">Загрузка курсов...</div>';
        
        const response = await fetch('/api/teacher/courses', {
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            displayTeacherCourses(result.courses);
        } else {
            throw new Error('Ошибка загрузки курсов');
        }
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        const coursesList = document.getElementById('courses-list');
        coursesList.innerHTML = `
            <div class="error-message">
                <p>Ошибка загрузки курсов: ${error.message}</p>
                <button class="btn btn-secondary" onclick="loadTeacherCourses()">Повторить попытку</button>
            </div>
        `;
    }
}

function displayTeacherCourses(courses) {
    const container = document.getElementById('courses-list');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <h4>Курсы не найдены</h4>
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
                    <button class="btn btn-outline btn-sm" onclick="copyInviteCode('${course.invite_code}')">
                        Код приглашения
                    </button>
                    <button class="btn btn-primary btn-sm manage-course" onclick="openCourseManagement(${course.id})">
                        Управление
                    </button>
                </div>
            </div>
            <div class="course-meta">
                <span><strong>Дисциплина:</strong> ${course.discipline}</span>
                ${course.description ? `<span><strong>Описание:</strong> ${course.description}</span>` : ''}
                <span><strong>Создан:</strong> ${formatDate(course.created_at)}</span>
            </div>
            <div class="course-stats">
                <span>Лабораторных работ: <strong id="lab-count-${course.id}">0</strong></span>
                <span>Студентов: <strong id="student-count-${course.id}">0</strong></span>
            </div>
        </div>
    `).join('');
    
    // Загружаем количество лабораторных работ и студентов для каждого курса
    courses.forEach(course => {
        loadCourseLabsCount(course.id);
        loadCourseStudentsCount(course.id);
    });
}

async function loadCourseLabsCount(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/labs`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const countElement = document.getElementById(`lab-count-${courseId}`);
            if (countElement) {
                countElement.textContent = result.labs ? result.labs.length : 0;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки количества лабораторных работ:', error);
    }
}

async function loadCourseStudentsCount(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/students`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const countElement = document.getElementById(`student-count-${courseId}`);
            if (countElement) {
                countElement.textContent = result.students ? result.students.length : 0;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки количества студентов:', error);
    }
}

async function createNewCourse() {
    const form = document.getElementById('course-create-form');
    const formData = new FormData(form);
    
    const courseData = {
        name: formData.get('course-name'),
        description: formData.get('course-description'),
        discipline: formData.get('course-discipline'),
        password: formData.get('course-password') || null
    };
    
    try {
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(courseData)
        });

        const result = await response.json();
        
        if (response.ok) {
            showAlert(result.message, 'success');
            document.getElementById('create-course-modal').style.display = 'none';
            form.reset();
            await loadTeacherCourses();
        } else {
            throw new Error(result.error || 'Ошибка создания курса');
        }
    } catch (error) {
        console.error('Ошибка создания курса:', error);
        showAlert('Ошибка создания курса: ' + error.message, 'error');
    }
}

async function openCourseManagement(courseId) {
    currentCourseId = courseId;
    
    try {
        const response = await fetch(`/api/courses/${courseId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const course = result.course;
            
            document.getElementById('manage-course-title').textContent = `Управление курсом: ${course.name}`;
            document.getElementById('course-invite-code').textContent = course.invite_code;
            
            document.getElementById('manage-course-modal').style.display = 'block';
            
            await loadCourseLabs(courseId);
            await loadCourseStudents(courseId);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных курса:', error);
        showAlert('Ошибка загрузки данных курса', 'error');
    }
}

async function loadCourseLabs(courseId) {
    try {
        const labsList = document.getElementById('course-labs-list');
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
        console.error('Ошибка загрузки лабораторных работ:', error);
        const labsList = document.getElementById('course-labs-list');
        labsList.innerHTML = `
            <div class="error-message">
                <p>Ошибка загрузки лабораторных работ: ${error.message}</p>
            </div>
        `;
    }
}

function displayCourseLabs(labs) {
    const container = document.getElementById('course-labs-list');
    
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
                <span><strong>Начало:</strong> ${lab.start_date ? formatDateTime(lab.start_date) : 'Не указано'}</span>
                <span><strong>Дедлайн:</strong> ${lab.deadline ? formatDateTime(lab.deadline) : 'Не указано'}</span>
                <span><strong>Макс. балл:</strong> ${lab.max_score}</span>
            </div>
            <div class="lab-description">
                <p>${lab.description}</p>
            </div>
            <div class="lab-actions">
                <button class="btn btn-secondary btn-sm" onclick="editLab(${lab.id})">
                    Редактировать
                </button>
                <button class="btn btn-primary btn-sm" onclick="viewLabSubmissions(${lab.id})">
                    Работы студентов
                </button>
            </div>
        </div>
    `).join('');
}

async function loadCourseStudents(courseId) {
    try {
        const studentsList = document.getElementById('students-tab');
        studentsList.innerHTML = '<div class="loading">Загрузка студентов...</div>';
        
        const response = await fetch(`/api/courses/${courseId}/students`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displayCourseStudents(result.students || []);
        } else {
            throw new Error('Ошибка загрузки студентов');
        }
    } catch (error) {
        console.error('Ошибка загрузки студентов:', error);
        const studentsList = document.getElementById('students-tab');
        studentsList.innerHTML = `
            <div class="error-message">
                <p>Ошибка загрузки студентов: ${error.message}</p>
            </div>
        `;
    }
}

function displayCourseStudents(students) {
    const container = document.getElementById('students-tab');
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="no-students">
                <p>Студенты не найдены</p>
                <p>Отправьте студентам код приглашения для присоединения к курсу</p>
                <div class="invite-section">
                    <p><strong>Код приглашения:</strong></p>
                    <div class="invite-code">
                        <code id="students-invite-code-display">Загрузка...</code>
                        <button class="btn btn-outline btn-sm" onclick="copyInviteCodeFromStudents()">
                            Копировать
                        </button>
                    </div>
                </div>
            </div>
        `;
        updateStudentsInviteCode();
        return;
    }
    
    container.innerHTML = `
        <div class="students-header">
            <h4>Студенты курса (${students.length})</h4>
            <div class="invite-section">
                <span>Код приглашения:</span>
                <div class="invite-code">
                    <code id="students-invite-code-display">Загрузка...</code>
                    <button class="btn btn-outline btn-sm" onclick="copyInviteCodeFromStudents()">
                        Копировать
                    </button>
                </div>
            </div>
        </div>
        <div class="students-list">
            ${students.map(student => `
                <div class="student-item">
                    <div class="student-info">
                        <h5>${student.first_name} ${student.last_name}</h5>
                        <p>${student.email}</p>
                        <p>${student.group_name ? `Группа: ${student.group_name}` : ''} ${student.faculty ? ` • ${student.faculty}` : ''}</p>
                    </div>
                    <div class="student-meta">
                        <span>Присоединился: ${formatDate(student.joined_at)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    updateStudentsInviteCode();
}

async function updateStudentsInviteCode() {
    if (!currentCourseId) return;
    
    try {
        const response = await fetch(`/api/courses/${currentCourseId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const inviteCodeElement = document.getElementById('students-invite-code-display');
            if (inviteCodeElement) {
                inviteCodeElement.textContent = data.course.invite_code;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки кода приглашения:', error);
    }
}

function openCreateLabModal() {
    if (!currentCourseId) {
        showAlert('Сначала выберите курс', 'error');
        return;
    }
    
    const modal = document.getElementById('create-lab-modal');
    
    // Устанавливаем текущую дату и время по умолчанию
    const now = new Date();
    const startDate = new Date(now.getTime() + 60 * 60 * 1000); // +1 час
    const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 дней
    
    document.getElementById('lab-start-date').value = formatDateTimeLocal(startDate);
    document.getElementById('lab-deadline').value = formatDateTimeLocal(deadline);
    
    modal.style.display = 'block';
}

async function createNewLab() {
    const form = document.getElementById('lab-create-form');
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
    
    try {
        const response = await fetch('/api/labs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(labData)
        });

        const result = await response.json();
        
        if (response.ok) {
            showAlert(result.message, 'success');
            document.getElementById('create-lab-modal').style.display = 'none';
            form.reset();
            await loadCourseLabs(currentCourseId);
            await loadCourseLabsCount(currentCourseId);
        } else {
            throw new Error(result.error || 'Ошибка создания лабораторной работы');
        }
    } catch (error) {
        console.error('Ошибка создания лабораторной работы:', error);
        showAlert('Ошибка создания лабораторной работы: ' + error.message, 'error');
    }
}

function copyInviteCode(inviteCode) {
    navigator.clipboard.writeText(inviteCode).then(() => {
        showAlert('Код приглашения скопирован', 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showAlert('Ошибка копирования', 'error');
    });
}

function copyInviteCodeFromStudents() {
    const inviteCodeElement = document.getElementById('students-invite-code-display');
    if (inviteCodeElement) {
        copyInviteCode(inviteCodeElement.textContent);
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
    const startDate = lab.start_date ? new Date(lab.start_date) : null;
    const deadline = lab.deadline ? new Date(lab.deadline) : null;
    
    if (startDate && now < startDate) return 'upcoming';
    if (deadline && now > deadline) return 'completed';
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
function editLab(labId) {
    showAlert('Функция редактирования в разработке', 'info');
}

function viewLabSubmissions(labId) {
    showAlert('Функция просмотра работ в разработке', 'info');
}

async function loadWorksToCheck() {
    console.log('Загрузка работ для проверки...');
}