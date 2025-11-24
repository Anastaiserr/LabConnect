// js/student-courses.js
// Функциональность поиска и записи на курсы для студентов

let currentEnrollCourseId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ student-courses.js загружен');
    initStudentCourses();
});

async function initStudentCourses() {
    console.log('🎯 Инициализация страницы курсов студента');
    
    // Загрузка данных пользователя
    await loadStudentData();
    
    // Загрузка моих курсов
    await loadMyCourses();
    
    // Загрузка всех доступных курсов
    await loadAvailableCourses();
    
    // Инициализация обработчиков событий
    initEventHandlers();

    // Проверка параметров URL (для инвайт-ссылок)
    checkUrlParams();
    
    console.log('✅ Страница курсов инициализирована');
}

async function loadStudentData() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                document.getElementById('current-user').textContent = 
                    `${data.user.firstName} ${data.user.lastName} (Студент)`;
            }
        } else {
            throw new Error('Ошибка загрузки данных');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных пользователя:', error);
        window.location.href = 'login.html';
    }
}

// Загрузка доступных курсов
async function loadAvailableCourses() {
    try {
        const container = document.getElementById('available-courses-list');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Загрузка доступных курсов...</div>';
        
        console.log('🔄 Запрос всех курсов...');
        const response = await fetch('/api/courses/all', {
            credentials: 'include'
        });
        
        console.log('📊 Статус ответа:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Получены курсы:', result.courses?.length || 0);
            displayAvailableCourses(result.courses || []);
        } else {
            const errorText = await response.text();
            console.error('❌ Ошибка сервера:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки доступных курсов:', error);
        const container = document.getElementById('available-courses-list');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h4>Ошибка загрузки доступных курсов</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-secondary" onclick="loadAvailableCourses()">Повторить попытку</button>
                </div>
            `;
        }
    }
}

// Отображение доступных курсов
function displayAvailableCourses(courses) {
    const container = document.getElementById('available-courses-list');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <p>Нет доступных курсов для записи</p>
                <p>Курсы появятся здесь, когда преподаватели их создадут</p>
            </div>
        `;
        return;
    }
    
    // Фильтруем курсы, чтобы не показывать уже записанные
    const availableCourses = courses.filter(course => !course.is_enrolled);
    
    if (availableCourses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <p>Вы уже записаны на все доступные курсы</p>
                <p>Новые курсы появятся позже</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = availableCourses.map(course => `
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
                <span><strong>Создан:</strong> ${formatDate(course.created_at)}</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-primary btn-sm enroll-course" data-course-id="${course.id}">
                    Записаться на курс
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок записи
    addAvailableCoursesEventHandlers();
}

async function loadMyCourses() {
    try {
        const response = await fetch('/api/student/courses', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displayMyCourses(result.courses || []);
        } else {
            throw new Error('Ошибка загрузки курсов');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки моих курсов:', error);
        document.getElementById('my-courses-list').innerHTML = 
            '<div class="error-message">Ошибка загрузки курсов</div>';
    }
}

function displayMyCourses(courses) {
    const container = document.getElementById('my-courses-list');
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <p>Вы еще не записаны ни на один курс</p>
                <p>Найдите интересующие вас курсы выше и запишитесь на них</p>
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
                    Перейти к курсу
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок
    addMyCoursesEventHandlers();
}

function initEventHandlers() {
    // Поиск курсов
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('course-search');
    const showAllBtn = document.getElementById('show-all-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            searchCourses();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchCourses();
            }
        });
    }
    
    if (showAllBtn) {
        showAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadAvailableCourses();
        });
    }
    
    // Форма записи на курс
    const enrollForm = document.getElementById('enroll-form');
    if (enrollForm) {
        enrollForm.addEventListener('submit', handleEnrollment);
    }
    
    // Закрытие модальных окон
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Закрытие при клике вне окна
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function addAvailableCoursesEventHandlers() {
    document.querySelectorAll('.enroll-course').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const courseId = this.getAttribute('data-course-id');
            openEnrollModal(courseId);
        });
    });
}

function addMyCoursesEventHandlers() {
    document.querySelectorAll('.open-course').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const courseId = this.getAttribute('data-course-id');
            // Здесь можно добавить переход к странице курса
            showAlert('Переход к курсу...', 'info');
        });
    });
}

async function searchCourses() {
    const query = document.getElementById('course-search').value.trim();
    
    if (!query) {
        showAlert('Введите поисковый запрос', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/courses/search?query=${encodeURIComponent(query)}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displaySearchResults(result.courses || []);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка поиска');
        }
    } catch (error) {
        console.error('❌ Ошибка поиска курсов:', error);
        showAlert('Ошибка поиска курсов: ' + error.message, 'error');
    }
}

function displaySearchResults(courses) {
    const container = document.getElementById('available-courses-list');
    
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
    
    // Добавляем обработчики для кнопок записи
    addAvailableCoursesEventHandlers();
}

async function openEnrollModal(courseId) {
    currentEnrollCourseId = courseId;
    
    try {
        const response = await fetch(`/api/courses/${courseId}/info`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const course = result.course;
            
            // Заполняем информацию о курсе
            document.getElementById('enroll-course-title').textContent = `Запись на курс: ${course.name}`;
            document.getElementById('course-name-enroll').textContent = course.name;
            document.getElementById('course-discipline-enroll').textContent = course.discipline;
            document.getElementById('course-teacher-enroll').textContent = 
                `${course.teacher_first_name} ${course.teacher_last_name}`;
            document.getElementById('course-description-enroll').textContent = 
                course.description || 'Описание отсутствует';
            
            // Показываем поле для пароля, если курс защищен
            const passwordField = document.getElementById('password-field');
            if (course.password) {
                passwordField.style.display = 'block';
            } else {
                passwordField.style.display = 'none';
            }
            
            // Показываем модальное окно
            document.getElementById('enroll-modal').style.display = 'block';
            
        } else {
            throw new Error('Ошибка загрузки информации о курсе');
        }
    } catch (error) {
        console.error('❌ Ошибка открытия модального окна записи:', error);
        showAlert('Ошибка загрузки информации о курсе', 'error');
    }
}

async function handleEnrollment(e) {
    e.preventDefault();
    
    const password = document.getElementById('course-password-enroll').value;
    
    try {
        const response = await fetch(`/api/courses/${currentEnrollCourseId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ password })
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            
            // Закрываем модальное окно
            document.getElementById('enroll-modal').style.display = 'none';
            
            // Обновляем списки курсов
            await loadMyCourses();
            await loadAvailableCourses();
            
            // Очищаем форму
            document.getElementById('enroll-form').reset();
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка записи на курс');
        }
    } catch (error) {
        console.error('❌ Ошибка записи на курс:', error);
        showAlert(error.message, 'error');
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

function showAlert(message, type = 'info') {
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

// Проверка параметров URL (для инвайт-ссылок)
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    
    if (inviteCode) {
        openInviteModal(inviteCode);
    }
}

// Функции для работы с инвайтами (оставьте из старого кода)
async function openInviteModal(inviteCode) {
    try {
        const response = await fetch(`/api/courses/invite/${inviteCode}/info`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            showInviteCourseModal(result.course, inviteCode);
        } else {
            const errorData = await response.json();
            showAlert(errorData.error, 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка проверки инвайта:', error);
        showAlert('Ошибка проверки приглашения', 'error');
    }
}

function showInviteCourseModal(course, inviteCode) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Приглашение на курс</h3>
                <span class="close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="course-info">
                    <h4>${course.name}</h4>
                    <p><strong>Дисциплина:</strong> ${course.discipline}</p>
                    <p><strong>Преподаватель:</strong> ${course.teacher_name}</p>
                    ${course.description ? `<p><strong>Описание:</strong> ${course.description}</p>` : ''}
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="enrollByInvite('${inviteCode}')">Записаться на курс</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function enrollByInvite(inviteCode) {
    try {
        const response = await fetch('/api/courses/enroll-by-invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ inviteCode })
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            
            // Закрываем модальное окно
            document.querySelector('.modal').remove();
            
            // Обновляем списки курсов
            await loadMyCourses();
            await loadAvailableCourses();
            
            // Убираем параметр invite из URL
            const url = new URL(window.location);
            url.searchParams.delete('invite');
            window.history.replaceState({}, '', url);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
    } catch (error) {
        console.error('❌ Ошибка записи по инвайту:', error);
        showAlert(error.message, 'error');
    }
}