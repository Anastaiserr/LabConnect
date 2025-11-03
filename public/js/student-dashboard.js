// js/student-dashboard.js
// Функциональность личного кабинета студента

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ student-dashboard.js загружен');
    initStudentDashboard();
});

async function initStudentDashboard() {
    console.log('🎯 Инициализация личного кабинета студента');
    
    // Инициализация вкладок
    initStudentTabs();
    
    // Инициализация модальных окон
    initStudentModals();
    
    // Загрузка данных студента
    await loadStudentData();
    
    // Загружаем курсы если активна соответствующая вкладка
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'disciplines') {
        console.log('📚 Загружаем курсы студента...');
        await loadStudentCourses();
    }
    
    console.log('✅ Личный кабинет студента инициализирован');
}

function initStudentTabs() {
    console.log('🔧 Инициализация вкладок студента');
    
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
            loadStudentTabData(tabId);
        });
    });
}

function initStudentModals() {
    console.log('🔧 Инициализация модальных окон студента');
    
    // Кнопка присоединения к курсу
    const joinCourseBtn = document.getElementById('join-course-btn');
    if (joinCourseBtn) {
        joinCourseBtn.addEventListener('click', function() {
            console.log('🎯 Кнопка присоединения к курсу нажата');
            document.getElementById('join-course-modal').style.display = 'block';
        });
    }
    
    // Форма присоединения к курсу
    const joinCourseForm = document.getElementById('join-course-form');
    if (joinCourseForm) {
        joinCourseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Форма присоединения к курсу отправлена');
            joinCourse();
        });
    }
    
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
    
    console.log('✅ Модальные окна студента инициализированы');
}

async function loadStudentTabData(tabId) {
    console.log('📂 Загрузка данных для вкладки:', tabId);
    
    switch(tabId) {
        case 'disciplines':
            await loadStudentCourses();
            break;
        case 'my-works':
            await loadStudentWorks();
            break;
        case 'deadlines':
            await loadStudentDeadlines();
            break;
        case 'settings':
            loadStudentSettings();
            break;
        case 'chat':
            loadStudentChats();
            break;
    }
}

async function loadStudentData() {
    try {
        console.log('👤 Загрузка данных студента...');
        const response = await fetch('/api/user', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Данные студента загружены:', data.user);
            
            // Обновляем информацию в интерфейсе
            updateStudentUI(data.user);
        } else {
            console.error('❌ Ошибка загрузки данных студента');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных студента:', error);
    }
}

function updateStudentUI(user) {
    // Обновляем имя в навигации
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = `${user.firstName} ${user.lastName}`;
    });
    
    // Обновляем информацию в профиле
    const profileName = document.getElementById('profile-name');
    if (profileName) {
        profileName.textContent = `${user.firstName} ${user.lastName}`;
    }
    
    const profileRole = document.getElementById('profile-role');
    if (profileRole) {
        profileRole.textContent = user.role === 'student' ? 'Студент' : 'Преподаватель';
    }
    
    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) {
        profileEmail.textContent = user.email;
    }
    
    const profileGroup = document.getElementById('profile-group');
    if (profileGroup) {
        profileGroup.textContent = user.group || 'Не указана';
    }
    
    const profileFaculty = document.getElementById('profile-faculty');
    if (profileFaculty) {
        profileFaculty.textContent = user.faculty || 'Не указан';
    }
}

async function loadStudentCourses() {
    try {
        console.log('📚 Загрузка курсов студента...');
        
        // TODO: Реализовать API для получения курсов студента
        // Временно используем заглушку
        const courses = await getStudentCourses();
        displayStudentCourses(courses);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки курсов:', error);
        showNotification('Ошибка загрузки курсов', 'error');
    }
}

async function getStudentCourses() {
    // TODO: Заменить на реальный API вызов
    // Временно возвращаем пустой массив
    return [];
}

