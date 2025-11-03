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
            } else if (tabId === 'students' && currentCourseId) {
                loadCourseStudents(currentCourseId);
            } else if (tabId === 'settings' && currentCourseId) {
                loadCourseSettings(currentCourseId);
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
            
            // Обновляем информацию в интерфейсе
            updateTeacherUI(data.user);
        } else {
            console.error('❌ Ошибка загрузки данных преподавателя');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных преподавателя:', error);
    }
}

function updateTeacherUI(user) {
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
        profileRole.textContent = user.role === 'teacher' ? 'Преподаватель' : 'Студент';
    }
    
    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) {
        profileEmail.textContent = user.email;
    }
    
    const profileDepartment = document.getElementById('profile-department');
    if (profileDepartment) {
        profileDepartment.textContent = user.department || 'Не указано';
    }
    
    const profilePosition = document.getElementById('profile-position');
    if (profilePosition) {
        profilePosition.textContent = user.position || 'Не указано';
    }
}

async function loadTeacherCourses() {
    try {
        console.log('📚 Загрузка курсов преподавателя...');
        
        const response = await fetch('/api/teacher/courses', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Курсы загружены:', data.courses);
            
            displayTeacherCourses(data.courses);
        } else {
            console.error('❌ Ошибка загрузки курсов');
            showNotification('Ошибка загрузки курсов', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки курсов:', error);
        showNotification('Ошибка загрузки курсов', 'error');
    }
}

function displayTeacherCourses(courses) {
    const coursesContainer = document.getElementById('courses-container');
    
    if (!coursesContainer) {
        console.error('❌ Контейнер курсов не найден');
        return;
    }
    
    if (!courses || courses.length === 0) {
        coursesContainer.innerHTML = `
            <div class="empty-state">
                <h3>У вас пока нет курсов</h3>
                <p>Создайте свой первый курс, чтобы начать работу</p>
                <button class="btn btn-primary" onclick="document.getElementById('create-course-modal').style.display='block'">
                    Создать курс
                </button>
            </div>
        `;
        return;
    }
    
    coursesContainer.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-header">
                <h3 class="course-title">${course.name}</h3>
                <div class="course-actions">
                    <button class="btn-icon" onclick="manageCourse(${course.id})" title="Управление">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="btn-icon" onclick="copyInviteCode('${course.invite_code}')" title="Скопировать код приглашения">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </div>
            </div>
            <div class="course-info">
                <p class="course-description">${course.description || 'Описание отсутствует'}</p>
                <div class="course-meta">
                    <span class="meta-item">
                        <i class="fas fa-book"></i>
                        ${course.discipline}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-calendar"></i>
                        ${new Date(course.created_at).toLocaleDateString('ru-RU')}
                    </span>
                </div>
            </div>
            <div class="course-footer">
                <button class="btn btn-outline" onclick="manageCourse(${course.id})">
                    Управление курсом
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Отображено ${courses.length} курсов`);
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
    
    console.log('📝 Данные для создания курса:', courseData);
    
    try {
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Курс создан:', result.course);
            showNotification('Курс успешно создан', 'success');
            
            // Закрыть модальное окно
            document.getElementById('create-course-modal').style.display = 'none';
            
            // Очистить форму
            form.reset();
            
            // Обновить список курсов
            await loadTeacherCourses();
        } else {
            console.error('❌ Ошибка создания курса:', result.error);
            showNotification(result.error || 'Ошибка создания курса', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка создания курса:', error);
        showNotification('Ошибка создания курса', 'error');
    }
}

async function manageCourse(courseId) {
    console.log('🎯 Управление курсом:', courseId);
    currentCourseId = courseId;
    
    try {
        // Загружаем информацию о курсе
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
            credentials: 'include'
        });
        
        if (!courseResponse.ok) {
            throw new Error('Ошибка загрузки данных курса');
        }
        
        const courseData = await courseResponse.json();
        console.log('📊 Данные курса:', courseData);
        
        // Обновляем заголовок модального окна
        const modalTitle = document.querySelector('#course-management-modal .modal-title');
        if (modalTitle) {
            modalTitle.textContent = `Управление курсом: ${courseData.course.name}`;
        }
        
        // Отображаем код приглашения
        const inviteCodeElement = document.getElementById('course-invite-code');
        if (inviteCodeElement) {
            inviteCodeElement.textContent = courseData.course.invite_code;
        }
        
        // Загружаем лабораторные работы
        await loadCourseLabs(courseId);
        
        // Загружаем студентов
        await loadCourseStudents(courseId);
        
        // Загружаем настройки
        loadCourseSettings(courseId);
        
        // Показываем модальное окно
        document.getElementById('course-management-modal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных курса:', error);
        showNotification('Ошибка загрузки данных курса', 'error');
    }
}

async function loadCourseLabs(courseId) {
    try {
        console.log('📚 Загрузка лабораторных работ курса:', courseId);
        
        const response = await fetch(`/api/courses/${courseId}/labs`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Лабораторные работы загружены:', data.labs);
            
            displayCourseLabs(data.labs);
        } else {
            console.error('❌ Ошибка загрузки лабораторных работ');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки лабораторных работ:', error);
    }
}

function displayCourseLabs(labs) {
    const labsContainer = document.getElementById('course-labs-container');
    
    if (!labsContainer) {
        console.error('❌ Контейнер лабораторных работ не найден');
        return;
    }
    
    if (!labs || labs.length === 0) {
        labsContainer.innerHTML = `
            <div class="empty-state">
                <h4>Лабораторные работы отсутствуют</h4>
                <p>Создайте первую лабораторную работу для этого курса</p>
                <button class="btn btn-primary" onclick="openCreateLabModal()">
                    Создать лабораторную работу
                </button>
            </div>
        `;
        return;
    }
    
    labsContainer.innerHTML = labs.map(lab => `
        <div class="lab-item" data-lab-id="${lab.id}">
            <div class="lab-info">
                <h4 class="lab-title">${lab.title}</h4>
                <p class="lab-description">${lab.description}</p>
                <div class="lab-meta">
                    <span class="meta-item">
                        <i class="fas fa-calendar"></i>
                        ${lab.start_date ? new Date(lab.start_date).toLocaleDateString('ru-RU') : 'Не указано'}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-clock"></i>
                        ${lab.deadline ? new Date(lab.deadline).toLocaleDateString('ru-RU') : 'Не указано'}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-star"></i>
                        Макс. балл: ${lab.max_score || 10}
                    </span>
                </div>
            </div>
            <div class="lab-actions">
                <button class="btn btn-outline" onclick="viewLabSubmissions(${lab.id})">
                    Просмотр работ
                </button>
                <button class="btn-icon" onclick="editLab(${lab.id})" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteLab(${lab.id})" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Отображено ${labs.length} лабораторных работ`);
}

function openCreateLabModal() {
    if (!currentCourseId) {
        showNotification('Сначала выберите курс', 'error');
        return;
    }
    
    // Очищаем форму
    const form = document.getElementById('lab-create-form');
    form.reset();
    
    // Устанавливаем текущую дату в качестве минимальной
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('lab-start-date');
    const deadlineInput = document.getElementById('lab-deadline');
    
    if (startDateInput) startDateInput.min = today;
    if (deadlineInput) deadlineInput.min = today;
    
    // Показываем модальное окно
    document.getElementById('create-lab-modal').style.display = 'block';
}

async function createNewLab() {
    const form = document.getElementById('lab-create-form');
    const formData = new FormData(form);
    
    const labData = {
        name: formData.get('lab-name'),
        course_id: currentCourseId,
        description: formData.get('lab-description'),
        template_code: formData.get('lab-template'),
        start_date: formData.get('lab-start-date') || null,
        deadline: formData.get('lab-deadline') || null,
        max_score: parseInt(formData.get('lab-max-score')) || 10,
        attempts: parseInt(formData.get('lab-attempts')) || 1,
        requirements: formData.get('lab-requirements')
    };
    
    console.log('📝 Данные для создания лабораторной работы:', labData);
    
    try {
        const response = await fetch('/api/labs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(labData),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Лабораторная работа создана:', result.lab);
            showNotification('Лабораторная работа успешно создана', 'success');
            
            // Закрыть модальное окно
            document.getElementById('create-lab-modal').style.display = 'none';
            
            // Очистить форму
            form.reset();
            
            // Обновить список лабораторных работ
            await loadCourseLabs(currentCourseId);
        } else {
            console.error('❌ Ошибка создания лабораторной работы:', result.error);
            showNotification(result.error || 'Ошибка создания лабораторной работы', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка создания лабораторной работы:', error);
        showNotification('Ошибка создания лабораторной работы', 'error');
    }
}

async function loadCourseStudents(courseId) {
    try {
        console.log('👥 Загрузка студентов курса:', courseId);
        
        const response = await fetch(`/api/courses/${courseId}/students`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Студенты загружены:', data.students);
            
            displayCourseStudents(data.students);
        } else {
            console.error('❌ Ошибка загрузки студентов');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки студентов:', error);
    }
}

function displayCourseStudents(students) {
    const studentsContainer = document.getElementById('course-students-container');
    
    if (!studentsContainer) {
        console.error('❌ Контейнер студентов не найден');
        return;
    }
    
    if (!students || students.length === 0) {
        studentsContainer.innerHTML = `
            <div class="empty-state">
                <h4>Студенты отсутствуют</h4>
                <p>Пока никто не присоединился к курсу</p>
                <div class="invite-section">
                    <p>Отправьте студентам код приглашения:</p>
                    <div class="invite-code-display">
                        <code id="students-invite-code">Загрузка...</code>
                        <button class="btn-icon" onclick="copyInviteCodeFromStudents()" title="Скопировать">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Обновляем код приглашения
        updateStudentsInviteCode();
        return;
    }
    
    studentsContainer.innerHTML = `
        <div class="students-header">
            <h4>Студенты курса (${students.length})</h4>
            <div class="invite-section">
                <span>Код приглашения:</span>
                <div class="invite-code-display">
                    <code id="students-invite-code">Загрузка...</code>
                    <button class="btn-icon" onclick="copyInviteCodeFromStudents()" title="Скопировать">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="students-list">
            ${students.map(student => `
                <div class="student-item">
                    <div class="student-avatar">
                        ${student.first_name.charAt(0)}${student.last_name.charAt(0)}
                    </div>
                    <div class="student-info">
                        <h5 class="student-name">${student.first_name} ${student.last_name}</h5>
                        <p class="student-details">
                            ${student.group_name ? `Группа: ${student.group_name}` : ''}
                            ${student.faculty ? ` • ${student.faculty}` : ''}
                        </p>
                        <p class="student-email">${student.email}</p>
                    </div>
                    <div class="student-meta">
                        <span class="join-date">
                            Присоединился: ${new Date(student.joined_at).toLocaleDateString('ru-RU')}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Обновляем код приглашения
    updateStudentsInviteCode();
    
    console.log(`✅ Отображено ${students.length} студентов`);
}

async function updateStudentsInviteCode() {
    if (!currentCourseId) return;
    
    try {
        const response = await fetch(`/api/courses/${currentCourseId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const inviteCodeElement = document.getElementById('students-invite-code');
            if (inviteCodeElement) {
                inviteCodeElement.textContent = data.course.invite_code;
            }
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки кода приглашения:', error);
    }
}

function loadCourseSettings(courseId) {
    // Загружаем настройки курса
    console.log('⚙️ Загрузка настроек курса:', courseId);
    
    // TODO: Реализовать загрузку и отображение настроек курса
}

function copyInviteCode(inviteCode) {
    navigator.clipboard.writeText(inviteCode).then(() => {
        showNotification('Код приглашения скопирован', 'success');
    }).catch(err => {
        console.error('❌ Ошибка копирования:', err);
        showNotification('Ошибка копирования', 'error');
    });
}

function copyInviteCodeFromStudents() {
    const inviteCodeElement = document.getElementById('students-invite-code');
    if (inviteCodeElement) {
        copyInviteCode(inviteCodeElement.textContent);
    }
}

// Функции для других вкладок (заглушки)
async function loadWorksToCheck() {
    console.log('📝 Загрузка работ для проверки');
    // TODO: Реализовать загрузку работ для проверки
}

function loadStatementData() {
    console.log('📊 Загрузка данных ведомостей');
    // TODO: Реализовать загрузку ведомостей
}

function loadSettingsData() {
    console.log('⚙️ Загрузка настроек');
    // TODO: Реализовать загрузку настроек
}

function loadTeacherChats() {
    console.log('💬 Загрузка чатов преподавателя');
    // TODO: Реализовать загрузку чатов
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

// Функции для работы с лабораторными работами (заглушки)
function viewLabSubmissions(labId) {
    console.log('👀 Просмотр работ для лабораторной:', labId);
    showNotification('Функция просмотра работ в разработке', 'info');
}

function editLab(labId) {
    console.log('✏️ Редактирование лабораторной:', labId);
    showNotification('Функция редактирования в разработке', 'info');
}

function deleteLab(labId) {
    console.log('🗑️ Удаление лабораторной:', labId);
    if (confirm('Вы уверены, что хотите удалить эту лабораторную работу?')) {
        showNotification('Функция удаления в разработке', 'info');
    }
}