function displayStudentCourses(courses) {
    const coursesContainer = document.getElementById('student-courses-container');
    
    if (!coursesContainer) {
        console.error('❌ Контейнер курсов студента не найден');
        return;
    }
    
    if (!courses || courses.length === 0) {
        coursesContainer.innerHTML = `
            <div class="empty-state">
                <h3>У вас пока нет курсов</h3>
                <p>Присоединитесь к курсу, используя код приглашения от преподавателя</p>
                <button class="btn btn-primary" onclick="document.getElementById('join-course-modal').style.display='block'">
                    Присоединиться к курсу
                </button>
            </div>
        `;
        return;
    }
    
    coursesContainer.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-header">
                <h3 class="course-title">${course.name}</h3>
                <span class="course-status ${course.status}">${getStatusText(course.status)}</span>
            </div>
            <div class="course-info">
                <p class="course-description">${course.description || 'Описание отсутствует'}</p>
                <div class="course-meta">
                    <span class="meta-item">
                        <i class="fas fa-book"></i>
                        ${course.discipline}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-user-tie"></i>
                        ${course.teacher_name}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-file-alt"></i>
                        Лабораторных: ${course.labs_count}
                    </span>
                </div>
            </div>
            <div class="course-footer">
                <button class="btn btn-primary" onclick="viewCourse(${course.id})">
                    Перейти к курсу
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Отображено ${courses.length} курсов студента`);
}

function getStatusText(status) {
    const statusMap = {
        'active': 'Активный',
        'completed': 'Завершен',
        'pending': 'Ожидание'
    };
    return statusMap[status] || status;
}

async function joinCourse() {
    const form = document.getElementById('join-course-form');
    const formData = new FormData(form);
    
    const inviteCode = formData.get('invite-code');
    
    if (!inviteCode) {
        showNotification('Введите код приглашения', 'error');
        return;
    }
    
    console.log('🔑 Попытка присоединения с кодом:', inviteCode);
    
    try {
        // Сначала проверяем код приглашения
        const checkResponse = await fetch(`/api/courses/invite/${inviteCode}`, {
            credentials: 'include'
        });
        
        if (!checkResponse.ok) {
            const errorData = await checkResponse.json();
            throw new Error(errorData.error || 'Неверный код приглашения');
        }
        
        const courseData = await checkResponse.json();
        console.log('✅ Курс найден:', courseData.course);
        
        // Присоединяемся к курсу
        const joinResponse = await fetch('/api/courses/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ invite_code: inviteCode }),
            credentials: 'include'
        });
        
        const joinResult = await joinResponse.json();
        
        if (joinResponse.ok) {
            console.log('✅ Присоединение успешно');
            showNotification(`Вы успешно присоединились к курсу "${courseData.course.name}"`, 'success');
            
            // Закрыть модальное окно
            document.getElementById('join-course-modal').style.display = 'none';
            
            // Очистить форму
            form.reset();
            
            // Обновить список курсов
            await loadStudentCourses();
        } else {
            throw new Error(joinResult.error || 'Ошибка присоединения к курсу');
        }
        
    } catch (error) {
        console.error('❌ Ошибка присоединения к курсу:', error);
        showNotification(error.message, 'error');
    }
}

// Функции для других вкладок (заглушки)
async function loadStudentWorks() {
    console.log('📝 Загрузка работ студента');
    // TODO: Реализовать загрузку работ студента
}

async function loadStudentDeadlines() {
    console.log('⏰ Загрузка дедлайнов студента');
    // TODO: Реализовать загрузку дедлайнов
}

function loadStudentSettings() {
    console.log('⚙️ Загрузка настроек студента');
    // TODO: Реализовать загрузку настроек
}

function loadStudentChats() {
    console.log('💬 Загрузка чатов студента');
    // TODO: Реализовать загрузку чатов
}

function viewCourse(courseId) {
    console.log('👀 Просмотр курса:', courseId);
    showNotification('Функция просмотра курса в разработке', 'info');
}

// Вспомогательные функции
function showNotification(message, type = 'info') {
    console.log(`📢 Уведомление [${type}]: ${message}`);
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Добавляем в контейнер уведомлений
    const container = document.getElementById('notifications-container');
    if (container) {
        container.appendChild(notification);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}